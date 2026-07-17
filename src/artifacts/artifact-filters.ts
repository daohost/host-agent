import type { IMevArtifact } from '@daohost/host';

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
