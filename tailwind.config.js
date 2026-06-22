/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1720",
        panel: "#151d28",
        panelSoft: "#1c2633",
        line: "#2d3948",
        accent: "#d5a94f",
      },
    },
  },
  plugins: [],
};
