import { describe, it, expect } from "vitest";
import type { LintIssue, LintRuleConfig, Token } from "illusions-lint-sdk";

import ruleset from "../src/index";
import manifest from "../manifest.json";
import { createTestContext, CONFIG } from "./test-kit";

/** Helper type for rules that expose lintWithTokens (L2). */
interface MorphRule {
  id: string;
  lint(text: string, config: LintRuleConfig): LintIssue[];
  lintWithTokens(text: string, tokens: ReadonlyArray<Token>, config: LintRuleConfig): LintIssue[];
}

/**
 * Golden tests driven by manifest.docs:
 * every rule's positive example must yield 0 issues,
 * and its negative example must yield >= 1 issue.
 *
 * L2 (morphological) rules drive detection via lintWithTokens(), not lint().
 * Their negative-example golden test is skipped here and covered by
 * dedicated lintWithTokens() unit tests below.
 */
describe("ruleset golden examples", () => {
  const rules = ruleset.createRules(createTestContext());

  for (const meta of manifest.rules) {
    describe(meta.ruleId, () => {
      const rule = rules.find((r) => r.id === meta.ruleId);

      it("is built by createRules", () => {
        expect(rule, `rule ${meta.ruleId} not returned by createRules`).toBeDefined();
      });

      it("positive example yields no issue", () => {
        expect(rule!.lint(meta.docs.positiveExample, CONFIG)).toHaveLength(0);
      });

      if (meta.level !== "L2") {
        it("negative example is flagged", () => {
          expect(rule!.lint(meta.docs.negativeExample, CONFIG).length).toBeGreaterThan(0);
        });
      } else {
        it.skip("negative example is flagged (L2 — tested via lintWithTokens)", () => {});
      }
    });
  }
});

// ---------------------------------------------------------------------------
// nh-katakana-wi-we-wo
// ---------------------------------------------------------------------------
describe("nh-katakana-wi-we-wo — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-wi-we-wo")!;

  it("flags ヰ in running text", () => {
    expect(rule().lint("スヰフトの小説を読む。", CONFIG).length).toBeGreaterThan(0);
  });

  it("flags ヱ in running text", () => {
    expect(rule().lint("ヱルサレムへ旅した。", CONFIG).length).toBeGreaterThan(0);
  });

  it("flags ヲ in running text", () => {
    expect(rule().lint("ヲルポールの作品。", CONFIG).length).toBeGreaterThan(0);
  });

  it("leaves modern katakana untouched", () => {
    expect(rule().lint("ウィスキーとウェブとウォッチ。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("スヰフト", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-di-du
// ---------------------------------------------------------------------------
describe("nh-katakana-di-du — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-di-du")!;

  it("flags ヂ in katakana word", () => {
    const issues = rule().lint("ヂャズを演奏した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ジ");
  });

  it("flags ヅ in katakana word", () => {
    const issues = rule().lint("ヅカダンサー。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ズ");
  });

  it("leaves ジ and ズ untouched", () => {
    expect(rule().lint("ジャズとズーム。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("ヂャズ", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-small-ya-yu-yo
// ---------------------------------------------------------------------------
describe("nh-katakana-small-ya-yu-yo — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-small-ya-yu-yo")!;

  it("flags シヤワー → シャワー", () => {
    const issues = rule().lint("シヤワーを浴びた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toContain("ャ");
  });

  it("flags チヨコレート → チョコレート", () => {
    const issues = rule().lint("チヨコレートを食べた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toContain("ョ");
  });

  it("flags ニユーヨーク → ニューヨーク", () => {
    const issues = rule().lint("ニユーヨークへ行く。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toContain("ュ");
  });

  it("leaves correct small kana untouched", () => {
    expect(rule().lint("シャワーを浴びた。チョコレート。", CONFIG)).toHaveLength(0);
  });

  it("leaves standalone ヤ/ユ/ヨ (not preceded by consonant) untouched", () => {
    expect(rule().lint("ヤード。ユニット。ヨット。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("シヤワー", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-sokuon
// ---------------------------------------------------------------------------
describe("nh-katakana-sokuon — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-sokuon")!;

  it("flags バツグ → バッグ", () => {
    const issues = rule().lint("バツグを持った。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ッ");
  });

  it("flags コツプ → コップ", () => {
    const issues = rule().lint("コツプが割れた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ッ");
  });

  it("leaves ッ (already small) untouched", () => {
    expect(rule().lint("バッグ。コップ。", CONFIG)).toHaveLength(0);
  });

  it("leaves word-initial ツ untouched", () => {
    expect(rule().lint("ツアー。ツール。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("バツグ", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-chouon-er-or
// ---------------------------------------------------------------------------
describe("nh-katakana-chouon-er-or — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-chouon-er-or")!;

  it("flags ギタ (missing ー) → ギター", () => {
    const issues = rule().lint("ギタの音が響いた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ギター");
  });

  it("flags スキャナ (missing ー) → スキャナー", () => {
    const issues = rule().lint("スキャナを使う。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("スキャナー");
  });

  it("flags プリンタ (missing ー) → プリンター", () => {
    const issues = rule().lint("プリンタで印刷する。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("プリンター");
  });

  it("flags ドライバ (missing ー) → ドライバー", () => {
    const issues = rule().lint("ドライバをインストールした。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ドライバー");
  });

  it("flags モニタ (missing ー) → モニター", () => {
    const issues = rule().lint("モニタの輝度を調整した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("モニター");
  });

  it("flags フォルダ (missing ー) → フォルダー", () => {
    const issues = rule().lint("フォルダを作成した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("フォルダー");
  });

  it("leaves ギター untouched", () => {
    expect(rule().lint("ギターを弾く。", CONFIG)).toHaveLength(0);
  });

  it("leaves スキャナー untouched", () => {
    expect(rule().lint("スキャナーを使う。", CONFIG)).toHaveLength(0);
  });

  it("leaves プリンター untouched", () => {
    expect(rule().lint("プリンターで印刷する。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ドラマ (non -er/-or word)", () => {
    expect(rule().lint("ドラマを見た。", CONFIG)).toHaveLength(0);
  });

  it("does not flag テーマ (non -er/-or word)", () => {
    expect(rule().lint("テーマを設定した。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ソナタ (non -er/-or word)", () => {
    expect(rule().lint("ソナタを演奏する。", CONFIG)).toHaveLength(0);
  });

  it("does not flag パジャマ (non -er/-or word)", () => {
    expect(rule().lint("パジャマに着替えた。", CONFIG)).toHaveLength(0);
  });

  it("does not flag オペラ (non -er/-or word)", () => {
    expect(rule().lint("オペラを観に行く。", CONFIG)).toHaveLength(0);
  });

  it("does not flag コンピュータ (書籍が両形許容と明示)", () => {
    // 書籍 p.38: 「揺れがある例: コンピューター（コンピュータ）」
    expect(rule().lint("コンピュータを使う。", CONFIG)).toHaveLength(0);
  });

  it("does not flag エレベータ (書籍が両形許容と明示)", () => {
    // 書籍 p.38: 「揺れがある例: エレベーター（エレベータ）」
    expect(rule().lint("エレベータに乗る。", CONFIG)).toHaveLength(0);
  });

  it("does not flag トランジスタ (書籍が両形許容と明示)", () => {
    // 書籍 p.38: 「揺れがある例: トランジスター（トランジスタ）」
    expect(rule().lint("トランジスタを使う回路。", CONFIG)).toHaveLength(0);
  });

  it("does not flag スリッパ (慣用で長音省略が定着)", () => {
    expect(rule().lint("スリッパを履く。", CONFIG)).toHaveLength(0);
  });

  it("does not flag エンジニア (語末が -er/-or でなく -eer)", () => {
    expect(rule().lint("エンジニアに相談した。", CONFIG)).toHaveLength(0);
  });

  it("does not flag カメラ (Italian -ra, not English -er/-or)", () => {
    expect(rule().lint("カメラを持参する。", CONFIG)).toHaveLength(0);
  });

  it("does not flag カナダ (proper noun, not -er/-or)", () => {
    expect(rule().lint("カナダへ旅行した。", CONFIG)).toHaveLength(0);
  });

  it("does not flag バナナ (non -er/-or word)", () => {
    expect(rule().lint("バナナを食べた。", CONFIG)).toHaveLength(0);
  });

  it("does not flag サラダ (non -er/-or word)", () => {
    expect(rule().lint("サラダを作った。", CONFIG)).toHaveLength(0);
  });

  it("does not flag アイデア (idea → not -er/-or)", () => {
    expect(rule().lint("いいアイデアが浮かんだ。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ギタリスト (ギタ is mid-compound, not word-final)", () => {
    // ギタ + リスト → ギタリスト: ギタ の直後がカタカナなので語末でない
    expect(rule().lint("ギタリストが演奏した。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("ギタ", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-okurigana-okona-u
// ---------------------------------------------------------------------------
describe("nh-okurigana-okona-u — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-okona-u")!;

  it("flags 行なう", () => {
    const issues = rule().lint("検査を行なう。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("行う");
  });

  it("flags 行なわれる", () => {
    const issues = rule().lint("式が行なわれた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("行わ");
  });

  it("leaves 行う untouched", () => {
    expect(rule().lint("検査を行う。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("行なう", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-okurigana-arawa-su
// ---------------------------------------------------------------------------
describe("nh-okurigana-arawa-su — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-arawa-su")!;

  it("flags 著わす", () => {
    const issues = rule().lint("本を著わす。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("著す");
  });

  it("flags 表わす", () => {
    const issues = rule().lint("感情を表わす。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("表す");
  });

  it("flags 現われる", () => {
    const issues = rule().lint("問題が現われる。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    // "現われる" → pattern matches "現われ" + "る", replacement is "現れ" + "る" = "現れる"
    expect(issues[0].fix?.replacement).toBe("現れる");
  });

  it("leaves 著す / 表す / 現れる untouched", () => {
    expect(rule().lint("本を著す。感情を表す。問題が現れる。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("著わす", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-okurigana-kotowa-ru
// ---------------------------------------------------------------------------
describe("nh-okurigana-kotowa-ru — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-kotowa-ru")!;

  it("flags 断わる", () => {
    const issues = rule().lint("依頼を断わる。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("断る");
  });

  it("flags 賜わる", () => {
    const issues = rule().lint("賞を賜わる。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("賜る");
  });

  it("leaves 断る / 賜る untouched", () => {
    expect(rule().lint("依頼を断る。賞を賜る。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("断わる", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-kana-auxiliary-verb
// ---------------------------------------------------------------------------
describe("nh-kana-auxiliary-verb — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-kana-auxiliary-verb")!;

  it("flags て見る (auxiliary)", () => {
    // 「て+見る」（補助動詞）を検出する（「で」は格助詞との区別が困難なため対象外）
    const issues = rule().lint("やって見る。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags て仕舞う (auxiliary)", () => {
    const issues = rule().lint("宿題をやって仕舞う。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags て置く (auxiliary)", () => {
    // 「て置く」パターン（て + 置 + 活用）を検出する
    const issues2 = rule().lint("資料をまとめて置く。", CONFIG);
    expect(issues2.length).toBeGreaterThan(0);
  });

  it("leaves kana form untouched", () => {
    expect(rule().lint("本を読んでみる。宿題をやってしまう。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(
      rule().lint("やって見る。", { ...CONFIG, enabled: false }),
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-she-je
// ---------------------------------------------------------------------------
describe("nh-katakana-she-je — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-she-je")!;

  it("flags シエード → シェード", () => {
    const issues = rule().lint("シエードを下げる。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("シェ");
  });

  it("flags ジエット → ジェット", () => {
    const issues = rule().lint("ジエットエンジン。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ジェ");
  });

  it("leaves シェ / ジェ untouched", () => {
    expect(rule().lint("シェードを下げる。ジェットエンジン。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("シエード", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-fa-fi-fe-fo
// ---------------------------------------------------------------------------
describe("nh-katakana-fa-fi-fe-fo — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-fa-fi-fe-fo")!;

  it("flags フアイル → ファイル", () => {
    const issues = rule().lint("フアイルを開く。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ファ");
  });

  it("flags フイルム → フィルム", () => {
    const issues = rule().lint("フイルムを現像する。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("フィ");
  });

  it("leaves ファ / フィ / フェ / フォ untouched", () => {
    expect(rule().lint("ファイル。フィルム。フェンス。フォーク。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("フアイル", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nh-katakana-ti-di
// ---------------------------------------------------------------------------
describe("nh-katakana-ti-di — detections", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-ti-di")!;

  it("flags パーテイー → パーティー", () => {
    const issues = rule().lint("パーテイーに出席した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ティ");
  });

  it("flags ボランテイア → ボランティア", () => {
    const issues = rule().lint("ボランテイアに参加した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ティ");
  });

  it("leaves ティ / ディ untouched", () => {
    expect(rule().lint("ティーカップ。ディスプレイ。", CONFIG)).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("パーテイー", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Regression tests — Fix 1: nh-katakana-sokuon false-positive exclusions
// ---------------------------------------------------------------------------
describe("nh-katakana-sokuon — regression: exclusion word list", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-sokuon")!;

  it("does not flag カツラ (proper katakana word)", () => {
    expect(rule().lint("カツラをかぶる。", CONFIG)).toHaveLength(0);
  });

  it("does not flag マツダ (proper noun)", () => {
    expect(rule().lint("マツダの車を買った。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ウォルツ (dance name)", () => {
    expect(rule().lint("ウォルツを踊る。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ワルツ (music form)", () => {
    expect(rule().lint("ワルツを演奏する。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ピッツァ (ッ precedes ツ)", () => {
    expect(rule().lint("ピッツァを食べた。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ピッツェリア", () => {
    expect(rule().lint("ピッツェリアへ行く。", CONFIG)).toHaveLength(0);
  });

  it("does not flag 中黒区切りの連語（ツ preceded by ・）", () => {
    // 中黒の後の ツ は語頭として扱われ、lookbehind が [ァ-ヶー] のみになったため対象外
    expect(rule().lint("ビタミン・ツアー", CONFIG)).toHaveLength(0);
  });

  it("still flags バツグ (genuinely wrong)", () => {
    expect(rule().lint("バツグを持った。", CONFIG).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Regression tests — Fix 2: nh-katakana-chouon-er-or ホワイトリスト方式の偽陽性ゼロ確認
// ---------------------------------------------------------------------------
describe("nh-katakana-chouon-er-or — regression: whitelist approach false-positive free", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-chouon-er-or")!;

  // 非 -er/-or/-ar 語（完全に対象外）
  it("does not flag コーラ (non -er/-or word)", () => {
    expect(rule().lint("コーラを飲む。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ソーダ (non -er/-or word)", () => {
    expect(rule().lint("ソーダ水を注文した。", CONFIG)).toHaveLength(0);
  });

  it("does not flag オーロラ (non -er/-or word)", () => {
    expect(rule().lint("オーロラを見た。", CONFIG)).toHaveLength(0);
  });

  it("does not flag アメリカ (proper noun, not -er/-or)", () => {
    expect(rule().lint("アメリカへ行く。", CONFIG)).toHaveLength(0);
  });

  it("does not flag イタリア (proper noun, not -er/-or)", () => {
    expect(rule().lint("イタリア料理が好きだ。", CONFIG)).toHaveLength(0);
  });

  // 書籍が両形許容と明示した語
  it("does not flag コンピュータ（書籍明示の揺れ許容形）", () => {
    expect(rule().lint("コンピュータで作業した。", CONFIG)).toHaveLength(0);
  });

  it("does not flag エレベータ（書籍明示の揺れ許容形）", () => {
    expect(rule().lint("エレベータが来た。", CONFIG)).toHaveLength(0);
  });

  it("does not flag トランジスタ（書籍明示の揺れ許容形）", () => {
    expect(rule().lint("トランジスタ回路を学ぶ。", CONFIG)).toHaveLength(0);
  });

  // ホワイトリスト語は依然として検出する
  it("still flags ギタ (genuinely missing ー, in whitelist)", () => {
    expect(rule().lint("ギタの音。", CONFIG).length).toBeGreaterThan(0);
  });

  it("still flags ルータ (genuinely missing ー, in whitelist)", () => {
    expect(rule().lint("ルータの設定をした。", CONFIG).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Regression tests — Fix 3: nh-kana-auxiliary-verb — で is not flagged
// ---------------------------------------------------------------------------
describe("nh-kana-auxiliary-verb — regression: instrumental で not flagged", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-kana-auxiliary-verb")!;

  it("does not flag テレビで見た（格助詞 で）", () => {
    expect(rule().lint("テレビで見た。", CONFIG)).toHaveLength(0);
  });

  it("does not flag 電話で頂いた（格助詞 で）", () => {
    expect(rule().lint("電話で頂いた。", CONFIG)).toHaveLength(0);
  });

  it("still flags て見る (auxiliary て)", () => {
    expect(rule().lint("試して見る。", CONFIG).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Regression tests — Fix 4: nh-katakana-small-ya-yu-yo — 和語擬態語除外
// ---------------------------------------------------------------------------
describe("nh-katakana-small-ya-yu-yo — regression: 和語擬態語除外", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-small-ya-yu-yo")!;

  it("does not flag ニヤニヤ", () => {
    expect(rule().lint("ニヤニヤしている。", CONFIG)).toHaveLength(0);
  });

  it("does not flag チヤホヤ", () => {
    expect(rule().lint("チヤホヤされる。", CONFIG)).toHaveLength(0);
  });

  it("does not flag シヤチホコ", () => {
    expect(rule().lint("シヤチホコのような姿勢。", CONFIG)).toHaveLength(0);
  });

  it("still flags シヤワー → シャワー (loanword)", () => {
    expect(rule().lint("シヤワーを浴びた。", CONFIG).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Regression tests — Fix 5: nh-okurigana-arawa-su — 現われれ形
// ---------------------------------------------------------------------------
describe("nh-okurigana-arawa-su — regression: 現われれ（ば）形", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-arawa-su")!;

  it("flags 現われれば and suggests 現れれ", () => {
    const issues = rule().lint("問題が現われれば対処する。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    // pattern: 現われ + れ → replacement: 現れ + れ = 現れれ
    expect(issues[0].fix?.replacement).toBe("現れれ");
  });

  it("flags 現われる (existing, still works)", () => {
    const issues = rule().lint("問題が現われる。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("現れる");
  });
});

// ---------------------------------------------------------------------------
// Regression tests — Fix 7: nh-katakana-she-je — 固有名詞除外
// ---------------------------------------------------------------------------
describe("nh-katakana-she-je — regression: 固有名詞除外", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-she-je")!;

  it("does not flag シエラ（固有名詞）", () => {
    expect(rule().lint("シエラレオネへ行く。", CONFIG)).toHaveLength(0);
  });

  it("does not flag シエナ（固有名詞）", () => {
    expect(rule().lint("シエナの街を歩く。", CONFIG)).toHaveLength(0);
  });

  it("still flags シエード → シェード", () => {
    expect(rule().lint("シエードを下げる。", CONFIG).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// L2 rule: nh-kana-formal-noun — lintWithTokens unit tests
// ---------------------------------------------------------------------------
// L2 rule: nh-kana-formal-noun — lintWithTokens unit tests
// ---------------------------------------------------------------------------
describe("nh-kana-formal-noun — lintWithTokens", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-kana-formal-noun")! as unknown as MorphRule;

  function tok(surface: string, pos_detail_1: string, start: number, end: number): Token {
    return { surface, pos: "名詞", pos_detail_1, start, end } as Token;
  }

  it("flags 事 used as formal noun (非自立)", () => {
    const tokens = [tok("事", "非自立", 5, 6)];
    const issues = rule().lintWithTokens("勉強する事が大切だ", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("こと");
    expect(issues[0].from).toBe(5);
    expect(issues[0].to).toBe(6);
  });

  it("flags 物 used as formal noun (非自立)", () => {
    const tokens = [tok("物", "非自立", 3, 4)];
    const issues = rule().lintWithTokens("いい物だ", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("もの");
  });

  it("flags 所 used as formal noun (非自立)", () => {
    const tokens = [tok("所", "非自立", 6, 7)];
    const issues = rule().lintWithTokens("やってみる所だ", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ところ");
  });

  it("flags 訳 used as formal noun (非自立)", () => {
    const tokens = [tok("訳", "非自立", 3, 4)];
    const issues = rule().lintWithTokens("なの訳だ", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("わけ");
  });

  it("does not flag 事 as general noun (一般)", () => {
    const tokens = [tok("事", "一般", 0, 1)];
    const issues = rule().lintWithTokens("事件", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    const tokens = [tok("事", "非自立", 0, 1)];
    const issues = rule().lintWithTokens("事だ", tokens, { ...CONFIG, enabled: false });
    expect(issues).toHaveLength(0);
  });

  it("lint() returns empty array (L2 stub)", () => {
    expect(rule().lint("勉強する事が大切だ", CONFIG)).toHaveLength(0);
  });
});
