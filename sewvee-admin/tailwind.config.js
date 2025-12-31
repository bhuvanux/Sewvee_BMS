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
          50: '#f0f9f8',
          100: '#d1f0ea',
          200: '#a3e1d5',
          300: '#6ecabc',
          400: '#43af9f',
          500: '#0E9F8A', // Sewvee Brand Color
          600: '#0b8171',
          700: '#0a675c',
          800: '#09534a',
          900: '#08453e',
        },
      },
    },
  },
  plugins: [],
}
