import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f7f7f9',
        panel: '#ffffff',
        border: '#e5e7eb',
        primary: '#2563eb',
        muted: '#6b7280'
      }
    }
  },
  plugins: []
};

export default config;
