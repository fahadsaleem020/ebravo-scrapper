/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        inter: [`Inter`, `sans-serif`],
      },

      colors: {
        "blue-gray": {
          25: "#FCFCFD",
          50: "#EAECF5",
          100: "#EAECF5",
          200: "#D5D9EB",
          300: "#AFB5D9",
          400: "#717BBC",
          500: "#4E5BA6",
          600: "#3E4784",
          700: "#363F72",
          800: "#293056",
          900: "#101323",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["[data-theme=light]"],
          primary: "#3E4784",
          ".glass-bg": {
            background: "rgba(36, 40, 66, 0.7)",
            "box-shadow": "1px 1px 3px 0px rgba(255, 255, 255, 0.50) inset",
            "backdrop-filter": "blur(10px)",
          },
        },
      },
      "dark",
      "winter",
      "cupcake",
      "halloween",
    ],
  },
};
