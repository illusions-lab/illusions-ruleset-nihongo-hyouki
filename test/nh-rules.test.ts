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

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-wi-we-wo
// ---------------------------------------------------------------------------
describe("nh-katakana-wi-we-wo — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-wi-we-wo")!;

  it("flags both ヰ and ヱ when they appear together", () => {
    const issues = rule().lint("スヰフトとヱルテル。", CONFIG);
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  it("does not flag hiragana text without ヰ/ヱ/ヲ", () => {
    expect(rule().lint("今日は晴れている。", CONFIG)).toHaveLength(0);
  });

  it("does not flag empty string", () => {
    expect(rule().lint("", CONFIG)).toHaveLength(0);
  });

  it("flags ヲ even when surrounded by other katakana", () => {
    const issues = rule().lint("ヲルポールの詩。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].from).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-di-du
// ---------------------------------------------------------------------------
describe("nh-katakana-di-du — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-di-du")!;

  it("does not flag hiragana ぢ/づ (not katakana foreign-word context)", () => {
    // ぢ/づ in hiragana are native Japanese, not foreign katakana
    expect(rule().lint("はなぢが出た。みずづくり。", CONFIG)).toHaveLength(0);
  });

  it("flags both ヂ and ヅ when they appear in one string", () => {
    const issues = rule().lint("ヂャズとヅカ。", CONFIG);
    expect(issues.length).toBe(2);
  });

  it("fix replacement for ヅ is ズ", () => {
    const issues = rule().lint("ヅカダンサー。", CONFIG);
    expect(issues[0].fix?.replacement).toBe("ズ");
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-small-ya-yu-yo
// ---------------------------------------------------------------------------
describe("nh-katakana-small-ya-yu-yo — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-small-ya-yu-yo")!;

  it("does not flag シヤ when followed by fewer than 2 katakana (boundary)", () => {
    // シヤ + 1字は条件 (?=[ァ-ヶー・][ァ-ヶー・]) を満たさないので除外
    expect(rule().lint("シヤン。", CONFIG)).toHaveLength(0);
  });

  it("flags ヒユーズ → ヒューズ", () => {
    const issues = rule().lint("ヒユーズが切れた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toContain("ュ");
  });

  it("does not flag ヤマト (word-initial ヤ without preceding consonant kana)", () => {
    expect(rule().lint("ヤマトを詠む。", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-sokuon
// ---------------------------------------------------------------------------
describe("nh-katakana-sokuon — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-sokuon")!;

  it("flags ネツトワーク → ネットワーク", () => {
    const issues = rule().lint("ネツトワークに接続した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ッ");
  });

  it("does not flag word-final ツ (no following katakana)", () => {
    // ツ at end of string has no following [ァ-ヶー], so lookbehind satisfied but lookahead fails
    expect(rule().lint("カルカツ", CONFIG)).toHaveLength(0);
  });

  it("does not flag ツ preceded by 中黒 (compound boundary)", () => {
    // 中黒「・」is excluded from the lookbehind [ァ-ヶー]
    expect(rule().lint("フルーツ・ツアー", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-okurigana-okona-u
// ---------------------------------------------------------------------------
describe("nh-okurigana-okona-u — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-okona-u")!;

  it("flags 行ない (nominalized form)", () => {
    const issues = rule().lint("正しい行ないをする。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("行い");
  });

  it("flags 行なって (te-form)", () => {
    const issues = rule().lint("式を行なって終わった。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("行っ");
  });

  it("leaves 行商（ぎょうしょう）untouched (compound kanji)", () => {
    expect(rule().lint("行商に出かけた。", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-okurigana-arawa-su
// ---------------------------------------------------------------------------
describe("nh-okurigana-arawa-su — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-arawa-su")!;

  it("flags 著わし (conjunctive form)", () => {
    const issues = rule().lint("文章を著わして発表した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("著し");
  });

  it("flags 表わされる (passive form)", () => {
    const issues = rule().lint("感情が表わされた絵画。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("表さ");
  });

  it("leaves 表示 untouched (unrelated compound)", () => {
    expect(rule().lint("画面に表示された。", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-okurigana-kotowa-ru
// ---------------------------------------------------------------------------
describe("nh-okurigana-kotowa-ru — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-okurigana-kotowa-ru")!;

  it("flags 断わって (te-form)", () => {
    const issues = rule().lint("申し出を断わって帰った。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("断っ");
  });

  it("flags 断わられた (passive)", () => {
    const issues = rule().lint("依頼を断わられた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("断ら");
  });

  it("leaves 断絶 untouched (unrelated compound)", () => {
    expect(rule().lint("関係が断絶した。", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-kana-auxiliary-verb
// ---------------------------------------------------------------------------
describe("nh-kana-auxiliary-verb — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-kana-auxiliary-verb")!;

  it("does not flag 見る as main verb (no preceding て)", () => {
    expect(rule().lint("映画を見る。", CONFIG)).toHaveLength(0);
  });

  it("does not flag 目が見えた（main verb 見える）", () => {
    expect(rule().lint("目が見えた。", CONFIG)).toHaveLength(0);
  });

  it("flags て挙げる (auxiliary)", () => {
    const issues = rule().lint("本を貸して挙げる。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags て貰う (auxiliary)", () => {
    const issues = rule().lint("手伝って貰う。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-she-je
// ---------------------------------------------------------------------------
describe("nh-katakana-she-je — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-she-je")!;

  it("flags ジエット at word start (when followed by カタカナ)", () => {
    const issues = rule().lint("ジエットコースターに乗る。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ジェ");
  });

  it("does not flag シェ/ジェ that are already correctly small", () => {
    expect(rule().lint("シェフが料理する。ジェットエンジン。", CONFIG)).toHaveLength(0);
  });

  it("does not flag セ in エンゼル（慣用形）", () => {
    // エンゼル uses セ by custom, not シエ — so this rule doesn't apply
    expect(rule().lint("エンゼルフィッシュ。", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-fa-fi-fe-fo
// ---------------------------------------------------------------------------
describe("nh-katakana-fa-fi-fe-fo — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-fa-fi-fe-fo")!;

  it("flags フエンシング → フェンシング", () => {
    const issues = rule().lint("フエンシングの試合。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("フェ");
  });

  it("flags フオーク → フォーク", () => {
    const issues = rule().lint("フオークダンスを踊る。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("フォ");
  });

  it("leaves ファ/フィ/フェ/フォ untouched in all four forms", () => {
    expect(rule().lint("ファ、フィ、フェ、フォ。", CONFIG)).toHaveLength(0);
  });

  it("does not flag フ at end of string (no following katakana)", () => {
    expect(rule().lint("スカーフ", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-katakana-ti-di
// ---------------------------------------------------------------------------
describe("nh-katakana-ti-di — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-katakana-ti-di")!;

  it("flags ボランテイア → ボランティア (テイ preceded by katakana)", () => {
    const issues = rule().lint("ボランテイアに参加した。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("ティ");
  });

  it("does not flag テイ/デイ at word-start (lookbehind requires preceding katakana)", () => {
    // テイ/デイ at position 0 has no preceding [ァ-ヶー・] → lookbehind fails → no match.
    // This is a known limitation; mid-word occurrences are caught correctly.
    expect(rule().lint("テイクアウト", CONFIG)).toHaveLength(0);
    expect(rule().lint("デイリーニュース", CONFIG)).toHaveLength(0);
  });

  it("does not flag ティ/ディ already small", () => {
    expect(rule().lint("ティーパーティー。ディーゼルエンジン。", CONFIG)).toHaveLength(0);
  });

  it("does not flag エチケット（慣用でチ）", () => {
    // The rule only flags テイ/デイ; エチケット has チ not テイ, so no issue
    expect(rule().lint("エチケットを守る。", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-kana-formal-noun (L2)
// ---------------------------------------------------------------------------
describe("nh-kana-formal-noun — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-kana-formal-noun")! as unknown as MorphRule;

  function tok(surface: string, pos_detail_1: string, start: number, end: number): Token {
    return { surface, pos: "名詞", pos_detail_1, start, end } as Token;
  }

  it("does not flag 物 tagged as 一般 (substantive noun 物語)", () => {
    const tokens = [tok("物", "一般", 0, 1)];
    const issues = rule().lintWithTokens("物語を読む", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does not flag 所 tagged as 一般 (substantive noun 所属)", () => {
    const tokens = [tok("所", "一般", 0, 1)];
    const issues = rule().lintWithTokens("所属の確認", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does not flag 者（もの）— kanji 者 not in FORMAL_NOUN_MAP", () => {
    // 者 (者) is not the same as 物; only 物 is in the map
    const tokens = [tok("者", "非自立", 0, 1)];
    const issues = rule().lintWithTokens("関係者", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("position offsets are correct for 訳 mid-sentence", () => {
    const tokens = [tok("訳", "非自立", 4, 5)];
    const issues = rule().lintWithTokens("なのよ訳だ", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].from).toBe(4);
    expect(issues[0].to).toBe(5);
  });

  it("handles multiple formal nouns in one token stream", () => {
    const tokens = [
      tok("事", "非自立", 3, 4),
      tok("物", "非自立", 8, 9),
    ];
    const issues = rule().lintWithTokens("する事がある物だ", tokens, CONFIG);
    expect(issues.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// L2 rule: nh-hojo-verb-l2 — lintWithTokens unit tests
// ---------------------------------------------------------------------------
describe("nh-hojo-verb-l2 — lintWithTokens", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-hojo-verb-l2")! as unknown as MorphRule;

  /** 接続助詞「て」トークンを生成 */
  function te(start: number): Token {
    return { surface: "て", pos: "助詞", pos_detail_1: "接続助詞", start, end: start + 1 } as Token;
  }

  /** 動詞トークンを生成（basic_form を指定） */
  function verb(surface: string, basic_form: string, start: number): Token {
    return {
      surface,
      pos: "動詞",
      pos_detail_1: "自立",
      basic_form,
      start,
      end: start + surface.length,
    } as Token;
  }

  // --- 正例（指摘あり） ---

  it("flags 行く after て (基本形)", () => {
    // 「進んで行く」: て(4) 行く(5)
    const tokens = [te(4), verb("行く", "行く", 5)];
    const issues = rule().lintWithTokens("進んで行く", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("いく");
    expect(issues[0].from).toBe(5);
    expect(issues[0].to).toBe(7);
  });

  it("flags 来る after て (基本形)", () => {
    // 「近づいて来る」: て(5) 来る(6)
    const tokens = [te(5), verb("来る", "来る", 6)];
    const issues = rule().lintWithTokens("近づいて来る", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("くる");
  });

  it("flags 行っ (活用形) after て using basic_form", () => {
    // 「増えて行った」: て(3) 行っ(4) た(6)
    const tokens = [te(3), verb("行っ", "行く", 4)];
    const issues = rule().lintWithTokens("増えて行った", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("いく");
  });

  it("flags 来 (活用形) after て using basic_form", () => {
    // 「変わって来た」: て(4) 来(5) た(6)
    const tokens = [te(4), verb("来", "来る", 5)];
    const issues = rule().lintWithTokens("変わって来た", tokens, CONFIG);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].fix?.replacement).toBe("くる");
  });

  // --- 負例（指摘なし） ---

  it("does not flag 行く as main verb (no preceding て)", () => {
    // 「図書館へ行く」: 行く は単独、直前に「て」なし
    const tokens = [verb("行く", "行く", 5)];
    const issues = rule().lintWithTokens("図書館へ行く", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does not flag 来る as main verb (no preceding て)", () => {
    // 「春が来る」
    const tokens = [verb("来る", "来る", 3)];
    const issues = rule().lintWithTokens("春が来る", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does not flag already-kana いく after て", () => {
    // 「進んでいく」: て(3) いく(4) — surface は平仮名
    const tokens = [te(3), verb("いく", "行く", 4)];
    const issues = rule().lintWithTokens("進んでいく", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does not flag already-kana くる after て", () => {
    const tokens = [te(5), verb("くる", "来る", 6)];
    const issues = rule().lintWithTokens("近づいてくる", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("does nothing when disabled", () => {
    const tokens = [te(4), verb("行く", "行く", 5)];
    const issues = rule().lintWithTokens("進んで行く", tokens, { ...CONFIG, enabled: false });
    expect(issues).toHaveLength(0);
  });

  it("lint() returns empty array (L2 stub)", () => {
    expect(rule().lint("進んで行く", CONFIG)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Edge-case tests — nh-hojo-verb-l2 (L2)
// ---------------------------------------------------------------------------
describe("nh-hojo-verb-l2 — edge cases", () => {
  const rule = () =>
    ruleset.createRules(createTestContext()).find((r) => r.id === "nh-hojo-verb-l2")! as unknown as MorphRule;

  function te(start: number): Token {
    return { surface: "て", pos: "助詞", pos_detail_1: "接続助詞", start, end: start + 1 } as Token;
  }

  function verb(surface: string, basic_form: string, start: number): Token {
    return {
      surface,
      pos: "動詞",
      pos_detail_1: "自立",
      basic_form,
      start,
      end: start + surface.length,
    } as Token;
  }

  it("て接続助詞境界: 格助詞で（電車で行く）は対象外", () => {
    // 「電車で行く」: で は格助詞（接続助詞でない）→ 検出しない
    const de: Token = {
      surface: "で",
      pos: "助詞",
      pos_detail_1: "格助詞",
      start: 2,
      end: 3,
    } as Token;
    const tokens = [de, verb("行く", "行く", 3)];
    const issues = rule().lintWithTokens("電車で行く", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("te 接続助詞境界: 格助詞でのあと の 来る も対象外", () => {
    const de: Token = {
      surface: "で",
      pos: "助詞",
      pos_detail_1: "格助詞",
      start: 3,
      end: 4,
    } as Token;
    const tokens = [de, verb("来る", "来る", 4)];
    const issues = rule().lintWithTokens("どこで来る", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("複数の補助動詞が連続するとき両方を検出", () => {
    // 「勉強して行って来た」のように 行く → くる の順に並ぶケース
    const teA = te(4);
    const verbA = verb("行っ", "行く", 5);
    const teB = te(7);
    const verbB = verb("来", "来る", 8);
    const tokens = [teA, verbA, teB, verbB];
    const issues = rule().lintWithTokens("勉強して行って来た", tokens, CONFIG);
    expect(issues.length).toBe(2);
  });

  it("本動詞の 行く に続く補助動詞でない 来る — てなし", () => {
    // 「行くことは来ること」: どちらも本動詞
    const tokens = [
      verb("行く", "行く", 0),
      verb("来る", "来る", 7),
    ];
    const issues = rule().lintWithTokens("行くことは来ること", tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("dedup: 同トークンが重複して渡されても1件のみ報告", () => {
    const teToken = te(3);
    const verbToken = verb("行く", "行く", 4);
    // 同じペアを二度渡す（異常入力）
    const tokens = [teToken, verbToken, teToken, verbToken];
    const issues = rule().lintWithTokens("xxx て 行く", tokens, CONFIG);
    // dedupe により from-to が同じ issue は1件に集約されること
    const seen = new Set(issues.map((i) => `${i.from}-${i.to}`));
    expect(seen.size).toBe(issues.length);
  });
});
