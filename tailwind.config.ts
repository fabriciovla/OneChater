import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f7f7f5",
          100: "#ebebea",
          400: "#6b6b6b",
          500: "#3d3d3d",
          600: "#1a1b1f",
          700: "#0e0f12",
          900: "#000000",
        },
        accent: {
          400: "#6b6b6b",
          500: "#3d3d3d",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        "fade-up":     "fadeUp 1s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in":     "fadeIn 1.2s ease-out both",
        "fade-down":   "fadeDown 0.8s cubic-bezier(0.22,1,0.36,1) both",
        "float":       "float 6s ease-in-out infinite",
        "glow-pulse":  "glowPulse 3s ease-in-out infinite",
        "slide-right": "slideRight 0.9s ease-out both",
        "spin-slow":   "spin 8s linear infinite",
        "toast-in":    "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        "toast-out":   "toastOut 0.2s ease-in forwards",
      },
      keyframes: {
        fadeDown: {
          "0%":   { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 2px rgba(0,0,0,0.08)" },
          "50%":      { boxShadow: "0 0 0 3px rgba(0,0,0,0.15)" },
        },
        slideRight: {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        toastIn: {
          "0%":   { opacity: "0", transform: "translateY(10px) scale(0.93)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        toastOut: {
          "0%":   { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(6px) scale(0.96)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  safelist: ["animate-toast-in", "animate-toast-out"],
  plugins: [],
};

export default config;
