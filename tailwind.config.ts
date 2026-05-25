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
        "fade-up":     "fadeUp 0.6s ease-out forwards",
        "fade-in":     "fadeIn 0.8s ease-out forwards",
        "float":       "float 6s ease-in-out infinite",
        "glow-pulse":  "glowPulse 3s ease-in-out infinite",
        "slide-right": "slideRight 0.5s ease-out forwards",
        "spin-slow":   "spin 8s linear infinite",
      },
      keyframes: {
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
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
