/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0b10',
        card: '#11131e',
        primary: {
          light: '#a78bfa',
          DEFAULT: '#7c3aed',
          dark: '#5b21b6',
        },
        secondary: {
          light: '#38bdf8',
          DEFAULT: '#0284c7',
          dark: '#075985',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        glow: '0 0 15px rgba(124, 58, 237, 0.4)',
      }
    },
  },
  plugins: [],
}
