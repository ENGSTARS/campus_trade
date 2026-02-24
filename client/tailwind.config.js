/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        soft: '0 18px 35px -18px rgba(49, 46, 129, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        'campus-gradient': 'linear-gradient(140deg, #eef2ff 0%, #f5f3ff 52%, #ecfeff 100%)',
        'campus-gradient-dark': 'linear-gradient(145deg, #0b112a 0%, #151b3d 52%, #0a1a2d 100%)',
      },
    },
  },
  plugins: [],
}
