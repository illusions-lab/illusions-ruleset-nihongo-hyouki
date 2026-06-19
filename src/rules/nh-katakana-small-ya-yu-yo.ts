/**
 * nh-katakana-small-ya-yu-yo — 拗音「ヤ・ユ・ヨ」の大書き禁止
 *
 * 「外来語の表記」（1991年内閣告示）§3(2)②:
 *   拗音に用いる「ヤ」「ユ」「ヨ」は小書きにする（「ャ」「ュ」「ョ」）。
 *
 * 対象パターン:
 *   「シ・チ・ジ・ニ・ヒ・ミ・リ・ギ・キ・ビ・ピ」直後の大書き「ヤ・ユ・ヨ」を検出する。
 *   その後に2字以上のカタカナが続く（外来語語内の使用）ことを条件とすることで、
 *   「ニヤリとした」などの日本語擬態語を除外する。
 *
 * 偽陽性回避:
 *   - 語頭の「ヤ・ユ・ヨ」（ヤード・ユニット等）は先行子音系仮名がないため対象外。
 *   - 直後2字以上のカタカナを要求することで、「ニヤリ」など短い語を除外。
 *   - ニヤニヤ・チヤホヤ・シヤチホコ 等の和語擬態語・固有名詞は除外リストで対象外とする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 子音系仮名（拗音構成に現れる）
const CONSONANT_KANA = "シチジニヒミリギキビピ";

// 和語擬態語・固有名詞等、大書きヤ/ユ/ヨが正当なカタカナ表記語（語全体で除外）
const WORD_EXCLUSIONS = new Set([
  "ニヤニヤ",
  "チヤホヤ",
  "シヤチホコ",
]);

/**
 * 指定位置を含むカタカナ語（中黒も含む連語境界を許容）を抽出する。
 */
function extractKatakanaWord(text: string, pos: number): string {
  let start = pos;
  while (start > 0 && /[ァ-ヶー・]/.test(text[start - 1])) start--;
  let end = pos;
  while (end < text.length && /[ァ-ヶー・]/.test(text[end])) end++;
  return text.slice(start, end);
}

const PAIRS: ReadonlyArray<{ pattern: RegExp; bigKana: string; smallKana: string }> = [
  {
    // [子音系仮名]ヤ + 2文字以上のカタカナ続く → 小書きャ
    pattern: new RegExp(`([${CONSONANT_KANA}])ヤ(?=[ァ-ヶー・][ァ-ヶー・])`, "g"),
    bigKana: "ヤ",
    smallKana: "ャ",
  },
  {
    pattern: new RegExp(`([${CONSONANT_KANA}])ユ(?=[ァ-ヶー・][ァ-ヶー・])`, "g"),
    bigKana: "ユ",
    smallKana: "ュ",
  },
  {
    pattern: new RegExp(`([${CONSONANT_KANA}])ヨ(?=[ァ-ヶー・][ァ-ヶー・])`, "g"),
    bigKana: "ヨ",
    smallKana: "ョ",
  },
];

export function createNhKatakanaSmallYaYuYo(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-small-ya-yu-yo");
  if (!meta) throw new Error("manifest is missing the nh-katakana-small-ya-yu-yo rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaSmallYaYuYo extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, bigKana, smallKana } of PAIRS) {
        const rawIssues = toolkit.regexReplace({
          text,
          pattern,
          ruleId: this.id,
          severity: config.severity,
          message: `Use small ${smallKana} (not large ${bigKana}) for syllable in katakana loanword`,
          messageJa: `日本語表記（日本エディタースクール）第8章に基づき、外来語の拗音には小書き「${smallKana}」を使用します（大書き「${bigKana}」は不可）。`,
          replacement: (m) => `${m[1]}${smallKana}`,
          fixLabelJa: `「${smallKana}」に修正`,
          reference: {
            standard: "外来語の表記（1991年内閣告示）",
            section: "§3(2)②",
          },
        });
        // 和語擬態語・固有名詞等の除外リストでフィルタリング
        for (const issue of rawIssues) {
          const word = extractKatakanaWord(text, issue.from);
          if (!WORD_EXCLUSIONS.has(word)) {
            issues.push(issue);
          }
        }
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhKatakanaSmallYaYuYo(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
