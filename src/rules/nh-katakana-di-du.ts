/**
 * nh-katakana-di-du — 外来語表記での「ヂ」「ヅ」使用禁止
 *
 * 「外来語の表記」（1991年内閣告示）§3(1):
 *   固有名詞などを除き、旧仮名遣いで使用する「ヂ」「ヅ」は使用しない。
 *   外来語では「ジ」「ズ」を用いる。
 *
 * 偽陽性回避:
 *   - 「ヂ」「ヅ」は現代の外来語カタカナ表記にほぼ現れない。
 *   - 固有名詞（地名・人名）はルール上の注記対象だが、L1 では全体に適用する。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  { pattern: /ヂ/, correct: "ジ" },
  { pattern: /ヅ/, correct: "ズ" },
];

export function createNhKatakanaDiDu(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-di-du");
  if (!meta) throw new Error("manifest is missing the nh-katakana-di-du rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaDiDu extends AbstractL1Rule {
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
            message: `Use ${correct} instead of ${pattern.source} in foreign-word katakana`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語表記では「${pattern.source}」の代わりに「${correct}」を使用します。`,
            replacement: () => correct,
            fixLabelJa: `「${correct}」に修正`,
            reference: {
              standard: "外来語の表記（1991年内閣告示）",
              section: "§3(1)",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKatakanaDiDu(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
