/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        canvas: "#0B0C0E",
        surface: "#13161A",
        border: "#232830",
        muted: "#1C1F24",
        strike: "#FF6B00",
        text: {
          primary: "#E4E6EB",
          secondary: "#98A2B3",
          dim: "#475467",
          ghost: "#232830",
        },
      },
      keyframes: {
        scan: {
          "0%, 100%": { top: "0%" },
          "50%": { top: "100%" },
        },
      },
      animation: {
        scan: "scan 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
