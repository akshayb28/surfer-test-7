import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#eefcf5",100:"#d5f7e5",200:"#abefc9",300:"#6fdca3",400:"#35c47c",500:"#10a862",600:"#05874e",700:"#046c40",800:"#075636",900:"#06472e",950:"#03281a" },
      },
    },
  },
  plugins: [],
} satisfies Config;
