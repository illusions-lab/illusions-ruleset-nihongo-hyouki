/**
 * nh-katakana-small-ya-yu-yo — 拗音「ヤ・ユ・ヨ」の大書き禁止
 *
 * 「外来語の表記」（1991年内閣告示）§3(2)②:
 *   拗音に用いる「ヤ」「ユ」「ヨ」は小書きにする（「ャ」「ュ」「ョ」）。
 *
 * 対象パターン:
 *   「シ・チ・ジ・ニ・ヒ・ミ・リ・ギ・キ・ビ・ピ」直後の大書き「ヤ・ユ・ヨ」を検出する。
 *   その後に2字以上のカタカナが続く（外来語語内の使用）ことを条件とすることで、
 *   「ニヤリとした」などの日本語擬態語を除外する。
 *
 * 偽陽性回避:
 *   - 語頭の「ヤ・ユ・ヨ」（ヤード・ユニット等）は先行子音系仮名がないため対象外。
 *   - 直後2字以上のカタカナを要求することで、「ニヤリ」など短い語を除外。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 子音系仮名（拗音構成に現れる）
const CONSONANT_KANA = "シチジニヒミリギキビピ";

const PAIRS: ReadonlyArray<{ pattern: RegExp; bigKana: string; smallKana: string }> = [
  {
    // [子音系仮名]ヤ + 2文字以上のカタカナ続く → 小書きャ
    pattern: new RegExp(`([${CONSONANT_KANA}])ヤ(?=[ァ-ヶー・][ァ-ヶー・])`, "g"),
    bigKana: "ヤ",
    smallKana: "ャ",
  },
  {
    pattern: new RegExp(`([${CONSONANT_KANA}])ユ(?=[ァ-ヶー・][ァ-ヶー・])`, "g"),
    bigKana: "ユ",
    smallKana: "ュ",
  },
  {
    pattern: new RegExp(`([${CONSONANT_KANA}])ヨ(?=[ァ-ヶー・][ァ-ヶー・])`, "g"),
    bigKana: "ヨ",
    smallKana: "ョ",
  },
];

export function createNhKatakanaSmallYaYuYo(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-small-ya-yu-yo");
  if (!meta) throw new Error("manifest is missing the nh-katakana-small-ya-yu-yo rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaSmallYaYuYo extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, bigKana, smallKana } of PAIRS) {
        issues.push(
          ...toolkit.regexReplace({
            text,
            pattern,
            ruleId: this.id,
            severity: config.severity,
            message: `Use small ${smallKana} (not large ${bigKana}) for syllable in katakana loanword`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語の拗音には小書き「${smallKana}」を使用します（大書き「${bigKana}」は不可）。`,
            replacement: (m) => `${m[1]}${smallKana}`,
            fixLabelJa: `「${smallKana}」に修正`,
            reference: {
              standard: "外来語の表記（1991年内閣告示）",
              section: "§3(2)②",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKatakanaSmallYaYuYo(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
