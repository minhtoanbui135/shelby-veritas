"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useUploadBlobs, useEncodeBlobs, useRegisterCommitments } from "@shelby-protocol/react";
import { toast } from "sonner";
import type { UploadStep } from "@/components/upload/UploadProgress";
import type { UploadResult, NFTMetadata, CreateFormState } from "@/types/nft";
import { buildBlobPath, buildBlobUrl, slugify, blobExists } from "@/lib/shelby";
import { useAptosClient } from "@/utils/aptosClient";
import { FN_MINT_WITH_PROVENANCE, EXPIRY_5_YEARS_MICROS, VERITAS_COLLECTION } from "@/constants";

export function useMint() {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptos = useAptosClient();
  const [step, setStep]     = useState<UploadStep>("idle");
  const [error, setError]   = useState<string | undefined>();
  const [result, setResult] = useState<{ txHash: string; upload: UploadResult } | null>(null);

  const { mutateAsync: encodeBlobs }         = useEncodeBlobs();
  const { mutateAsync: registerCommitments } = useRegisterCommitments({});
  const { mutateAsync: uploadBlobs }         = useUploadBlobs({});

  async function mint(form: CreateFormState) {
    if (!account || !signAndSubmitTransaction || !form.file) return;
    setError(undefined);
    setStep("checking");

    try {
      const ext        = form.file.type.startsWith("video") ? "mp4" : "png";
      const accountHex = account.address.toString();

      // Generate a slug, retrying with a fresh one if Shelby rejects it as duplicate.
      // The HEAD pre-flight catches fully-uploaded duplicates; the retry loop catches
      // blobs that are registered on-chain but not yet uploaded (invisible to HEAD).
      let slug    = slugify(form.tokenName);
      let artName = `nfts/${slug}/artwork.${ext}`;
      let metaName = `nfts/${slug}/metadata.json`;

      // Pre-flight: check HTTP accessibility (catches obvious re-uploads)
      const [artExists, metaExists] = await Promise.all([
        blobExists(accountHex, artName),
        blobExists(accountHex, metaName),
      ]);
      if (artExists || metaExists) {
        slug     = slugify(form.tokenName);
        artName  = `nfts/${slug}/artwork.${ext}`;
        metaName = `nfts/${slug}/metadata.json`;
      }

      setStep("encoding");

      // Build metadata JSON
      const artworkUrl = buildBlobUrl(accountHex, slug, `artwork.${ext}`);
      const metadata: NFTMetadata = {
        name:        form.tokenName,
        description: form.description,
        image:       artworkUrl,
        attributes: [
          { trait_type: "AI Model",   value: form.aiModel },
          ...(form.seed  ? [{ trait_type: "Seed",  value: Number(form.seed)  }] : []),
          ...(form.steps ? [{ trait_type: "Steps", value: Number(form.steps) }] : []),
        ],
        provenance: {
          aiModel:        form.aiModel,
          aiModelVersion: form.aiModelVersion  || undefined,
          prompt:         form.prompt,
          negativePrompt: form.negativePrompt  || undefined,
          seed:     form.seed     ? Number(form.seed)     : undefined,
          steps:    form.steps    ? Number(form.steps)    : undefined,
          cfgScale: form.cfgScale ? Number(form.cfgScale) : undefined,
          sampler:        form.sampler        || undefined,
          generationTool: form.generationTool || undefined,
          generatedAt:    new Date().toISOString(),
          generatorWallet: accountHex,
        },
        storage: {
          provider:     "shelby",
          network:      "shelbynet",
          blobPath:     buildBlobPath(accountHex, slug, `artwork.${ext}`),
          merkleRoot:   "",   // filled after encoding
          shelbyTxHash: "",   // filled after registering
          storedAt:     new Date().toISOString(),
        },
      };

      const artworkBytes  = new Uint8Array(await form.file.arrayBuffer());
      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata, null, 2));

      // 1. Encode — returns BlobCommitments[] with blob_merkle_root
      const [artCommitment, metaCommitment] = await encodeBlobs({
        blobs: [
          { blobData: artworkBytes  },
          { blobData: metadataBytes },
        ],
      });

      const merkleRoot   = artCommitment.blob_merkle_root;
      const metadataHash = metaCommitment.blob_merkle_root;
      const expirationMicros = Date.now() * 1000 + Number(EXPIRY_5_YEARS_MICROS);

      setStep("registering");

      // 2. Register commitments on-chain (user signs wallet tx).
      // If Shelby rejects with "already exists" (blob registered but not uploaded
      // from a prior partial attempt), regenerate the slug and re-encode silently.
      let shelbyTxHash: string;
      try {
        ({ hash: shelbyTxHash } = await registerCommitments({
          signer: { account: account.address, signAndSubmitTransaction },
          commitments: [
            { blobName: artName,  commitment: artCommitment  },
            { blobName: metaName, commitment: metaCommitment },
          ],
          expirationMicros,
        }));
      } catch (regErr: unknown) {
        const msg = regErr instanceof Error ? regErr.message : String(regErr);
        if (!msg.toLowerCase().includes("already exists")) throw regErr;

        // Stale registration — silently pick a new slug and re-encode + re-register
        slug     = slugify(form.tokenName);
        artName  = `nfts/${slug}/artwork.${ext}`;
        metaName = `nfts/${slug}/metadata.json`;

        const [newArt, newMeta] = await encodeBlobs({
          blobs: [{ blobData: artworkBytes }, { blobData: metadataBytes }],
        });

        ({ hash: shelbyTxHash } = await registerCommitments({
          signer: { account: account.address, signAndSubmitTransaction },
          commitments: [
            { blobName: artName,  commitment: newArt  },
            { blobName: metaName, commitment: newMeta },
          ],
          expirationMicros,
        }));
      }

      setStep("uploading");

      // 3. Upload blob data to Shelby RPC
      await uploadBlobs({
        signer: { account: account.address, signAndSubmitTransaction },
        blobs: [
          { blobName: artName,  blobData: artworkBytes  },
          { blobName: metaName, blobData: metadataBytes },
        ],
        expirationMicros,
      });

      const blobPath = buildBlobPath(accountHex, slug, `artwork.${ext}`);

      setStep("minting");

      // 4. Mint Aptos Digital Asset NFT with provenance
      const promptPreview = form.prompt.slice(0, 512);

      const txResponse = await signAndSubmitTransaction({
        data: {
          function:      FN_MINT_WITH_PROVENANCE as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [
            VERITAS_COLLECTION,
            form.tokenName,
            artworkUrl,
            blobPath,
            merkleRoot,
            metadataHash,
            form.aiModel,
            promptPreview,
            shelbyTxHash,
            form.royaltyBps,
            form.accessType,
            form.priceOctas || "0",
          ],
        },
      });

      await aptos.waitForTransaction({ transactionHash: txResponse.hash });

      const uploadResult: UploadResult = {
        blobPath,
        merkleRoot,
        metadataHash,
        shelbyTxHash,
        artworkUrl,
      };

      setResult({ txHash: txResponse.hash, upload: uploadResult });
      setStep("done");
      toast.success("NFT minted with provenance!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStep("error");
      toast.error("Mint failed", { description: msg.slice(0, 120) });
    }
  }

  function reset() {
    setStep("idle");
    setError(undefined);
    setResult(null);
  }

  return { mint, step, error, result, reset };
}
