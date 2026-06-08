import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        page: "#FAF8F0",
        shell: "#F3E7B3",
        surface: "#FFFFFF",
        "surface-soft": "#F6F1DF",
        "surface-hover": "#EFE2AA",
        border: "#0B1F2A",
        "border-soft": "#D8CFB0",
        ink: "#0B1F2A",
        muted: "#475569",
        subtle: "#64748B",
        accent: "#F0B90B",
        "accent-soft": "#FFF2BF",
        "accent-green": "#00A676",
        warning: "#F0B90B",
        danger: "#E5484D",
        neutral: "#EEE7D2",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ["Be Vietnam Pro", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 0 rgba(11, 31, 42, 0.12), 4px 4px 0 rgba(11, 31, 42, 0.18)",
        hard: "4px 4px 0 rgba(11, 31, 42, 0.18)",
        "hard-sm": "2px 2px 0 rgba(11, 31, 42, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
