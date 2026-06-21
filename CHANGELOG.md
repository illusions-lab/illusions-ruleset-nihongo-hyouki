# Changelog

すべての重要な変更をこのファイルに記録します。
形式は [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、
[Semantic Versioning](https://semver.org/lang/ja/) を採用します。

## [Unreleased]

## [0.4.1] - 2026-06-21

### Changed

- マーケットプレイス用 OG 画像（`OG.png`）を作成。
- `LICENSE` の著作権者を記入し、テンプレート残置を整理。

### Removed

- テンプレート残置ファイル `docs/rules/sample-fw-exclaim.md` および `test/sample-fw-exclaim.test.ts` を削除。

## [0.4.0] - 2026-06-20

### Changed

- 文体正規化系 7 ルールの `applicableModes` を全 5 モードから `official`・`blog`・`academic` の 3 モードに限定。
  送り仮名本則の強制・漢字仮名使い分け・カタカナ長音統一は文体正規化（style）プロファイルであり、`novel`（文学的文体許容）・`sns`（口語・略記許容）では誤検出源・過剰指摘となるため除外。
  対象ルール：
  - `nh-katakana-chouon-er-or`（語末 -er/-or/-ar 長音符）
  - `nh-okurigana-okona-u`（「行なう」→「行う」）
  - `nh-okurigana-arawa-su`（「著わす」「表わす」「現われる」→ 本則形）
  - `nh-okurigana-kotowa-ru`（「断わる」→「断る」）
  - `nh-kana-auxiliary-verb`（補助動詞の仮名書き）
  - `nh-kana-formal-noun`（形式名詞の仮名書き）
  - `nh-hojo-verb-l2`（補助動詞「ていく・てくる」の仮名書き）

### Fixed

- `package.json` の `name` を `illusions-ruleset-template` から `illusions-ruleset-nihongo-hyouki` に修正（テンプレートからのコピー漏れ）。

## [0.3.0] - 2025-01-01

### Added

- 全 14 ルール（L1 × 12、L2 × 2）を初期実装。外来語カタカナ正書法 8 ルール、送り仮名本則 3 ルール、漢字仮名使い分け 3 ルール。
