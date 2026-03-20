import { useQuery } from "@tanstack/react-query";
import { useAptosClient } from "@/utils/aptosClient";
import { SHELBYNET_INDEXER, APTOS_API_KEY, VIEW_GET_PROVENANCE, VIEW_GET_ACCESS_STATS } from "@/constants";
import { blobPathToUrl } from "@/lib/shelby";
import type { VeritasNFT } from "@/types/nft";

const GALLERY_QUERY = `
  query GetVeritasNFTs($limit: Int, $offset: Int) {
    current_token_datas_v2(
      where: {
        current_collection: { collection_name: { _eq: "VERITAS" } }
      }
      limit: $limit
      offset: $offset
      order_by: { last_transaction_timestamp: desc }
    ) {
      token_data_id
      token_name
      description
      token_uri
      current_token_ownerships(limit: 1) {
        owner_address
      }
      current_collection {
        creator_address
        collection_name
      }
    }
  }
`;

async function fetchIndexer(query: string, variables: object) {
  const res = await fetch(SHELBYNET_INDEXER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(APTOS_API_KEY ? { Authorization: `Bearer ${APTOS_API_KEY}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export function useGalleryNFTs(limit = 48, offset = 0) {
  const aptos = useAptosClient();

  return useQuery({
    queryKey: ["gallery-nfts", limit, offset],
    queryFn: async (): Promise<VeritasNFT[]> => {
      // 1. Fetch token list from indexer
      const data = await fetchIndexer(GALLERY_QUERY, { limit, offset });
      const tokens = data.current_token_datas_v2 as {
        token_data_id: string;
        token_name: string;
        description: string;
        token_uri: string;
        current_token_ownerships: { owner_address: string }[];
        current_collection: { creator_address: string; collection_name: string };
      }[];

      if (!tokens.length) return [];

      // 2. Fetch provenance + stats for each token in parallel
      const nfts = await Promise.all(
        tokens.map(async (t) => {
          const tokenAddress = t.token_data_id;
          const owner = t.current_token_ownerships[0]?.owner_address ?? t.current_collection.creator_address;

          try {
            const [provRaw, statsRaw] = await Promise.all([
              aptos.view({
                payload: {
                  function: VIEW_GET_PROVENANCE as `${string}::${string}::${string}`,
                  typeArguments: [],
                  functionArguments: [tokenAddress],
                },
              }),
              aptos.view({
                payload: {
                  function: VIEW_GET_ACCESS_STATS as `${string}::${string}::${string}`,
                  typeArguments: [],
                  functionArguments: [tokenAddress],
                },
              }),
            ]);

            const [
              blobPath, merkleRoot, metadataHash, aiModel,
              aiPromptPreview, shelbyTxHash, creationTimestamp,
              royaltyBps, accessType, pricePerAccess,
            ] = provRaw as [string, string, string, string, string, string, string, string, number, string];

            const [views, revenue] = statsRaw as [string, string];

            const artworkUrl = blobPathToUrl(blobPath);

            const nft: VeritasNFT = {
              tokenAddress,
              name:           t.token_name,
              description:    t.description,
              creator:        t.current_collection.creator_address,
              owner,
              collectionName: t.current_collection.collection_name,
              artworkUrl,
              mediaType:      blobPath.endsWith(".mp4") || blobPath.endsWith(".webm") ? "video" : "image",
              provenance: {
                blobPath,
                merkleRoot,
                metadataHash,
                aiModel,
                aiPromptPreview,
                shelbyTxHash,
                creationTimestamp: BigInt(creationTimestamp),
                royaltyBps:        BigInt(royaltyBps),
                accessType:        Number(accessType),
                pricePerAccess:    BigInt(pricePerAccess),
              },
              totalViews:   BigInt(views),
              totalRevenue: BigInt(revenue),
              mintedAt:     Number(BigInt(creationTimestamp) / BigInt(1_000_000)),
            };

            return nft;
          } catch {
            // Token exists in indexer but has no provenance record — skip it
            return null;
          }
        })
      );

      return nfts.filter(Boolean) as VeritasNFT[];
    },
    staleTime: 30_000,
  });
}
