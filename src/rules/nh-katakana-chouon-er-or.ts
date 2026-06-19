/**
 * nh-katakana-chouon-er-or — 語末 -er/-or/-ar 相当音は長音符「ー」で
 *
 * 根拠（日本語表記 第8章 外来語の表記 §3(2)④）:
 *   英語の語末の -er, -or, -ar などに当たるものは、原則として ア列の長音とし
 *   音引「ー」を用いて書く。
 *   ただし、慣用で音引「ー」を省くものもある（例: スリッパ、エンジニア）。
 *   揺れがある例として「エレベーター（エレベータ）」「コンピューター（コンピュータ）」
 *   「トランジスター（トランジスタ）」が明示されている。
 *
 * 実装方針（ホワイトリスト方式）:
 *   「ー無し形」で書いた場合に明らかに誤りとなる語のみをホワイトリストで明示列挙し、
 *   それらの「ー無し形」が出現したときだけ指摘する。
 *
 *   書籍が「両形を許容」と明示している語（コンピュータ、エレベータ等）は
 *   ホワイトリストに含めない。ドラマ・テーマ・ソナタ・パジャマ・オペラ等、
 *   英語 -er/-or/-ar 由来でない語は最初から対象外。
 *
 *   この方式により偽陽性をゼロに近づけ、「確実に誤り」の語だけを指摘できる。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

/**
 * ホワイトリストエントリー:
 *   stemWithoutChouon: ー無し形（検出する文字列）
 *   stemWithChouon: ー付き形（修正後の文字列）
 *
 * 選定基準:
 *   - 英語 -er/-or/-ar 由来が明確
 *   - 書籍が「揺れあり（両形許容）」と明示していない
 *   - 慣用で「ー無し形」が定着していない
 */
const WHITELIST: ReadonlyArray<{ stemWithoutChouon: string; stemWithChouon: string }> = [
  // -er 由来
  { stemWithoutChouon: "ギタ", stemWithChouon: "ギター" },          // guitar
  { stemWithoutChouon: "マフラ", stemWithChouon: "マフラー" },       // muffler
  { stemWithoutChouon: "プリンタ", stemWithChouon: "プリンター" },   // printer
  { stemWithoutChouon: "スキャナ", stemWithChouon: "スキャナー" },   // scanner
  { stemWithoutChouon: "ドライバ", stemWithChouon: "ドライバー" },   // driver
  { stemWithoutChouon: "フォルダ", stemWithChouon: "フォルダー" },   // folder
  { stemWithoutChouon: "アダプタ", stemWithChouon: "アダプター" },   // adapter
  { stemWithoutChouon: "ルータ", stemWithChouon: "ルーター" },       // router
  { stemWithoutChouon: "スピーカ", stemWithChouon: "スピーカー" },   // speaker
  { stemWithoutChouon: "リーダ", stemWithChouon: "リーダー" },       // reader
  { stemWithoutChouon: "ハンドラ", stemWithChouon: "ハンドラー" },   // handler
  { stemWithoutChouon: "パラメタ", stemWithChouon: "パラメータ" },   // parameter
  { stemWithoutChouon: "スライダ", stemWithChouon: "スライダー" },   // slider
  { stemWithoutChouon: "バッファ", stemWithChouon: "バッファー" },   // buffer
  { stemWithoutChouon: "カバ", stemWithChouon: "カバー" },           // cover
  { stemWithoutChouon: "アンカ", stemWithChouon: "アンカー" },       // anchor
  { stemWithoutChouon: "バーナ", stemWithChouon: "バーナー" },       // burner
  // -or 由来
  { stemWithoutChouon: "モニタ", stemWithChouon: "モニター" },       // monitor
  { stemWithoutChouon: "プロセッサ", stemWithChouon: "プロセッサー" }, // processor
  { stemWithoutChouon: "コレクタ", stemWithChouon: "コレクター" },   // collector
  { stemWithoutChouon: "ベクタ", stemWithChouon: "ベクター" },       // vector
  // -ar 由来
  { stemWithoutChouon: "レーダ", stemWithChouon: "レーダー" },       // radar
];

/**
 * 各ホワイトリスト語について「ー無し形＋語末確定（後続が非カタカナ）」の正規表現を生成する。
 * 語末確定: 後続が [ァ-ヶー] でない（語末位置を保証し複合語途中の誤検出を防ぐ）。
 */
function buildPattern(entry: { stemWithoutChouon: string; stemWithChouon: string }): RegExp {
  // 非捕捉グループで語末を先読み: 後続が非カタカナ or 文字列終端
  const escaped = entry.stemWithoutChouon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}(?![ァ-ヶー])`, "g");
}

export function createNhKatakanaChouonErOr(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nh-katakana-chouon-er-or");
  if (!meta) throw new Error("manifest is missing the nh-katakana-chouon-er-or rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  // エントリーとパターンのペアを事前生成
  const entries = WHITELIST.map((entry) => ({
    entry,
    pattern: buildPattern(entry),
  }));

  class NhKatakanaChouonErOr extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];

      for (const { entry, pattern } of entries) {
        // パターンを毎回リセット（グローバルフラグ付き正規表現は lastIndex を保持するため）
        pattern.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(text)) !== null) {
          const from = m.index;
          const to = m.index + entry.stemWithoutChouon.length;
          issues.push({
            ruleId: this.id,
            severity: config.severity,
            message: `"${entry.stemWithoutChouon}" should be written as "${entry.stemWithChouon}" — English -er/-or/-ar endings take a long vowel mark (ー) per §3(2)④`,
            messageJa: `日本語表記（日本エディタースクール）第8章 §3(2)④に基づき、英語語末の -er/-or/-ar に相当する音は長音符「ー」を付けます。「${entry.stemWithoutChouon}」→「${entry.stemWithChouon}」`,
            from,
            to,
            originalText: entry.stemWithoutChouon,
            reference: {
              standard: "日本語表記（日本エディタースクール）",
              section: "第8章 外来語の表記 §3(2)④",
            },
            fix: {
              label: `Replace with ${entry.stemWithChouon}`,
              labelJa: `「${entry.stemWithChouon}」に修正`,
              replacement: entry.stemWithChouon,
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
