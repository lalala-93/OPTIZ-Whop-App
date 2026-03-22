import type { Config } from "tailwindcss";
import { frostedThemePlugin } from "@whop/react/tailwind";
import tailwindAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@whop/react/dist/**/*.{js,mjs}",
  ],
  plugins: [frostedThemePlugin(), tailwindAnimate],
};

export default config;
