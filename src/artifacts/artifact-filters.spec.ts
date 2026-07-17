import {
  countArtifactsByLoseReason,
  matchesLoseReason,
  matchesMiner,
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
});
