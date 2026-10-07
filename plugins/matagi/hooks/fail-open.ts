/**
 * フックの fail-open（判定不能時に許可する）経路で stderr に残す 1 行メッセージの整形と出力。
 *
 * 実行スクリプト（protected-branch-guard.ts 等）は import すると main が走るため、
 * テストから import できるようこのモジュールに切り出している。
 */

export const FAIL_OPEN_PREFIX =
  "protected-branch-guard: 判定中に例外が発生したため許可しました: ";

/** 整形後の例外メッセージ部分の最大文字数（stderr の肥大化防止）。 */
export const FAIL_OPEN_MAX_DETAIL_LENGTH = 500;

/** 例外から stderr 用の 1 行メッセージ（改行終端付き）を作る。純関数。 */
export const formatFailOpenMessage = (error: unknown): string => {
  const detail = (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .trim();
  const truncated =
    detail.length > FAIL_OPEN_MAX_DETAIL_LENGTH
      ? `${detail.slice(0, FAIL_OPEN_MAX_DETAIL_LENGTH)}…`
      : detail;
  return `${FAIL_OPEN_PREFIX}${truncated}\n`;
};

/**
 * 判定不能の原因を stderr に 1 行残す。stderr への書き込み失敗は握りつぶし、呼び出し元が必ず許可に到達できるようにする。
 * @param write 出力関数（既定: process.stderr.write）。テストで差し替える。
 */
export const reportFailOpen = (
  error: unknown,
  write: (message: string) => unknown = (message) =>
    process.stderr.write(message),
): void => {
  try {
    write(formatFailOpenMessage(error));
  } catch {
    // 診断出力の失敗で fail-open（許可）を妨げない
  }
};
