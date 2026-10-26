/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        samadhan: {
          dark: '#0c0e12',
          card: '#141820',
          border: '#232936',
          accent: '#e11d48', // editorial accent red
          emerald: '#10b981',
          gold: '#f59e0b',
        },
      },
      fontFamily: {
        editorial: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
