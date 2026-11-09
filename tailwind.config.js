/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkest: '#050B14',
          dark: '#0A1325',
          navy: '#0F1D38',
          card: '#132347',
          cardHover: '#182C58',
          border: '#1E3566',
          borderLight: '#2D4B8B',
          blue: '#1D63FF',
          blueHover: '#1550D6',
          cyan: '#38BDF8',
          cyanGlow: '#0EA5E9',
          light: '#F0F6FF',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        arabic: ['Cairo', 'Tajawal', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(29, 99, 255, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(56, 189, 248, 0.3)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}

