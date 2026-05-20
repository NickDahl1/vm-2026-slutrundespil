import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#f2fbf5",
          100: "#dff5e6",
          500: "#2fa665",
          700: "#1d7548",
          950: "#082416"
        },
        cup: {
          100: "#fff1ca",
          300: "#ffd66b",
          500: "#f4a900"
        }
      },
      boxShadow: {
        card: "0 18px 40px -28px rgb(15 23 42 / 0.55)"
      }
    }
  },
  plugins: [forms]
};

export default config;
