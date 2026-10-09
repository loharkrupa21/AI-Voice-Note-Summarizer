/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6C5CE7", // blue-purple
        secondary: "#A29BFE",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)"
      }
    },
  },
  plugins: [],
};
