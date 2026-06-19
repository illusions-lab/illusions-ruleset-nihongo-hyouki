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
 *   - 固有名詞「シエラ」「シエナ」等は除外リストで対象外とする。
 *   - このパターンは比較的まれなため偽陽性リスクは低。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 固有名詞等、シエ/ジエが正当なカタカナ表記語（語全体で除外）
const WORD_EXCLUSIONS = new Set([
  "シエラ",
  "シエナ",
]);

/**
 * 指定位置を含むカタカナ語を抽出する。
 */
function extractKatakanaWord(text: string, pos: number): string {
  let start = pos;
  while (start > 0 && /[ァ-ヶー・]/.test(text[start - 1])) start--;
  let end = pos;
  while (end < text.length && /[ァ-ヶー・]/.test(text[end])) end++;
  return text.slice(start, end);
}

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
        const rawIssues = toolkit.regexReplace({
          text,
          pattern,
          ruleId: this.id,
          severity: config.severity,
          message: `Use small エ (${correct}) in katakana loanword`,
          messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語の表記では「${correct}」（小書きェ）を使用します。固有名詞（シエラ・シエナ等）は例外とします。`,
          replacement: () => correct,
          fixLabelJa: `「${correct}」に修正`,
          reference: {
            standard: "外来語の表記（1991年内閣告示）",
            section: "第1表 §3(3)①",
          },
        });
        // 固有名詞除外リストでフィルタリング
        // 除外語が語全体と一致、または語全体の接頭語であれば除外する（シエラ→シエラレオネ等）
        for (const issue of rawIssues) {
          const word = extractKatakanaWord(text, issue.from);
          const excluded = [...WORD_EXCLUSIONS].some(
            (excl) => word === excl || word.startsWith(excl),
          );
          if (!excluded) {
            issues.push(issue);
          }
        }
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
