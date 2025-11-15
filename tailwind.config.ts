import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F0F1F4",
          100: "#E1E3E9",
          200: "#C8CBD2",
          300: "#9BA1B4",
          400: "#676F8F",
          500: "#3D4665",
          600: "#232D4B",
          700: "#1A2239",
          800: "#12172A",
          900: "#0A0E1B",
        },
        uva: {
          blue: {
            DEFAULT: "#232D4B",
            light: "#C8CBD2",
          },
          orange: {
            DEFAULT: "#E57200",
            light: "#F9DCBF",
            50: "#FEF6ED",
            100: "#FEEDDB",
            200: "#F9DCBF",
            300: "#F4C28F",
            400: "#EF9A47",
            500: "#EA8623",
            600: "#E57200",
            700: "#B85900",
            800: "#8A4300",
            900: "#5C2D00",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [animate],
}

export default config