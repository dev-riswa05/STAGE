/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],

  
}
 // tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#CE0033",
        "background-dark": "#121212",
        "surface-dark": "#1d1d1d",
        "border-dark": "#2a2a2a",
        "text-primary-dark": "#E0E0E0",
        "text-secondary-dark": "#B0B0B0",
      },
    },
  },
  plugins: [],
}