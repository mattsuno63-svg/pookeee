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
        background: "#000000",
        foreground: "#FFFFFF",
        accent: "#EDFF66",
        primary: "#5724FF",
        muted: "rgba(255, 255, 255, 0.8)",
        border: "rgba(255, 255, 255, 0.2)",
      },
      fontFamily: {
        zentry: ["var(--font-zentry)", "system-ui", "sans-serif"],
        robert: ["var(--font-robert)", "system-ui", "sans-serif"],
        general: ["var(--font-general)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        btn: "1.875rem",
        card: "0.3125rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "underline-in": "underline-in 0.3s ease forwards",
        "underline-out": "underline-out 0.3s ease forwards",
        "music-play": "music-play 0.8s infinite alternate",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
      },
      keyframes: {
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(1.5rem)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "underline-in": {
          from: { left: "0", width: "0" },
          to: { left: "0", width: "100%" },
        },
        "underline-out": {
          from: { left: "0", width: "100%" },
          to: { left: "100%", width: "0" },
        },
        "music-play": {
          "0%": { transform: "scaleY(0.5)", opacity: "0.7" },
          "100%": { transform: "scaleY(1.2)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
