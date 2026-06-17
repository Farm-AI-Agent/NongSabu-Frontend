/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        // 작물닥터 농사부 brand palette
        brand: {
          DEFAULT: '#0e6e5d', // deep teal-green — top strip, logo, primary
          light: '#eef6f3',   // tinted surface (avatar bg, icon bg)
          border: '#cfe6df',  // tinted border
        },
        accent: '#2b6cb0',    // blue — upload/diagnose actions
        page: '#f6f7f8',      // page background
        success: '#1a7d4b',   // green status text
        warn: '#b45309',      // amber status text
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
      maxWidth: {
        shell: '1280px',
      },
    },
  },
  plugins: [],
}
