/**
 * nh-katakana-ti-di — 「ティ・ディ」（慣用を除く第1表の仮名）
 *
 * 「外来語の表記」（1991年内閣告示）第1表 §3(3)④:
 *   原音の「ティ」「ディ」は、慣用を除き「ティ」「ディ」と書く。
 *   慣用で「チ・ジ」と書く例: エチケット・スチーム・プラスチック・スタジアム・スタジオ・
 *   ラジオ・チロル（地名）・エジソン（人名）等。
 *
 * 検出対象:
 *   カタカナ語内で「テイ」（大書きイ）「デイ」（大書きイ）が
 *   「ティ」「ディ」（小書きィ）に相当する場所を検出する。
 *
 * 偽陽性回避:
 *   - 慣用語リスト（スタジオ・ラジオ等）は「テイ/デイ」でなく「ジ」表記なので本ルール対象外。
 *   - 「テイ」が単独で使われる日本語（「定（てい）」等）は仮名でなく漢字表記が多い。
 *   - カタカナ語内の「テイ」「デイ」を対象にするため、前後がカタカナであることを条件とする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  // 「テイ」→「ティ」（小書きィ）: カタカナ文字列内の「テイ」
  { pattern: /(?<=[ァ-ヶー・])テイ(?=[ァ-ヶー・])/g, correct: "ティ" },
  // 「デイ」→「ディ」（小書きィ）: カタカナ文字列内の「デイ」
  { pattern: /(?<=[ァ-ヶー・])デイ(?=[ァ-ヶー・])/g, correct: "ディ" },
];

export function createNhKatakanaTiDi(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-ti-di");
  if (!meta) throw new Error("manifest is missing the nh-katakana-ti-di rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaTiDi extends AbstractL1Rule {
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
            message: `Use ${correct} (small ィ) in katakana loanword`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語表記では「${correct}」（小書きィ）を使用します。`,
            replacement: () => correct,
            fixLabelJa: `「${correct}」に修正`,
            reference: {
              standard: "外来語の表記（1991年内閣告示）",
              section: "第1表 §3(3)④",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKatakanaTiDi(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
