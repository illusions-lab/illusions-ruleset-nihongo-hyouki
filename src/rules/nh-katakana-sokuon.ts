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
 *   - 前後いずれもカタカナであることを条件とするため、和語での「つ」（平仮名）は対象外。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// カタカナ文字（ア〜ン＋小書き＋長音・中黒）に挟まれた大書き「ツ」を検出。
// (?<=…) lookbehind はNode.js v10以降でサポート。
const SOKUON_PATTERN = /(?<=[ァ-ヶー・])ツ(?=[ァ-ヶー・])/g;

export function createNhKatakanaSokuon(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-sokuon");
  if (!meta) throw new Error("manifest is missing the nh-katakana-sokuon rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaSokuon extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
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
