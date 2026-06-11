import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        customBorder: "var(--border)",
        customMuted: "var(--muted)",
        customSecondary: "var(--secondary)",
        primaryTxt: "var(--primary-txt)",
        brandBlue: "var(--blue)",
        brandBlueDim: "var(--blue-dim)",
        brandCyan: "var(--cyan)",
        brandOrange: "var(--orange)",
        brandRed: "var(--red)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
      }
    },
  },
  plugins: [],
};
export default config;
