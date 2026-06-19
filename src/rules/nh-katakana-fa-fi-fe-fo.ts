/**
 * nh-katakana-fa-fi-fe-fo — 「ファ・フィ・フェ・フォ」（第1表の仮名）
 *
 * 「外来語の表記」（1991年内閣告示）第1表 §3(3)⑤:
 *   原音の「ファ・フィ・フェ・フォ」は、慣用を除き「ファ・フィ・フェ・フォ」と書く。
 *   慣用で「ハ・ヒ・ヘ・ホ」と書く例（セロハン・モルヒネ・プラットホーム・ホルマリン等）は除外。
 *
 * 検出対象:
 *   「ハ行（ハ・ヒ・ヘ・ホ）」が外来語内で「フ＋小書きア行」に相当するはずの場所に
 *   使われているパターンを検出する。
 *   ただし上記の慣用語は除外する。
 *
 * 偽陽性回避:
 *   - 慣用語リスト（セロハン・モルヒネ等）を除外。
 *   - 「ハ行」は日本語由来の語に多く含まれるため、カタカナ外来語中のみを対象とし、
 *     前後がカタカナであることを条件とする。
 *   - 本ルールは主に「フア」→「ファ」「フイ」→「フィ」のような大書き形を検出する。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 慣用で「ハ/ヒ/へ/ホ」形が認められている語（書籍 p.39 の例）
const CONVENTIONAL_HA_ROW = new Set([
  "セロハン",
  "モルヒネ",
  "プラットホーム",
  "ホルマリン",
  "メガホン",
]);

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
        const subIssues = toolkit.regexReplace({
          text,
          pattern,
          ruleId: this.id,
          severity: config.severity,
          message: `Use ${correct} (small vowel) in katakana loanword`,
          messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語表記では「${correct}」（小書き）を使用します。`,
          replacement: () => correct,
          fixLabelJa: `「${correct}」に修正`,
          reference: {
            standard: "外来語の表記（1991年内閣告示）",
            section: "第1表 §3(3)⑤",
          },
        });
        // 慣用語リストに含まれる語の場合は除外
        for (const issue of subIssues) {
          const context = text.substring(Math.max(0, issue.from - 5), issue.to + 5);
          const isCon = [...CONVENTIONAL_HA_ROW].some((w) => context.includes(w));
          if (!isCon) issues.push(issue);
        }
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
