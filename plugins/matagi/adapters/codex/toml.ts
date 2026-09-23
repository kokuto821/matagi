/**
 * Codex 向け TOML 出力で共有する文字列シリアライザ。
 * Node 標準に TOML writer が無く、依存追加も避けるため、必要な basic string のみ自前で扱う。
 */

/** 1行の TOML basic string（"..."）にシリアライズする。 */
export const tomlString = (value: string): string => {
  const escaped = value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t");
  return `"${escaped}"`;
};

/** 複数行の TOML basic multi-line string（"""..."""）にシリアライズする。 */
export const tomlMultilineString = (value: string): string => {
  const escaped = value.replaceAll("\\", "\\\\").replaceAll('"""', '""\\"');
  return `"""\n${escaped}"""`;
};
