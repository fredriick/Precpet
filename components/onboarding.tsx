"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PreceptLogo } from "@/components/precept-logo"
import { useApp } from "@/contexts/app-context"
import { cn } from "@/lib/utils"

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  {
    title: "Track Your Movement",
    description:
      "Precept uses your device's motion sensors to analyze your movement fluidity and technique in real-time.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    title: "Get Smart Recommendations",
    description:
      "Our AI analyzes your performance data and recommends specific skills to practice based on your weaknesses.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    title: "Watch AI Tutorials",
    description:
      "Generate personalized video tutorials using Veo AI to visualize exactly how each skill should be performed.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    title: "Master Your Game",
    description: "Track your progress over time, unlock achievements, and watch your skills transform on the pitch.",
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
]

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeOnboarding } = useApp()

  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <PreceptLogo className="w-8 h-8" />
          <span className="font-semibold">Precept</span>
        </div>
        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-8">
          {steps[currentStep].icon}
        </div>

        <h2 className="text-2xl font-bold mb-4 text-balance">{steps[currentStep].title}</h2>
        <p className="text-muted-foreground max-w-sm text-balance">{steps[currentStep].description}</p>
      </div>

      {/* Footer */}
      <div className="p-6 space-y-4">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentStep ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLastStep ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  )
}
