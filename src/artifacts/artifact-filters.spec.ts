import {
  countArtifactsByLoseReason,
  matchesLoseReason,
  matchesMiner,
  sortArtifactsByValue,
} from './artifact-filters';

describe('artifact filters', () => {
  const artifact = (loseReason?: string, miner?: string) =>
    ({
      compare: loseReason ? { result: loseReason } : undefined,
      value: miner ? { miner } : undefined,
    }) as never;

  it('matches lose reasons strictly, ignoring case and outer whitespace', () => {
    const value = artifact('Making fail');

    expect(matchesLoseReason(value, ' making FAIL ')).toBe(true);
    expect(matchesLoseReason(value, 'Making')).toBe(false);
    expect(matchesLoseReason(value, 'fail')).toBe(false);
  });

  it('matches the full miner address case-insensitively', () => {
    const value = artifact(undefined, '0xAbCd');

    expect(matchesMiner(value, ' 0xabcd ')).toBe(true);
    expect(matchesMiner(value, '0xabc')).toBe(false);
  });

  it('counts lose reasons case-insensitively', () => {
    expect(
      countArtifactsByLoseReason([
        artifact('Making fail'),
        artifact(' making FAIL '),
        artifact('Unknown'),
        artifact(),
      ]),
    ).toEqual({
      'Making fail': 2,
      Unknown: 1,
    });
  });

  it('sorts artifacts by income and profit in both directions', () => {
    const artifacts = [
      { id: 'a', value: { income: 20, profit: 2 } },
      { id: 'b', value: { income: 10, profit: 3 } },
      { id: 'c', value: { income: 30, profit: 1 } },
    ] as never[];

    expect(
      sortArtifactsByValue(artifacts, 'income', 'asc').map(({ id }) => id),
    ).toEqual(['b', 'a', 'c']);
    expect(
      sortArtifactsByValue(artifacts, 'profit', 'desc').map(({ id }) => id),
    ).toEqual(['b', 'a', 'c']);
  });

  it('puts artifacts without the selected value last', () => {
    const artifacts = [
      { id: 'missing', value: { miner: '0x1' } },
      { id: 'valued', value: { income: 10 } },
    ] as never[];

    expect(
      sortArtifactsByValue(artifacts, 'income', 'asc').map(({ id }) => id),
    ).toEqual(['valued', 'missing']);
    expect(
      sortArtifactsByValue(artifacts, 'income', 'desc').map(({ id }) => id),
    ).toEqual(['valued', 'missing']);
  });
});
