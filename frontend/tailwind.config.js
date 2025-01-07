import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        blob: 'blob 7s infinite',
        'subtle-bounce': 'subtle-bounce 3s infinite',
        'gentle-pulse': 'gentle-pulse 4s infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        'subtle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gentle-pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'vibrant-primary': '0 10px 25px -5px rgba(var(--color-primary) / 0.3)',
        'elegant-lg': '0 15px 40px -10px rgba(0,0,0,0.1)',
      },
      transitionProperty: {
        'elegant': 'transform, box-shadow, opacity',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
      {
        mytheme: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#22d3ee',
          neutral: '#374151',
          'base-100': '#f3f4f6',
          'base-content': '#111827',
        },
      },
    ],
  },
};
