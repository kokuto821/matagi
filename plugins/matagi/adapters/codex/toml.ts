/**
 * Codex 向け TOML 出力で共有する文字列シリアライザ。
 * Node 標準に TOML writer が無く、依存追加も避けるため、必要な basic string のみ自前で扱う。
 */

const SHORT_ESCAPES: Record<string, string> = {
  "\b": "\\b",
  "\t": "\\t",
  "\n": "\\n",
  "\f": "\\f",
  "\r": "\\r",
  '"': '\\"',
  "\\": "\\\\",
};

const toUnicodeEscape = (char: string): string => {
  return `\\u${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
};

const escapeChar = (char: string): string =>
  SHORT_ESCAPES[char] ?? toUnicodeEscape(char);

// TOML basic string で生のまま書けない文字: 制御文字 U+0000-001F / U+007F、\ と "
const BASIC_STRING_UNSAFE = /[\u0000-\u001F\u007F\\"]/g;
// multi-line では改行(\n)とタブ(\t)は生のまま書ける。" は """ 連続時のみ別途処理する
const MULTILINE_UNSAFE = /[\u0000-\u0008\u000B-\u001F\u007F\\]/g;

/** 1行の TOML basic string（"..."）にシリアライズする。 */
export const tomlString = (value: string): string => {
  return `"${value.replace(BASIC_STRING_UNSAFE, escapeChar)}"`;
};

/**
 * 複数行の TOML basic multi-line string（"""..."""）にシリアライズする。
 * 改行(\n)・タブ以外の制御文字は、単独の \r を含めてエスケープする。
 */
export const tomlMultilineString = (value: string): string => {
  const escaped = value
    .replace(MULTILINE_UNSAFE, escapeChar)
    .replaceAll('"""', '""\\"');
  return `"""\n${escaped}"""`;
};
