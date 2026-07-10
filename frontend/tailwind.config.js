/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        gray: {
          750: "#2a3241",
          950: "#0a0a0f",
        },
        accent: {
          blue: "#3B82F6",
          green: "#10B981",
          red: "#EF4444",
          amber: "#F59E0B",
        },
        surface: {
          primary: "#0F1117",
          secondary: "#1A1D28",
          tertiary: "#252836",
        },
        text: {
          primary: "#F1F5F9",
          secondary: "#94A3B8",
          muted: "#64748B",
        },
      },
    },
  },
  plugins: [],
};
