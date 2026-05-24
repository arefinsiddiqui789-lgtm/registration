"use client"

import { useState } from "react"
import { LandingPage } from "@/components/landing"
import { RegistrationForm } from "@/components/registration-form"
import { SuccessPage } from "@/components/success-page"
import { useRegistrationStore } from "@/lib/store"

type View = "landing" | "form" | "success"

export default function Home() {
  const [view, setView] = useState<View>("landing")
  const { isSubmitted } = useRegistrationStore()

  // If submitted, show success page
  const currentView = isSubmitted ? "success" : view

  if (currentView === "success") {
    return <SuccessPage />
  }

  if (currentView === "form") {
    return <RegistrationForm onBack={() => setView("landing")} />
  }

  return <LandingPage onStartRegistration={() => setView("form")} />
}
