import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        telkom: {
          red:       "#9B1C1C",
          "red-dark":"#7A1515", 
          "red-deep":"#5C0F0F", 
          "red-light":"#C53030",
          "red-muted":"#FEF2F2",
          "red-soft": "#FECACA",
          gold:       "#D4AF37", 
          cream:      "#FDF8F0", 
        },
      },
      fontFamily: {
        // Font utama
        sans: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        // Font heading
        serif: ["Merriweather", "ui-serif", "Georgia", "serif"],
        // Font mono untuk kode/ID
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "telkom-sm": "0 2px 8px rgba(155, 28, 28, 0.12)",
        "telkom-md": "0 4px 20px rgba(155, 28, 28, 0.18)",
        "telkom-lg": "0 8px 40px rgba(155, 28, 28, 0.22)",
        "card":      "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08)",
      },
      animation: {
        "fade-in":      "fadeIn 0.4s ease-out both",
        "slide-up":     "slideUp 0.4s ease-out both",
        "slide-in-left":"slideInLeft 0.3s ease-out both",
        "pulse-dot":    "pulseDot 1.4s ease-in-out infinite",
        "shimmer":      "shimmer 1.8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%":   { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseDot: {
          "0%, 100%": { transform: "scale(0.7)", opacity: "0.5" },
          "50%":      { transform: "scale(1.1)", opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      backgroundImage: {
        "telkom-gradient":  "linear-gradient(135deg, #9B1C1C 0%, #7A1515 100%)",
        "telkom-gradient-r":"linear-gradient(135deg, #7A1515 0%, #9B1C1C 100%)",
        "hero-pattern":     "radial-gradient(ellipse at top left, #9B1C1C 0%, #5C0F0F 60%, #3D0808 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;