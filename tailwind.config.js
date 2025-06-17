/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html', 
    './src/**/*.{js,ts,jsx,tsx}',
    './microapps/**/*.{js,ts,jsx,tsx}',
    './microapps/**/*.{vue,svelte}'
  ],
  theme: {
    extend: {
      colors: {
        'oxford-navy': '#001F3F',
        'manuscript-gold': '#FFD700',
        'burgundy-leather': '#800020',
      },
      fontFamily: {
        'playfair': ['Playfair Display', 'Georgia', 'Times New Roman', 'Times', 'serif'],
        'lora': ['Lora', 'Georgia', 'Times New Roman', 'Times', 'serif'],
        'inter': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};