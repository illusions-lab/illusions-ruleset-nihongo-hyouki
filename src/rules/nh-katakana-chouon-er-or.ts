/**
 * nh-katakana-chouon-er-or — 語末 -er/-or/-ar 相当音は長音符「ー」で
 *
 * 「外来語の表記」（1991年内閣告示）§3(2)④:
 *   英語の語末の -er, -or, -ar などに当たるものは、原則として ア列の長音とし
 *   音引「ー」を用いて書く。
 *
 * 検出対象:
 *   カタカナ語末の「ア列仮名＋ア（またはア行）」のパターン。
 *   例: 「ギタ」（Guitar）→「ギター」 / 「マフラ」→「マフラー」
 *   「ア列（ア・カ・サ・タ・ナ・ハ・マ・ラ・ワ行）の終端」が長音なしで終わっている場合。
 *
 * 精密な判定について:
 *   語末の -er/-or/-ar 対応は、カタカナ語が「ア列音節」で終止し、
 *   後続が非カタカナ（文末・読点・ひらがな等）である場合に長音「ー」が欠落していないかをチェック。
 *
 * 偽陽性回避:
 *   - 「スリッパ」「エンジニア」など慣用で長音を省く語は許容（ただし本則は長音あり）。
 *   - このルールは「ア（アa-row finals）で終わるカタカナ語が長音なし」を検出し、
 *     文脈によっては許容の場合もあるため、severity = warning とする。
 *   - 語中の「ア行」終わりは対象外（語末のみ）。
 *   - 「ア」「イ」「ウ」「エ」「オ」行末の語尾を包括的に検出すると
 *     偽陽性が増大するため、-er/-or/-ar に最も典型的なア行末（ア・エア）のみ対象とする。
 *
 * 実装方針:
 *   明確に -er 対応と判断できる「タ・ダ・ナ・マ・ラ・ガ・カ・ハ・バ・パ行＋ア列」のパターンで
 *   語末（後続が非カタカナ）を検出する。慣用語除外リストを適用する。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 慣用で長音を省く語（許容形、書籍 p.38 の例）
const CONVENTIONAL_NO_CHOUON = new Set([
  "スリッパ",
  "エンジニア",
  "エラ",
  "カメラ",
  "ソファ",
  "ピザ",
  "オペラ",
  "センサ",
  "モータ",
  "コンピュータ",
  "エレベータ",
  "トランジスタ",
]);

// アa-row仮名: カ行・サ行・タ行・ナ行・ハ行・マ行・ラ行・ガ行・ザ行・ダ行・バ行・パ行のア列
// これらで終わるカタカナ語（後続が非カタカナ）を検出
// 「ア」単独語末も追加（エア・フォア等）
const A_ROW_FINALS =
  "カサタナハマヤラワガザダバパ" + // clear a-row finals
  "ア"; // standalone ア

// 前後コンテキスト付きでカタカナ語を抽出してチェックする
// より正確な判定: 前方にカタカナが2文字以上ある（= 語末）かを確認
const KATAKANA_WORD_PATTERN = /[ァ-ヶー]{2,}/g;

export function createNhKatakanaChouonErOr(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-chouon-er-or");
  if (!meta) throw new Error("manifest is missing the nh-katakana-chouon-er-or rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NhKatakanaChouonErOr extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];

      // カタカナ語ごとに処理する
      let wordMatch: RegExpExecArray | null;
      const wordRe = new RegExp(KATAKANA_WORD_PATTERN.source, "g");
      while ((wordMatch = wordRe.exec(text)) !== null) {
        const word = wordMatch[0];
        const wordStart = wordMatch.index;

        // 慣用除外
        if (CONVENTIONAL_NO_CHOUON.has(word)) continue;

        // 語末がア列音節で終わり、かつ長音符なし
        const lastChar = word[word.length - 1];
        if (A_ROW_FINALS.includes(lastChar)) {
          const from = wordStart + word.length - 1;
          const to = wordStart + word.length;
          issues.push({
            ruleId: this.id,
            severity: config.severity,
            message: `Katakana word ending in ア-row without long vowel mark — consider adding ー`,
            messageJa: `日本語表記（日本エディタースクール）第8章に基づき、英語語末の -er/-or/-ar に相当する音は長音符「ー」を付けます（例: ギター、マフラー）。`,
            from,
            to,
            originalText: lastChar,
            reference: {
              standard: "外来語の表記（1991年内閣告示）",
              section: "§3(2)④",
            },
            fix: {
              label: `Add ー after ${lastChar}`,
              labelJa: `「${lastChar}ー」に修正`,
              replacement: `${lastChar}ー`,
            },
          });
        }
      }
      return issues;
    }
  }

  return new NhKatakanaChouonErOr(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
