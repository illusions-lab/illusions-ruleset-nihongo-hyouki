import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import manifest from "../manifest.json";
import { createTestContext, CONFIG } from "./test-kit";

/**
 * Golden tests driven by manifest.docs:
 * every rule's positive example must yield 0 issues,
 * and its negative example must yield >= 1 issue.
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

      it("negative example is flagged", () => {
        expect(rule!.lint(meta.docs.negativeExample, CONFIG).length).toBeGreaterThan(0);
      });
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

  it("flags ギタ (missing ー)", () => {
    const issues = rule().lint("ギタの音が響いた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags マフラ (missing ー)", () => {
    const issues = rule().lint("マフラを巻いた。", CONFIG);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("leaves ギター untouched", () => {
    expect(rule().lint("ギターを弾く。", CONFIG)).toHaveLength(0);
  });

  it("leaves マフラー untouched", () => {
    expect(rule().lint("マフラーを巻いた。", CONFIG)).toHaveLength(0);
  });

  it("does not flag conventional short forms", () => {
    // エレベータ・コンピュータ は慣用で許容
    expect(rule().lint("コンピュータを使う。", CONFIG)).toHaveLength(0);
    expect(rule().lint("エレベータに乗る。", CONFIG)).toHaveLength(0);
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
    const issues = rule().lint("本を読んで見る。", CONFIG);
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
      rule().lint("本を読んで見る。", { ...CONFIG, enabled: false }),
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
