/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        disaster: {
          50: '#f5f7fa',
          100: '#ebeef5',
          200: '#d1dae8',
          300: '#b7c6db',
          400: '#7d9cc4',
          500: '#4372ad',
          600: '#3d669c',
          700: '#2d4d7b',
          800: '#1d345a',
          900: '#0d1b39',
        }
      }
    },
  },
  plugins: [],
}
