import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101211",
        panel: "#181B1A",
        raised: "#202423",
        edge: "#2E3331",
        lime: { DEFAULT: "#B7F03C", dark: "#9BD126" },
        bone: "#F1F3EE",
        mist: "#A6ADA6",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        logo: ["Undergrad", "var(--font-logo)", "Impact", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
