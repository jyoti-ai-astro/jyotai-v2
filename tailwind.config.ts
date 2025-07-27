import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'cosmic-navy': '#0d1117',
        'celestial-gold': '#FFD700',
        'supernova-magenta': '#C77DFF',
        'starlight-white': '#FFFFFF',
      },
    },
  },
  plugins: [],
};
export default config;