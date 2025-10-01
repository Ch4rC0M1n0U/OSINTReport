module.exports = {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        osint: {
          primary: "#1d4ed8",
          "primary-content": "#ffffff",
          secondary: "#2563eb",
          accent: "#0ea5e9",
          neutral: "#111827",
          "base-100": "#f3f4f6",
          "base-200": "#e5e7eb",
          "base-300": "#d1d5db",
          info: "#38bdf8",
          success: "#10b981",
          warning: "#fbbf24",
          error: "#ef4444",
        },
      },
      "night",
    ],
  },
};
