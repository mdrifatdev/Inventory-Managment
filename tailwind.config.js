/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#3b82f6",
        pagebg: "#f8fafc",
        card: "#ffffff",
        "text-primary": "#1e293b",
        "text-secondary": "#64748b",
      }
    },
  },
  plugins: [],
}
