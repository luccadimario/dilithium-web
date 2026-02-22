/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        space: {
          950: "#030712",
          900: "#0a0f1e",
          800: "#111827",
          700: "#1e293b",
          600: "#8494a7",
        },
        crystal: {
          400: "#22d3ee",
          500: "#00bfef",
          600: "#0891b2",
          700: "#0e7490",
        },
        nebula: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
        },
      },
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-up": "slide-up 0.3s ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 8px rgba(0, 191, 239, 0.4))",
          },
          "50%": {
            filter: "drop-shadow(0 0 20px rgba(0, 191, 239, 0.8))",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
