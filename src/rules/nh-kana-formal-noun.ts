/**
 * nh-kana-formal-noun — 形式名詞「こと・もの・ところ・わけ」は仮名書き
 *
 * 日本語表記（日本エディタースクール）第3章 漢字の用い方 §1 (p.9):
 *   補足的に付く部分は平仮名を用いる。例えば、形式名詞
 *   （こと、ところ、もの、わけ等）は仮名で書く。
 *
 * 検出対象:
 *   kuromoji が「名詞＋非自立」とタグ付けする「事・物・所・訳」を検出し、
 *   仮名書き「こと・もの・ところ・わけ」への修正を提案する。
 *
 * 偽陽性回避:
 *   - 「事件」「物語」「所属」「訳語」のように一般名詞として用いる「事/物/所/訳」は
 *     kuromoji が pos_detail_1="非自立" でなく "一般" 等でタグ付けするため対象外。
 *   - このルールは L2（形態素解析）を必要とする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
  Token,
} from "illusions-lint-sdk";

// 形式名詞の漢字→仮名対応表
const FORMAL_NOUN_MAP: ReadonlyMap<string, string> = new Map([
  ["事", "こと"],
  ["物", "もの"],
  ["所", "ところ"],
  ["訳", "わけ"],
]);

export function createNhKanaFormalNoun(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-kana-formal-noun");
  if (!meta) throw new Error("manifest is missing the nh-kana-formal-noun rule");

  const { AbstractMorphologicalLintRule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKanaFormalNoun extends AbstractMorphologicalLintRule {
    readonly id = meta!.ruleId;
    readonly name = meta!.nameJa;
    readonly nameJa = meta!.nameJa;
    readonly description = meta!.descriptionJa;
    readonly descriptionJa = meta!.descriptionJa;
    readonly level = "L2" as const;
    readonly defaultConfig = meta!.defaultConfig;

    lintWithTokens(_text: string, tokens: ReadonlyArray<Token>, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const token of tokens) {
        if (token.pos !== "名詞" || token.pos_detail_1 !== "非自立") continue;
        const kana = FORMAL_NOUN_MAP.get(token.surface);
        if (!kana) continue;
        issues.push({
          ruleId: this.id,
          severity: config.severity,
          message: `Formal noun "${token.surface}" should be written in kana: "${kana}"`,
          messageJa: `日本語表記（日本エディタースクール）第3章 §1 に基づき、形式名詞「${token.surface}」は仮名「${kana}」と書きます。`,
          from: token.start,
          to: token.end,
          originalText: token.surface,
          reference: {
            standard: "日本語表記（日本エディタースクール）",
            section: "第3章 漢字の用い方 §1 p.9",
          },
          fix: {
            label: `Replace with ${kana}`,
            labelJa: `「${kana}」に修正`,
            replacement: kana,
          },
        });
      }
      return issues;
    }

    lint(_text: string, _config: LintRuleConfig): LintIssue[] {
      // L2 ルールは lintWithTokens で処理。lint() はスタブ。
      return [];
    }
  }

  void toolkit; // toolkit は L2 ルールでは不要だが型エラー回避のため参照
  return new NhKanaFormalNoun();
}
