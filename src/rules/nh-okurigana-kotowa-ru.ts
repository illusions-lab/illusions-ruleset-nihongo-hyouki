/**
 * nh-okurigana-kotowa-ru — 「断わる」「賜わる」→ 本則形
 *
 * 「送り仮名の付け方」（1973年内閣告示）§3（旧規程本則→新規程許容）:
 *   旧規程「送りがなのつけ方」（1959年）の本則だった次の送り仮名形は、
 *   1973年の改訂で本則が変更された:
 *     断わる → 断る（本則）、断わる（許容）
 *     賜わる → 賜る（本則）、賜わる（許容）
 *   一般には本則形を使用する。
 *
 * 偽陽性回避:
 *   - 「断わった」「断わられる」など活用形も検出する。
 *   - 「断る」「賜る」はすでに正しい本則形なので対象外。
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
    // 断わる・断わった・断わられる等
    pattern: /断わ([らりるれろっ])/g,
    correct: "断",
    hint: "「断わる」→「断る」",
  },
  {
    // 賜わる・賜わった・賜わられる等
    pattern: /賜わ([らりるれろっ])/g,
    correct: "賜",
    hint: "「賜わる」→「賜る」",
  },
];

export function createNhOkuriganaKotowaRu(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-okurigana-kotowa-ru");
  if (!meta) throw new Error("manifest is missing the nh-okurigana-kotowa-ru rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhOkuriganaKotowaRu extends AbstractL1Rule {
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
            replacement: (m) => `${correct}${m[1]}`,
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

  return new NhOkuriganaKotowaRu(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
