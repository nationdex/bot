import type { UserConfig } from '@unocss/core';
import presetWind4 from '@unocss/preset-wind4';

// Tailwind v4-compatible utilities (bg-(--var), size-*, dark: via the "dark" class on <html>).
const config: UserConfig = {
  presets: [presetWind4()],
};

export default config;
