/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          700: "#155a8c",
          800: "#123e63",
          900: "#102f4f",
        },
        sand: {
          50: "#f5f9fd",
          100: "#e7eef6",
        },
      },
    },
  },
  plugins: [],
};
