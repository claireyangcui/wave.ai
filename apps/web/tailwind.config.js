/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00f5ff',
          dark: '#00ccd4',
        },
        accent: {
          purple: '#a855f7',
          cyan: '#00f5ff',
        },
      },
    },
  },
  plugins: [],
}

