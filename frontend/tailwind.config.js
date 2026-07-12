/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: "#000000",
        bgSecondary: "#0A0A0A",
        cardBg: "rgba(20, 20, 20, 0.95)",
        primaryGreen: "#00C853",
        secondaryCyan: "#00E5FF",
        dangerRed: "#FF3366",
        warningOrange: "#FF9F43",
        textPrimary: "#FFFFFF",
        textSecondary: "#E5E7EB",
        textMuted: "#B0B0B0",
      },
      boxShadow: {
        glow: "0 0 15px rgba(0, 229, 255, 0.15)",
        card: "0 10px 30px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
