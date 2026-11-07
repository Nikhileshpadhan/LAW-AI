/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        chamber: {
          bg: "var(--chamber-bg)",
          surface: "var(--chamber-surface)",
          card: "var(--chamber-card)",
          border: "var(--chamber-border)",
          text: "var(--chamber-text)",
          muted: "var(--chamber-muted)",
        },
        judicial: {
          gold: "var(--judicial-gold)",
          goldBg: "var(--judicial-gold-bg)",
          goldBorder: "var(--judicial-gold-border)",
          blue: "var(--judicial-blue)",
          blueBg: "var(--judicial-blue-bg)",
          rose: "var(--judicial-rose)",
          emerald: "var(--judicial-emerald)",
        }
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      }
    },
  },
  plugins: [],
}
