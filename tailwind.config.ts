import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        muted: "#64748b",
        panel: "#ffffff",
        line: "#d9e2ef",
        tech: {
          50: "#eef7ff",
          100: "#d9ecff",
          500: "#2f7df6",
          600: "#1f65d6",
          700: "#1e4ea8"
        },
        grape: {
          50: "#f6f2ff",
          500: "#7958d5",
          600: "#6545bd"
        },
        mint: {
          50: "#edfdf6",
          500: "#14a878",
          600: "#0d8a62"
        },
        ambersoft: {
          50: "#fff7e8",
          500: "#d97706"
        }
      },
      boxShadow: {
        soft: "0 14px 40px rgba(15, 23, 42, 0.08)",
        lift: "0 8px 24px rgba(47, 125, 246, 0.16)"
      },
      animation: {
        "soft-pulse": "softPulse 1.1s ease-out",
        "slide-up": "slideUp 0.24s ease-out",
        "drawer-in": "drawerIn 0.2s ease-out",
        shimmer: "shimmer 1.4s linear infinite"
      },
      keyframes: {
        softPulse: {
          "0%": { backgroundColor: "#eef7ff" },
          "100%": { backgroundColor: "transparent" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        drawerIn: {
          "0%": { transform: "translateX(16px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
