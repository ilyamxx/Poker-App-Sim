import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'poker-green': '#0a7c5a',
        'poker-red': '#c62828',
        'poker-gold': '#d4af37',
        'poker-blue': '#1e3a8a',
      },
    },
  },
  plugins: [],
}
export default config