// テスト共通のヘルパー・定数。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

export const COMMON_PATH = "prompt-commons/injection-guard.md";
export const SECOND_COMMON_PATH = "prompt-commons/output-format.md";
export const END_LINE_TEXT = "<!-- @end -->";
export const BACKTICK_FENCE = "```";
export const TILDE_FENCE = "~~~";
export const FRONTMATTER_DELIMITER = "---";

export function startLineTextOf(path: string): string {
  return `<!-- @import ${path} -->`;
}

export function toText(lines: string[], eol = "\n"): string {
  return lines.join(eol);
}
