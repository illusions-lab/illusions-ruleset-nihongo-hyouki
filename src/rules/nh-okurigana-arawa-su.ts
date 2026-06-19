/**
 * nh-okurigana-arawa-su — 「著わす」「表わす」「現われる」→ 本則形
 *
 * 「送り仮名の付け方」（1973年内閣告示）§3（旧規程本則→新規程許容）:
 *   旧規程「送りがなのつけ方」（1959年）の本則だった次の送り仮名形は、
 *   1973年の改訂で本則が変更された:
 *     著わす → 著す（本則）、著わす（許容）
 *     表わす → 表す（本則）、表わす（許容）
 *     現われる → 現れる（本則）、現われる（許容）
 *   一般には本則形を使用する。
 *
 * 偽陽性回避:
 *   - 「表わされる」「現われた」など活用形も検出する。
 *   - 「表す」「著す」「現れる」はすでに正しい本則形なので対象外。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string; hint: string }> = [
  {
    // 著わす・著わした・著わされ等
    pattern: /著わ([さしすせそ])/g,
    correct: "著",
    hint: "「著わす」→「著す」",
  },
  {
    // 表わす・表わした・表わされ等
    pattern: /表わ([さしすせそ])/g,
    correct: "表",
    hint: "「表わす」→「表す」",
  },
  {
    // 現われる・現われた・現われ等
    pattern: /現われ([るたてたら]?)/g,
    correct: "現れ",
    hint: "「現われる」→「現れる」",
  },
];

export function createNhOkuriganaArawaSu(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-okurigana-arawa-su");
  if (!meta) throw new Error("manifest is missing the nh-okurigana-arawa-su rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhOkuriganaArawaSu extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, correct, hint } of PAIRS) {
        issues.push(
          ...toolkit.regexReplace({
            text,
            pattern,
            ruleId: this.id,
            severity: config.severity,
            message: `Use 本則 form: ${hint}`,
            messageJa: `日本語表記（日本エディタースクール）第7章に基づき、${hint}（「送り仮名の付け方」1973年の本則）。`,
            replacement: (m) => `${correct}${m[1] ?? ""}`,
            fixLabelJa: "送り仮名を本則形に修正",
            reference: {
              standard: "送り仮名の付け方（1973年内閣告示）",
              section: "§3 旧規程本則→新規程許容",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhOkuriganaArawaSu(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
