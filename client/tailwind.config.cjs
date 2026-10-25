/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            950: '#071224',
            900: '#0A1B38',
            800: '#0F294D',
            700: '#153E75',
            600: '#1D539B',
            500: '#2569C2',
            100: '#E6F0FA',
            50: '#F0F6FD',
          },
          saffron: {
            800: '#92400E',
            700: '#B45309',
            600: '#D97706',
            500: '#F59E0B',
            100: '#FEF3C7',
            50: '#FFFBEB',
          },
          green: {
            800: '#065F46',
            700: '#047857',
            600: '#059669',
            500: '#10B981',
            100: '#D1FAE5',
            50: '#ECFDF5',
          },
          slate: {
            850: '#151E2E',
            900: '#0F172A',
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
