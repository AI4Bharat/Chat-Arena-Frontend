/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          'pulse-light': 'pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'slide-up': 'slide-up 0.3s ease-out',
        },
        keyframes: {
          'pulse-light': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
          'slide-up': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        },
      },
    },
    plugins: [],
  }