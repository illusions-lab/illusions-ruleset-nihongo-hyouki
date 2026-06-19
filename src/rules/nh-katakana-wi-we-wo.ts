/**
 * nh-katakana-wi-we-wo — 外来語表記での旧仮名「ヰ」「ヱ」「ヲ」使用禁止
 *
 * 「外来語の表記」（1991年内閣告示）§3(1):
 *   固有名詞などを除き、旧仮名遣いで使用する「ヰ」「ヱ」「ヲ」は使用しない。
 *
 * 偽陽性回避:
 *   - 「ヰ」「ヱ」「ヲ」は現代の日本語テキストにほぼ現れないため、偽陽性リスクは極めて低い。
 *   - 固有名詞（ヱビス・ヱリック等）はルール上の注記対象だが、
 *     L1 正規表現で固有名詞のみを除外する確実な方法がないため、全体に適用し
 *     ユーザーが文脈に応じて判断する。severity を warning とする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{ pattern: RegExp; suggest: string; correct: string; label: string }> = [
  { pattern: /ヰ/, suggest: "イ", correct: "イ（またはウィ）", label: "「ヰ」は使用しません。「イ」または「ウィ」と表記してください。" },
  { pattern: /ヱ/, suggest: "エ", correct: "エ（またはウェ）", label: "「ヱ」は使用しません。「エ」または「ウェ」と表記してください。" },
  { pattern: /ヲ/, suggest: "オ", correct: "オ（またはウォ）", label: "「ヲ」は使用しません。「オ」または「ウォ」と表記してください。" },
];

export function createNhKatakanaWiWeWo(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-wi-we-wo");
  if (!meta) throw new Error("manifest is missing the nh-katakana-wi-we-wo rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaWiWeWo extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, suggest, correct, label } of PAIRS) {
        issues.push(
          ...toolkit.regexReplace({
            text,
            pattern,
            ruleId: this.id,
            severity: config.severity,
            message: `Obsolete katakana: use ${correct} instead`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、${label}`,
            replacement: () => suggest, // suggest the most common form (ウィ/ウェ/ウォ may be more accurate for some cases)
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

  return new NhKatakanaWiWeWo(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
