import type { Config } from "tailwindcss";
// @ts-ignore
import daisyui from "daisyui";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        pink: {
          "primary": "#D4537E", // primary pink — buttons, FAB, toggle on
          "primary-content": "#ffffff",
          "secondary": "#FBEAF0", // light pink — icon bg, badge
          "accent": "#72243E", // dark pink — text on light pink
          "neutral": "#1a1a1a",
          "base-100": "#ffffff", // card bg
          "base-200": "#fafafa", // page bg
          "base-300": "#f0f0f0", // border
        },
      },
    ],
  },
} satisfies Config & { daisyui?: any };
