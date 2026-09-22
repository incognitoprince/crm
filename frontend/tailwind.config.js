/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          700: "#1e3a5f",
          800: "#162c49",
          900: "#0f1f35",
        },
        sand: {
          50: "#f8f5f0",
          100: "#efe8dc",
        },
      },
    },
  },
  plugins: [],
};
