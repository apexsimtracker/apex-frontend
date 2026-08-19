import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        gold: "#FFB800",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
        apex: {
          primary: "hsl(var(--apex-primary) / <alpha-value>)",
          "primary-fixed": "hsl(var(--apex-primary-fixed) / <alpha-value>)",
          "on-primary": "hsl(var(--apex-on-primary) / <alpha-value>)",
          "on-surface": "hsl(var(--apex-on-surface) / <alpha-value>)",
          "on-surface-variant":
            "hsl(var(--apex-on-surface-variant) / <alpha-value>)",
          background: "hsl(var(--apex-background) / <alpha-value>)",
          surface: "hsl(var(--apex-surface) / <alpha-value>)",
          "surface-container-low":
            "hsl(var(--apex-surface-container-low) / <alpha-value>)",
          "surface-container":
            "hsl(var(--apex-surface-container) / <alpha-value>)",
          "surface-container-high":
            "hsl(var(--apex-surface-container-high) / <alpha-value>)",
          "surface-container-highest":
            "hsl(var(--apex-surface-container-highest) / <alpha-value>)",
          "outline-variant": "hsl(var(--apex-outline-variant) / <alpha-value>)",
          error: "hsl(var(--apex-error) / <alpha-value>)",
          success: "hsl(var(--apex-success) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        apex: "var(--apex-radius)",
        "apex-sm": "0.125rem",
        "apex-lg": "0.25rem",
      },
      fontFamily: {
        "apex-headline": ["Space Grotesk", "sans-serif"],
        "apex-body": ["Inter", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Literal transforms instead of tailwindcss-animate's var-driven `enter`/`exit` keyframes:
        // WebKit does not resolve those custom properties reliably, so the panel jumped on iOS
        // instead of sliding.
        "drawer-in": {
          from: { transform: "translate3d(-100%, 0, 0)" },
          to: { transform: "translate3d(0, 0, 0)" },
        },
        "drawer-out": {
          from: { transform: "translate3d(0, 0, 0)" },
          to: { transform: "translate3d(-100%, 0, 0)" },
        },
        "scrim-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scrim-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // iOS sheet curve; opening is slower than closing so dismissal feels responsive.
        "drawer-in": "drawer-in 280ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "drawer-out": "drawer-out 200ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "scrim-in": "scrim-in 280ms cubic-bezier(0.32, 0.72, 0, 1) both",
        "scrim-out": "scrim-out 200ms cubic-bezier(0.32, 0.72, 0, 1) both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
