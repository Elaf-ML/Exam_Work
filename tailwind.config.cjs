/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6', // Bright purple
        'primary-dark': '#7C3AED',
        'primary-light': '#A78BFA',
        dark: '#121212', // Black
        'dark-light': '#1E1E1E',
        'dark-lighter': '#2D2D2D',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        gaming: ['Poppins', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        gameshub: {
          primary: '#8B5CF6',
          secondary: '#7C3AED',
          accent: '#A78BFA',
          neutral: '#121212',
          "base-100": '#1E1E1E',
          "base-200": '#2D2D2D',
          "base-300": '#3D3D3D',
        },
      },
    ],
  },
} 