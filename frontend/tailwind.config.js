/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm healthcare palette.
        cream: "#FFF7F2",
        brand: {
          DEFAULT: "#E11D48",
          dark: "#BE123C",
          light: "#FB7185",
        },
        status: {
          green: "#16A34A",
          amber: "#F59E0B",
          red: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        deva: ["Noto Sans Devanagari", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px -8px rgba(225, 29, 72, 0.18)",
      },
    },
  },
  plugins: [],
};
