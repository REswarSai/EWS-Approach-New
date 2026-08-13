/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        background: '#181A20',
        surface: '#23262F',
        primary: '#00B8D9',
        secondary: '#36B37E',
        accent: '#FFAB00',
        text: '#F4F5F7',
        textSecondary: '#A5ADBA',
        border: '#2C2F36',
        danger: '#FF5630',
        success: '#36B37E',
      },
      boxShadow: {
        neon: '0 0 8px 0 #00B8D9',
        card: '0 2px 16px 0 rgba(0,0,0,0.12)',
      },
      borderRadius: {
        none: '0',
        md: '0.375rem',
        lg: '0.5rem',
      },
    },
  },
  plugins: [],
} 