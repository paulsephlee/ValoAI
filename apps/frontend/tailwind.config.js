/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        valo: {
          red: '#FF4655',
          black: '#0F1923',
          dark: '#1F2731',
          border: '#2E3D4F',
          muted: '#7B8FA1',
          white: '#ECE8E1',
        },
      },
      fontFamily: {
        heading: ['Anton', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
