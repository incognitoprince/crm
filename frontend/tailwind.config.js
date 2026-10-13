/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
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
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec3ff",
          400: "#59a4ff",
          500: "#2f86f6",
          600: "#1a69e0",
          700: "#1554b8",
          800: "#154795",
          900: "#0f2f66",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,47,79,.04), 0 8px 24px -8px rgba(16,47,79,.10)",
        lift: "0 2px 4px rgba(16,47,79,.05), 0 18px 40px -12px rgba(26,105,224,.25)",
        glow: "0 8px 24px -6px rgba(26,105,224,.55)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(.96)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "slide-right": { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-50px) scale(1.12)" },
          "66%": { transform: "translate(-30px,30px) scale(.92)" },
        },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        "draw-ring": { "0%": { strokeDashoffset: "var(--ring-len)" }, "100%": { strokeDashoffset: "var(--ring-off)" } },
        "grow-x": { "0%": { transform: "scaleX(0)" }, "100%": { transform: "scaleX(1)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(47,134,246,.45)" }, "100%": { boxShadow: "0 0 0 14px rgba(47,134,246,0)" } },
      },
      animation: {
        "fade-up": "fade-up .55s cubic-bezier(.22,1,.36,1) both",
        "fade-in": "fade-in .4s ease both",
        "scale-in": "scale-in .35s cubic-bezier(.22,1,.36,1) both",
        "slide-right": "slide-right .45s cubic-bezier(.22,1,.36,1) both",
        blob: "blob 14s ease-in-out infinite",
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
        "draw-ring": "draw-ring 1.2s cubic-bezier(.22,1,.36,1) both",
        "grow-x": "grow-x .9s cubic-bezier(.22,1,.36,1) both",
        "pulse-ring": "pulse-ring 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
