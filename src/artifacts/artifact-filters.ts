import type { IMevArtifact } from '@daohost/host';
import { BadRequestException } from '@nestjs/common';

export const ARTIFACT_SORT_FIELDS = ['income', 'profit'] as const;
export const ARTIFACT_SORT_ORDERS = ['asc', 'desc'] as const;

export type ArtifactSortField = (typeof ARTIFACT_SORT_FIELDS)[number];
export type ArtifactSortOrder = (typeof ARTIFACT_SORT_ORDERS)[number];

export function validateArtifactSort(
  sort?: string,
  order?: string,
): {
  sort?: ArtifactSortField;
  order?: ArtifactSortOrder;
} {
  if (sort && !ARTIFACT_SORT_FIELDS.includes(sort as ArtifactSortField)) {
    throw new BadRequestException(
      `sort must be one of: ${ARTIFACT_SORT_FIELDS.join(', ')}`,
    );
  }

  if (order && !ARTIFACT_SORT_ORDERS.includes(order as ArtifactSortOrder)) {
    throw new BadRequestException(
      `order must be one of: ${ARTIFACT_SORT_ORDERS.join(', ')}`,
    );
  }

  return {
    sort: sort as ArtifactSortField | undefined,
    order: order as ArtifactSortOrder | undefined,
  };
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

export function matchesLoseReason(
  artifact: IMevArtifact,
  loseReason?: string,
): boolean {
  const expected = normalize(loseReason);
  if (!expected) return true;
  return normalize(artifact.compare?.result) === expected;
}

export function matchesMiner(artifact: IMevArtifact, miner?: string): boolean {
  const expected = normalize(miner);
  if (!expected) return true;
  return normalize(artifact.value?.miner) === expected;
}

export function countArtifactsByLoseReason(
  artifacts: IMevArtifact[],
): Record<string, number> {
  const totals = new Map<string, { label: string; total: number }>();

  for (const artifact of artifacts) {
    const label = artifact.compare?.result?.trim();
    if (!label) continue;

    const key = normalize(label);
    const current = totals.get(key);
    if (current) {
      current.total++;
    } else {
      totals.set(key, { label, total: 1 });
    }
  }

  return Object.fromEntries(
    [...totals.values()]
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(({ label, total }) => [label, total]),
  );
}

export function sortArtifactsByValue<T extends IMevArtifact>(
  artifacts: T[],
  sort?: ArtifactSortField,
  order?: ArtifactSortOrder,
): T[] {
  if (!sort) {
    return artifacts;
  }

  const direction = order === 'asc' ? 1 : -1;
  return [...artifacts].sort((a, b) => {
    const aValue = a.value?.[sort];
    const bValue = b.value?.[sort];
    const aPresent = Number.isFinite(aValue);
    const bPresent = Number.isFinite(bValue);

    if (!aPresent && !bPresent) return 0;
    if (!aPresent) return 1;
    if (!bPresent) return -1;
    return (aValue! - bValue!) * direction;
  });
}
