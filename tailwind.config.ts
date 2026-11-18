import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#07070c",
          900: "#0a0a12",
          850: "#0e0e18",
          800: "#12121e",
          700: "#1a1a2a",
          600: "#242436",
          500: "#33334a",
        },
        volt: {
          DEFAULT: "#d8ff3e",
          dim: "#a8cc2e",
          ink: "#161d04",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        tech: ["var(--font-tech)", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "live-dot": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.7)" },
          "50%": { boxShadow: "0 0 0 6px rgba(239,68,68,0)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "marquee-fast": "marquee 20s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        "live-dot": "live-dot 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
