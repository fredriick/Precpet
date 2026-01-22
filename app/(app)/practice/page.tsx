import { Suspense } from "react"
import { PracticeContent } from "@/components/practice-content"

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  )
}
