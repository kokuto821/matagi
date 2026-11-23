// 検証結果（Finding）と、その共通メッセージ。check と expand が共有する。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { ParseError } from "./markdown-scan.ts";

export type PhraseFailureKind =
  | "missing-phrase"
  | "invalid-phrase"
  | "invalid-path";

export type FindingKind =
  | ParseError["kind"]
  | PhraseFailureKind
  | "stale"
  | "import-in-phrase"
  | "frontmatter-in-phrase"
  | "unclosed-fence-in-phrase";

export type Finding = {
  kind: FindingKind;
  line: number;
  message: string;
};

export const PARSE_ERROR_MESSAGES: Record<ParseError["kind"], string> = {
  unclosed: "@import に対応する @end がありません",
  "orphan-end": "対応する @import のない @end があります",
  nested: "@import ブロックの内側に別の @import があります（ネスト禁止）",
};

export function missingPhraseMessageOf(path: string): string {
  return `共通文言ファイル ${path} が見つかりません`;
}

export function invalidPhraseMessageOf(path: string): string {
  return `共通文言ファイル ${path} の内容が不正です（@import / @end の単独行・frontmatter・閉じていないコードフェンスは不可。check で詳細を確認してください）`;
}

export function invalidPathMessageOf(path: string): string {
  return `@import のパス ${path} が不正です（絶対パス・.. を含むパスは不可）`;
}

const PHRASE_FAILURE_MESSAGES: Record<
  PhraseFailureKind,
  (path: string) => string
> = {
  "missing-phrase": missingPhraseMessageOf,
  "invalid-phrase": invalidPhraseMessageOf,
  "invalid-path": invalidPathMessageOf,
};

export function findingOfParseError({ kind, line }: ParseError): Finding {
  return { kind, line, message: PARSE_ERROR_MESSAGES[kind] };
}

export function findingOfPhraseFailure(
  kind: PhraseFailureKind,
  line: number,
  path: string,
): Finding {
  return { kind, line, message: PHRASE_FAILURE_MESSAGES[kind](path) };
}

export function formatFinding(file: string, finding: Finding): string {
  return `${file}:${finding.line}: ${finding.message}`;
}
