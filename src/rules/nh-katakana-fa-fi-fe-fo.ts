/**
 * nh-katakana-fa-fi-fe-fo — 「ファ・フィ・フェ・フォ」（第1表の仮名）
 *
 * 「外来語の表記」（1991年内閣告示）第1表 §3(3)⑤:
 *   原音の「ファ・フィ・フェ・フォ」は、慣用を除き小書き「ファ・フィ・フェ・フォ」と書く。
 *
 * 検出対象:
 *   「フア・フイ・フエ・フオ」（大書き母音）を検出し、「ファ・フィ・フェ・フォ」
 *   （小書き母音）への修正を提案する。
 *
 * 偽陽性回避:
 *   - カタカナ語中（後続がカタカナ）の「フ＋大書き母音」のみを対象とする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  // 「フア」→「ファ」（小書きァ）
  { pattern: /フア(?=[ァ-ヶー・])/g, correct: "ファ" },
  // 「フイ」→「フィ」（小書きィ）
  { pattern: /フイ(?=[ァ-ヶー・])/g, correct: "フィ" },
  // 「フエ」→「フェ」（小書きェ）
  { pattern: /フエ(?=[ァ-ヶー・])/g, correct: "フェ" },
  // 「フオ」→「フォ」（小書きォ）
  { pattern: /フオ(?=[ァ-ヶー・])/g, correct: "フォ" },
];

export function createNhKatakanaFaFiFeFo(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-fa-fi-fe-fo");
  if (!meta) throw new Error("manifest is missing the nh-katakana-fa-fi-fe-fo rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaFaFiFeFo extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, correct } of PAIRS) {
        issues.push(
          ...toolkit.regexReplace({
            text,
            pattern,
            ruleId: this.id,
            severity: config.severity,
            message: `Use ${correct} (small vowel) in katakana loanword`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語表記の「フ＋大書き母音」は「${correct}」（小書き母音）と書きます。`,
            replacement: () => correct,
            fixLabelJa: `「${correct}」に修正`,
            reference: {
              standard: "外来語の表記（1991年内閣告示）",
              section: "第1表 §3(3)⑤",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKatakanaFaFiFeFo(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
