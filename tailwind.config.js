/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/flowbite/**/*.js",
    "./node_modules/flowbite-react/**/*.js",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // screens: {
    //   xs: "375px",
    //   ss: "620px",
    //   sm: "768px",
    //   md: "1060px",
    //   lg: "1285px",
    //   xl: "1530px",
    //   // => @media (min-width: 1280px) { ... }
    //   "2xl": "1736px",
    //   // => @media (min-width: 1536px) { ... }
    // },
    extend: {
      backgroundColor: {
        customColor: "#color",
      },
      colors: {
        darkBlue: "#111827",
        darkGray: "#1f2937",
        darkestGray: "#1118274D",
        darkPurple: "#1D1A22",
        grayWhite: "#CAC4CF",
        lightGray: "#2C365E",
        lightBlue: "#2C365E",
        darkBlack: "#000000",
        mainBlue: "#0D0D29",
        navBlue: "#090921",
        lighterMainBlue: "#151530",
        shadowColor: "#06B6D4",
        purpleHaze: "#4937BA",
        ngrokBlue: "#3e6ff4",
        ngrokGray: "#23253a",
        ngrokDark: "#151530",
      },
      fontFamily: {
        sfPro: ["SF Pro"],
        helv: ["helvetica"],
        sans: ["Sans"],
        euclid: ["Euclid", "ui-sans-serif", "system-ui"],
      },
      height: {
        "90vh": "90vh",
      },
    },
  },
  plugins: [],
};
