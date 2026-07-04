/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F766E", // Teal 700 (Premium modern)
        accent: "#14B8A6",  // Teal 500
      }
    },
  },
  plugins: [],
}
