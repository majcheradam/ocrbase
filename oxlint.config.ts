import { defineConfig } from "oxlint";

import core from "ultracite/oxlint/core";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, vitest],
});
