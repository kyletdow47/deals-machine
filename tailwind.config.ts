import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark base ───────────────────────────────────────
        "background":                  "#111827",
        "surface":                     "#111827",
        "surface-container-lowest":    "#0F172A",
        "surface-container-low":       "#1F2937",
        "surface-container":           "#1F2937",
        "surface-container-high":      "#374151",
        "surface-container-highest":   "#374151",
        "surface-variant":             "#374151",
        "surface-dim":                 "#0F172A",
        "surface-bright":              "#1F2937",
        // ── Text ────────────────────────────────────────────
        "on-surface":                  "#F9FAFB",
        "on-surface-variant":          "#9CA3AF",
        "on-background":               "#F9FAFB",
        // ── Borders ─────────────────────────────────────────
        "outline":                     "#374151",
        "outline-variant":             "#1F2937",
        // ── Electric blue primary ────────────────────────────
        "primary":                     "#3B82F6",
        "primary-container":           "#1E3A5F",
        "on-primary":                  "#FFFFFF",
        "on-primary-container":        "#93C5FD",
        // ── Inverse ─────────────────────────────────────────
        "inverse-surface":             "#1E3A5F",
        "inverse-on-surface":          "#E0F2FE",
        "inverse-primary":             "#93C5FD",
        // ── Semantic ─────────────────────────────────────────
        "secondary":                   "#6B7280",
        "secondary-container":         "#374151",
        "on-secondary":                "#F9FAFB",
        "on-secondary-container":      "#9CA3AF",
        "tertiary":                    "#6B7280",
        "tertiary-container":          "#374151",
        "on-tertiary":                 "#F9FAFB",
        "on-tertiary-container":       "#9CA3AF",
        "error":                       "#EF4444",
        "error-container":             "#450A0A",
        "on-error":                    "#FEF2F2",
        "on-error-container":          "#FCA5A5",
        // ── Misc ─────────────────────────────────────────────
        "primary-fixed":               "#DBEAFE",
        "primary-fixed-dim":           "#93C5FD",
        "surface-tint":                "#3B82F6",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        mono:     ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg:   "0.5rem",
        xl:   "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
