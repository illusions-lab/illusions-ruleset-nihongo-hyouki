/**
 * nh-katakana-she-je — 「シェ」「ジェ」（第1表の仮名）の使用
 *
 * 「外来語の表記」（1991年内閣告示）第1表 §3(3)①:
 *   原音の「シェ」「ジェ」は、慣用を除き「シェ」「ジェ」と書く。
 *   「セ」「ゼ」と書くのは慣用による例外（エンゼル・ミルクセーキ・ゼラチン等）。
 *
 * 検出対象:
 *   「シエ」（大書きエ）「ジエ」（大書きエ）を検出し、「シェ」「ジェ」（小書きェ）への修正を提案。
 *   ただし「シェ」「ジェ」はすでに正しい形なので対象外。
 *
 * 偽陽性回避:
 *   - 慣用で「セ/ゼ」と書く語（エンゼル・ゼラチン等）は「シエ/ジエ」でないため対象外。
 *   - 「シエン（支援）」「シエラ」など日本語・固有名詞での「シエ」パターンは
 *     後続が長音またはカタカナ語中である場合に限定することで除外を試みる。
 *   - このパターンは比較的まれなため偽陽性リスクは低。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  // 「シエ」(大書きエ) → 「シェ」(小書きェ)
  { pattern: /シエ(?=[ァ-ヶー])/g, correct: "シェ" },
  // 「ジエ」(大書きエ) → 「ジェ」(小書きェ)
  { pattern: /ジエ(?=[ァ-ヶー])/g, correct: "ジェ" },
];

export function createNhKatakanaSheJe(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-she-je");
  if (!meta) throw new Error("manifest is missing the nh-katakana-she-je rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaSheJe extends AbstractL1Rule {
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
            message: `Use small エ (${correct}) in katakana loanword`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語の表記では「${correct}」（小書きェ）を使用します。`,
            replacement: () => correct,
            fixLabelJa: `「${correct}」に修正`,
            reference: {
              standard: "外来語の表記（1991年内閣告示）",
              section: "第1表 §3(3)①",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKatakanaSheJe(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
