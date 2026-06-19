/**
 * nh-okurigana-okona-u — 「行なう」→「行う」（送り仮名の本則）
 *
 * 「送り仮名の付け方」（1973年内閣告示）§3（許容→本則）:
 *   旧規程「送りがなのつけ方」（1959年）の本則だった「行なう」は、
 *   1973年の改訂で「行う」が本則となり、「行なう」は許容に格下げされた。
 *   一般には本則「行う」で表記する。
 *
 * 同様に、旧規程本則→新規程許容となった語:
 *   「断わる」→「断る」、「賜わる」→「賜る」は別ルールで対応（nh-okurigana-kotowa-ru）。
 *
 * 偽陽性回避:
 *   - 「行なわれる」「行なった」など活用形も検出する（活用語尾前の語幹部分を固定）。
 *   - 「行う」はすでに正しい表記なので対象外。
 *   - 「行商（ぎょうしょう）」などの熟語は対象外（仮名でなく漢字が続く）。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 「行なう」「行なわれる」「行なった」「行ない」などを検出。
// 「行な」に続く活用形（わ/い/っ/う/え/お/われ等）をまとめて対象とする。
const PATTERN = /行な([わいっうえおれ])/g;

export function createNhOkuriganaOkonaU(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-okurigana-okona-u");
  if (!meta) throw new Error("manifest is missing the nh-okurigana-okona-u rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhOkuriganaOkonaU extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: 'Use 行う (not 行なう): 送り仮名の付け方 (1973) 本則',
        messageJa: "日本語表記（日本エディタースクール）第7章に基づき、「行なう」は旧表記です。「送り仮名の付け方」（1973年）の本則「行う」を使用します。",
        replacement: (m) => `行${m[1]}`,
        fixLabelJa: "送り仮名を本則形に修正",
        reference: {
          standard: "送り仮名の付け方（1973年内閣告示）",
          section: "§3 許容→本則",
        },
      });
    }
  }

  return new NhOkuriganaOkonaU(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
