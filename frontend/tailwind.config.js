/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Alegreya', 'serif'],
        fantasy: ['Philosopher', 'serif'],
      },
      colors: {
        tavern: {
          dark: '#1e1b18', // Темный фон
          wood: '#3e2723', // Дерево (для шапки)
          gold: '#d4af37', // Золото для акцентов
        },
        parchment: {
          light: '#fdf5e6', // Светлый пергамент (карточки)
          dark: '#eaddc5',  // Темный пергамент (поля, рамки)
          text: '#3b2f2f',  // Текст на пергаменте
        }
      }
    },
  },
  plugins: [],
}
