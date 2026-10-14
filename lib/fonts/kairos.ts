import { Onest, Unbounded } from "next/font/google"

// Polices de l'identité Kairos, chargées uniquement par l'espace admin.
export const kairosDisplay = Unbounded({
  subsets: ["latin", "latin-ext"],
  variable: "--font-kairos-display",
  display: "swap",
})

export const kairosText = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-kairos-text",
  display: "swap",
})

export const kairosFontClasses = `${kairosDisplay.variable} ${kairosText.variable}`
