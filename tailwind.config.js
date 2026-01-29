/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E8B017", // Gold
          foreground: "#1A1A1A",
        },
        secondary: {
          DEFAULT: "#9B7EB5", // Purple
          foreground: "#FFFFFF",
        },
        background: "#000000",
        surface: "#121212",
        card: "#1E1E1E",
        text: {
          primary: "#FFFFFF",
          secondary: "#A1A1AA",
          muted: "#525252",
        },
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
}
