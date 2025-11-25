import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    // SCANS ALL COMPONENTS/PAGES IN THE CMS APP
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-brand': '#475569', // Slate-600 - dark grey
      },
    },
  },
  plugins: [],
};

export default config;

