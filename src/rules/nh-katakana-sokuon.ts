/**
 * nh-katakana-sokuon — 外来語の促音は小書き「ッ」
 *
 * 「外来語の表記」（1991年内閣告示）§3(2)①:
 *   促音（つまる音）は小書きの「ッ」を用いる。
 *
 * 検出対象:
 *   カタカナ文字列内で前後がカタカナに挟まれた大書き「ツ」を促音の誤記として検出する。
 *
 * 偽陽性回避:
 *   - 語頭の「ツ」（ツアー・ツール等）は先行カタカナがないため対象外。
 *   - 「ヅ」は nh-katakana-di-du で別途対応。
 *   - 中黒「・」は lookbehind/lookahead から除外（連語・複合語の区切りは促音でない）。
 *   - 直前がすでに小書き「ッ」の場合は除外（ピッツァ等のクラスター）。
 *   - カツラ・マツダ・ウォルツ・ワルツ・ピッツァ・ピッツェリア 等の固有名詞・外来語を
 *     単語レベルの除外リストで対象外とする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 中黒を除いたカタカナ文字のみでチェック（語内のツ）。
// (?<=…) lookbehind はNode.js v10以降でサポート。
const SOKUON_PATTERN = /(?<=[ァ-ヶー])ツ(?=[ァ-ヶー])/g;

// 正当なカタカナ語（語全体として除外するリスト）
const WORD_EXCLUSIONS = new Set([
  "カツラ",
  "マツダ",
  "ウォルツ",
  "ワルツ",
  "ピッツァ",
  "ピッツェリア",
]);

/**
 * 指定位置を含むカタカナ語（中黒を含む連語境界も許容）を抽出する。
 */
function extractKatakanaWord(text: string, pos: number): string {
  let start = pos;
  while (start > 0 && /[ァ-ヶー・]/.test(text[start - 1])) start--;
  let end = pos;
  while (end < text.length && /[ァ-ヶー・]/.test(text[end])) end++;
  return text.slice(start, end);
}

export function createNhKatakanaSokuon(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-sokuon");
  if (!meta) throw new Error("manifest is missing the nh-katakana-sokuon rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaSokuon extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const rawIssues = toolkit.regexReplace({
        text,
        pattern: SOKUON_PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use small ッ (not large ツ) for geminate consonants in katakana loanwords",
        messageJa: "日本語表記（日本エディタースクール）第8章に基づき、外来語の促音（つまる音）には小書き「ッ」を使用します。",
        replacement: () => "ッ",
        fixLabelJa: "「ッ」に修正",
        reference: {
          standard: "外来語の表記（1991年内閣告示）",
          section: "§3(2)①",
        },
      });

      // 直前が「ッ」の場合（ピッツァ等）または語全体が除外リストにある場合を除去
      return rawIssues.filter((issue) => {
        if (issue.from > 0 && text[issue.from - 1] === "ッ") return false;
        const word = extractKatakanaWord(text, issue.from);
        if (WORD_EXCLUSIONS.has(word)) return false;
        return true;
      });
    }
  }

  return new NhKatakanaSokuon(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
