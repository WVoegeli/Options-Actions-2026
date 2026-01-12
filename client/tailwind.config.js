/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom trading colors
        profit: '#10B981',  // Green for gains
        loss: '#EF4444',    // Red for losses
        neutral: '#6B7280', // Gray for neutral
        primary: '#3B82F6', // Blue primary
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
        }
      },
    },
  },
  plugins: [],
}
