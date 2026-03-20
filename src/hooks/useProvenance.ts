import { useQuery } from "@tanstack/react-query";
import { useAptosClient } from "@/utils/aptosClient";
import type { ProvenanceRecord } from "@/types/nft";
import {
  VIEW_GET_PROVENANCE,
  VIEW_HAS_PROVENANCE,
  VIEW_GET_ACCESS_STATS,
  VIEW_GET_CREATOR_STATS,
} from "@/constants";

export function useProvenance(tokenAddress: string | undefined) {
  const aptos = useAptosClient();

  return useQuery({
    queryKey: ["provenance", tokenAddress],
    enabled: !!tokenAddress,
    queryFn: async (): Promise<ProvenanceRecord> => {
      const result = await aptos.view({
        payload: {
          function: VIEW_GET_PROVENANCE as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [tokenAddress!],
        },
      });
      const [
        blobPath, merkleRoot, metadataHash, aiModel,
        aiPromptPreview, shelbyTxHash, creationTimestamp,
        royaltyBps, accessType, pricePerAccess,
      ] = result as [string, string, string, string, string, string, string, string, number, string];

      return {
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
      };
    },
  });
}

export function useHasProvenance(tokenAddress: string | undefined) {
  const aptos = useAptosClient();

  return useQuery({
    queryKey: ["has-provenance", tokenAddress],
    enabled: !!tokenAddress,
    queryFn: async (): Promise<boolean> => {
      const [result] = await aptos.view({
        payload: {
          function: VIEW_HAS_PROVENANCE as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [tokenAddress!],
        },
      });
      return result as boolean;
    },
  });
}

export function useAccessStats(tokenAddress: string | undefined) {
  const aptos = useAptosClient();

  return useQuery({
    queryKey: ["access-stats", tokenAddress],
    enabled: !!tokenAddress,
    queryFn: async () => {
      const [views, revenue] = await aptos.view({
        payload: {
          function: VIEW_GET_ACCESS_STATS as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [tokenAddress!],
        },
      }) as [string, string];
      return { totalViews: BigInt(views), totalRevenue: BigInt(revenue) };
    },
  });
}

export function useCreatorStats(creator: string | undefined) {
  const aptos = useAptosClient();

  return useQuery({
    queryKey: ["creator-stats", creator],
    enabled: !!creator,
    queryFn: async () => {
      const [minted, revenue, views] = await aptos.view({
        payload: {
          function: VIEW_GET_CREATOR_STATS as `${string}::${string}::${string}`,
          typeArguments: [],
          functionArguments: [creator!],
        },
      }) as [string, string, string];
      return {
        totalMinted:  BigInt(minted),
        totalRevenue: BigInt(revenue),
        totalViews:   BigInt(views),
      };
    },
  });
}
