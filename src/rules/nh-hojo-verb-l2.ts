/**
 * nh-hojo-verb-l2 — 補助動詞「ていく・てくる」等は仮名書き（形態素解析 L2）
 *
 * 日本語表記（日本エディタースクール）第3章 漢字の用い方 §1 漢字と仮名の使用:
 *   形式名詞や補助動詞なども、一般に平仮名を使用する。
 *   例: ……ていく（負担が増えていく）……てくる（寒くなってくる）
 *       ……ておく（通知しておく）……てみる（見てみる）
 *       ……てしまう（書いてしまう）……てあげる（図書を貸してあげる）
 *       ……ていただく（報告していただく）……てください（問題点を話してください）
 *
 * nh-kana-auxiliary-verb（L1）との役割分担:
 *   L1 は正規表現で「て＋補助動詞漢字」をパターンマッチする。
 *   ただし「行く」「来る」は本動詞としても頻出するため、
 *   L1 正規表現では本動詞と補助動詞を区別できず、対象外となっている。
 *   本ルール（L2）は形態素解析で「接続助詞て/で → 動詞」の境界を確認することで、
 *   「行く」「来る」を安全に検出する。L1 がすでに検出するパターン（仕舞う・見る等）
 *   は本ルールには含めず、重複指摘を避ける。
 *
 * 偽陽性回避:
 *   - 直前トークンが接続助詞「て」のときのみ検出し、本動詞用法（「図書館へ行く」等）は除外する。
 *   - 「で」は格助詞（電車で行く）と接続助詞（急いで行く）が表面上区別しにくいため対象外。
 *   - surface が既に仮名のトークンはスキップする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
  Token,
} from "illusions-lint-sdk";

/**
 * 補助動詞の basic_form（漢字）→ 推奨仮名形の対応表。
 * L1（nh-kana-auxiliary-verb）が正規表現でカバーできない「行く」「来る」を主対象とする。
 * 完全な仮名 surface を持つトークンはスキップするため誤検出は生じない。
 */
const AUX_VERB_MAP: ReadonlyMap<string, string> = new Map([
  ["行く", "いく"],
  ["来る", "くる"],
]);

const REF = {
  standard: "日本語表記（日本エディタースクール）",
  section: "第3章 漢字の用い方 §1 漢字と仮名の使用",
} as const;

/** 接続助詞「て」かどうかを判定（「で」は格助詞との区別が困難なため除外） */
function isTeConjunction(t: Token): boolean {
  return t.surface === "て" && t.pos === "助詞" && t.pos_detail_1 === "接続助詞";
}

export function createNhHojoVerbL2(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const metaEntry = manifest.rules.find((r) => r.ruleId === "nh-hojo-verb-l2");
  if (!metaEntry) throw new Error("manifest is missing the nh-hojo-verb-l2 rule");

  const { AbstractMorphologicalLintRule } = ctx.bases;
  const { toolkit } = ctx;

  const ruleId: string = metaEntry.ruleId;
  const nameJa: string = metaEntry.nameJa;
  const descriptionJa: string = metaEntry.descriptionJa;
  const defaultConfig = metaEntry.defaultConfig;
  const ruleMeta = toolkit.toJsonRuleMeta(metaEntry, manifest);

  class NhHojoVerbL2 extends AbstractMorphologicalLintRule {
    readonly id = ruleId;
    readonly name = nameJa;
    readonly nameJa = nameJa;
    readonly description = descriptionJa;
    readonly descriptionJa = descriptionJa;
    readonly level = "L2" as const;
    readonly defaultConfig = defaultConfig;
    readonly meta = ruleMeta;

    /** L2 ルールは lintWithTokens で処理。lint() はスタブ。 */
    lint(_text: string, _config: LintRuleConfig): LintIssue[] {
      return [];
    }

    lintWithTokens(_text: string, tokens: ReadonlyArray<Token>, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];

      for (let i = 1; i < tokens.length; i++) {
        const prev = tokens[i - 1];
        const cur = tokens[i];

        // 直前が接続助詞「て」でなければスキップ
        if (!isTeConjunction(prev)) continue;

        // 現トークンが動詞かどうか確認
        if (cur.pos !== "動詞") continue;

        // basic_form で補助動詞辞書を引く（活用形に依存しない）
        const basicForm = cur.basic_form ?? cur.surface;
        const kanaForm = AUX_VERB_MAP.get(basicForm);
        if (!kanaForm) continue;

        // surface が既に仮名（推奨形またはその活用形）ならスキップ
        // 仮名のみで構成されているかどうかで判定
        if (/^[ぁ-ん]+$/.test(cur.surface)) continue;

        issues.push({
          ruleId: this.id,
          severity: config.severity,
          message: `Auxiliary verb "${cur.surface}" should be written in kana ("${kanaForm}")`,
          messageJa: `日本語表記（日本エディタースクール）第3章 §1 に基づき、補助動詞「て${cur.surface}」の「${cur.surface}」は「${kanaForm}」と仮名書きにします。`,
          from: cur.start,
          to: cur.end,
          originalText: cur.surface,
          reference: REF,
          fix: {
            label: `Replace with "${kanaForm}"`,
            labelJa: `「${kanaForm}」に変更`,
            replacement: kanaForm,
          },
        });
      }

      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NhHojoVerbL2();
}
