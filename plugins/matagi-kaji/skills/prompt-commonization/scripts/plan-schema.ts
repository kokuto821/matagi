// 承認済み共通化計画（JSON）の形の検証。
// 記法の正: shared-rules/prompt-commonization/commonization-rule.md

import type { Plan, PlanOccurrence, PlanPhrase } from "./apply.ts";

export type PlanParseResult = { plan: Plan } | { errors: string[] };

type JsonObject = Record<string, unknown>;

const PLAN_NOT_OBJECT_MESSAGE =
  "計画のトップレベルはオブジェクトである必要があります";
const INVALID_JSON_MESSAGE = "計画が JSON として読めません";

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function childPath(parent: string, key: string): string {
  return parent === "" ? key : `${parent}.${key}`;
}

function objectAt(
  value: unknown,
  path: string,
  errors: string[],
): JsonObject | undefined {
  if (isJsonObject(value)) {
    return value;
  }
  errors.push(`${path}: オブジェクトである必要があります`);
  return undefined;
}

function stringAt(
  source: JsonObject,
  key: string,
  parent: string,
  errors: string[],
): string | undefined {
  const value = source[key];
  if (typeof value === "string") {
    return value;
  }
  errors.push(`${childPath(parent, key)}: 文字列である必要があります`);
  return undefined;
}

function integerAt(
  source: JsonObject,
  key: string,
  parent: string,
  errors: string[],
): number | undefined {
  const value = source[key];
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  errors.push(`${childPath(parent, key)}: 整数である必要があります`);
  return undefined;
}

function arrayAt(
  source: JsonObject,
  key: string,
  parent: string,
  errors: string[],
): unknown[] | undefined {
  const value = source[key];
  if (Array.isArray(value)) {
    return value;
  }
  errors.push(`${childPath(parent, key)}: 配列である必要があります`);
  return undefined;
}

// 要素ごとに検証し、不正な要素は errors に積んで結果から除く。
function parseItems<T>(
  items: unknown[],
  path: string,
  parseItem: (
    item: unknown,
    itemPath: string,
    errors: string[],
  ) => T | undefined,
  errors: string[],
): T[] {
  return items.flatMap((item, index) => {
    const parsed = parseItem(item, `${path}[${index}]`, errors);
    return parsed === undefined ? [] : [parsed];
  });
}

function parseOccurrence(
  item: unknown,
  path: string,
  errors: string[],
): PlanOccurrence | undefined {
  const source = objectAt(item, path, errors);
  if (source === undefined) {
    return undefined;
  }
  const file = stringAt(source, "file", path, errors);
  const startLine = integerAt(source, "startLine", path, errors);
  const endLine = integerAt(source, "endLine", path, errors);
  const expectedText = stringAt(source, "expectedText", path, errors);
  if (
    file === undefined ||
    startLine === undefined ||
    endLine === undefined ||
    expectedText === undefined
  ) {
    return undefined;
  }
  return { file, startLine, endLine, expectedText };
}

function parsePhrase(
  item: unknown,
  path: string,
  errors: string[],
): PlanPhrase | undefined {
  const source = objectAt(item, path, errors);
  if (source === undefined) {
    return undefined;
  }
  const name = stringAt(source, "name", path, errors);
  const text = stringAt(source, "text", path, errors);
  const occurrenceItems = arrayAt(source, "occurrences", path, errors);
  if (
    name === undefined ||
    text === undefined ||
    occurrenceItems === undefined
  ) {
    return undefined;
  }
  const occurrences = parseItems(
    occurrenceItems,
    childPath(path, "occurrences"),
    parseOccurrence,
    errors,
  );
  return { name, text, occurrences };
}

// 計画 JSON を検証して Plan にする。形の違反は該当箇所のパスつきで全て返す。
export function parsePlan(text: string): PlanParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { errors: [INVALID_JSON_MESSAGE] };
  }
  if (!isJsonObject(json)) {
    return { errors: [PLAN_NOT_OBJECT_MESSAGE] };
  }

  const errors: string[] = [];
  const dir = stringAt(json, "dir", "", errors);
  const phraseItems = arrayAt(json, "phrases", "", errors);
  const phrases =
    phraseItems === undefined
      ? []
      : parseItems(phraseItems, "phrases", parsePhrase, errors);
  if (errors.length > 0 || dir === undefined) {
    return { errors };
  }
  return { plan: { dir, phrases } };
}
