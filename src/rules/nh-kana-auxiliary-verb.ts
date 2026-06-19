/**
 * nh-kana-auxiliary-verb — 補助動詞は仮名書き
 *
 * 日本語表記（日本エディタースクール）第3章 漢字の用い方 §1 (p.9):
 *   補足的に付く部分は平仮名を用いる。例えば、補助動詞
 *   （あげる、ある、いる、する、なる、みる 等）は仮名で書く。
 *
 * 検出対象:
 *   接続助詞「て・で」の後に来る補助動詞を漢字表記している場合を検出する。
 *   「〜て仕舞う」「〜て見る」「〜て頂く」「〜て置く」「〜て貰う」「〜て挙げる」
 *
 * 偽陽性回避:
 *   - 「て/で」の直後にある補助動詞用法のみを対象とし、本動詞用法（「本を見る」等）を除外。
 *   - 活用形ごとにパターンを限定し、別語への巻き込みを防ぐ。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

const PAIRS: ReadonlyArray<{
  pattern: RegExp;
  getCorrect: (m: RegExpExecArray) => string;
  hint: string;
}> = [
  {
    // 〜て仕舞う / 〜てしまう（正）: 「仕舞」が漢字の場合を検出
    pattern: /([てで])仕舞([いうわっ])/g,
    getCorrect: (m) => `${m[1]}しま${m[2]}`,
    hint: "補助動詞「しまう」は仮名で書きます",
  },
  {
    // 〜て見る（補助動詞） → て+みる
    pattern: /([てで])見([るたてれ])/g,
    getCorrect: (m) => `${m[1]}み${m[2]}`,
    hint: "補助動詞「みる」は仮名で書きます",
  },
  {
    // 〜て頂く → て+いただく
    pattern: /([てで])頂([くきいた])/g,
    getCorrect: (m) => `${m[1]}いただ${m[2]}`,
    hint: "補助動詞「いただく」は仮名で書きます",
  },
  {
    // 〜て置く → て+おく
    pattern: /([てで])置([くきいた])/g,
    getCorrect: (m) => `${m[1]}お${m[2]}`,
    hint: "補助動詞「おく」は仮名で書きます",
  },
  {
    // 〜て貰う → て+もらう
    pattern: /([てで])貰([うわいっ])/g,
    getCorrect: (m) => `${m[1]}もら${m[2]}`,
    hint: "補助動詞「もらう」は仮名で書きます",
  },
  {
    // 〜て挙げる → て+あげる
    pattern: /([てで])挙げ([るたてれ])/g,
    getCorrect: (m) => `${m[1]}あげ${m[2]}`,
    hint: "補助動詞「あげる」は仮名で書きます",
  },
];

export function createNhKanaAuxiliaryVerb(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-kana-auxiliary-verb");
  if (!meta) throw new Error("manifest is missing the nh-kana-auxiliary-verb rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKanaAuxiliaryVerb extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, getCorrect, hint } of PAIRS) {
        issues.push(
          ...toolkit.regexReplace({
            text,
            pattern,
            ruleId: this.id,
            severity: config.severity,
            message: `Auxiliary verb should be written in kana: ${hint}`,
            messageJa: `日本語表記（日本エディタースクール）第3章に基づき、${hint}。`,
            replacement: (m) => getCorrect(m),
            fixLabelJa: "仮名書きに修正",
            reference: {
              standard: "日本語表記（日本エディタースクール）",
              section: "第3章 漢字の用い方 §1",
            },
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKanaAuxiliaryVerb(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
