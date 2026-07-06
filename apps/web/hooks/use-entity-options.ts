"use client";

import { useQuery } from "@tanstack/react-query";

export type EntityOption = {
  value: string;
  label: string;
};

export function useEntityOptions({
  queryKey,
  queryFn,
  enabled = true,
}: {
  queryKey: readonly unknown[];
  queryFn: () => Promise<EntityOption[]>;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 60_000,
  });
}
