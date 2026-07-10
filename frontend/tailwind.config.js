/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          750: "#2a3241",
          950: "#0a0a0f",
        },
      },
    },
  },
  plugins: [],
};
