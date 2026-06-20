/**
 * Ruleset entry point. Builds the single default-exported RulesetModule.
 *
 * - `manifest` is plain data loaded from manifest.json (read without running code).
 * - `createRules(ctx)` builds the concrete rules using SDK tools from `ctx`.
 *
 * Only `import type` from "illusions-lint-sdk"; runtime tools come via `ctx`.
 */
import type { RulesetContext, RulesetModule } from "illusions-lint-sdk";

import manifestJson from "../manifest.json";
import { createNhKatakanaWiWeWo } from "./rules/nh-katakana-wi-we-wo";
import { createNhKatakanaDiDu } from "./rules/nh-katakana-di-du";
import { createNhKatakanaSmallYaYuYo } from "./rules/nh-katakana-small-ya-yu-yo";
import { createNhKatakanaSokuon } from "./rules/nh-katakana-sokuon";
import { createNhKatakanaChouonErOr } from "./rules/nh-katakana-chouon-er-or";
import { createNhOkuriganaOkonaU } from "./rules/nh-okurigana-okona-u";
import { createNhOkuriganaArawaSu } from "./rules/nh-okurigana-arawa-su";
import { createNhOkuriganaKotowaRu } from "./rules/nh-okurigana-kotowa-ru";
import { createNhKanaAuxiliaryVerb } from "./rules/nh-kana-auxiliary-verb";
import { createNhKatakanaSheJe } from "./rules/nh-katakana-she-je";
import { createNhKatakanaFaFiFeFo } from "./rules/nh-katakana-fa-fi-fe-fo";
import { createNhKatakanaTiDi } from "./rules/nh-katakana-ti-di";
import { createNhKanaFormalNoun } from "./rules/nh-kana-formal-noun";
import { createNhHojoVerbL2 } from "./rules/nh-hojo-verb-l2";

const manifest = manifestJson as RulesetModule["manifest"];

const ruleset: RulesetModule = {
  manifest,
  createRules(ctx: RulesetContext) {
    return [
      createNhKatakanaWiWeWo(ctx, manifest),
      createNhKatakanaDiDu(ctx, manifest),
      createNhKatakanaSmallYaYuYo(ctx, manifest),
      createNhKatakanaSokuon(ctx, manifest),
      createNhKatakanaChouonErOr(ctx, manifest),
      createNhOkuriganaOkonaU(ctx, manifest),
      createNhOkuriganaArawaSu(ctx, manifest),
      createNhOkuriganaKotowaRu(ctx, manifest),
      createNhKanaAuxiliaryVerb(ctx, manifest),
      createNhKatakanaSheJe(ctx, manifest),
      createNhKatakanaFaFiFeFo(ctx, manifest),
      createNhKatakanaTiDi(ctx, manifest),
      createNhKanaFormalNoun(ctx, manifest),
      createNhHojoVerbL2(ctx, manifest),
    ];
  },
};

export default ruleset;
