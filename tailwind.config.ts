import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cris: {
          navy: "#071046",
          blue: "#129ee8",
          pink: "#f20772",
          yellow: "#ffc400",
          purple: "#6d2bbf",
          paper: "#fffaf2"
        }
      },
      boxShadow: {
        pop: "0 18px 45px rgba(7, 16, 70, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
