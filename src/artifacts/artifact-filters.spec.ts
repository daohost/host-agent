import {
  countArtifactsByLoseReason,
  matchesLoseReason,
  matchesMiner,
  sortArtifactsByValue,
  validateArtifactSort,
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

  it('defaults value sorting to descending order', () => {
    const artifacts = [
      { id: 'low', value: { income: 1 } },
      { id: 'high', value: { income: 2 } },
    ] as never[];

    expect(
      sortArtifactsByValue(artifacts, 'income').map(({ id }) => id),
    ).toEqual(['high', 'low']);
  });

  it('sorts zero and negative values numerically', () => {
    const artifacts = [
      { id: 'zero', value: { profit: 0 } },
      { id: 'positive', value: { profit: 2 } },
      { id: 'negative', value: { profit: -2 } },
    ] as never[];

    expect(
      sortArtifactsByValue(artifacts, 'profit', 'asc').map(({ id }) => id),
    ).toEqual(['negative', 'zero', 'positive']);
  });

  it('validates supported sort query values', () => {
    expect(validateArtifactSort('income', 'asc')).toEqual({
      sort: 'income',
      order: 'asc',
    });
    expect(validateArtifactSort()).toEqual({
      sort: undefined,
      order: undefined,
    });
    expect(() => validateArtifactSort('created', 'asc')).toThrow(
      'sort must be one of: income, profit',
    );
    expect(() => validateArtifactSort('income', 'sideways')).toThrow(
      'order must be one of: asc, desc',
    );
  });
});
