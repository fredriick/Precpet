"use client"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">⚡</div>
        <h1 className="text-2xl font-bold">Page error</h1>
        <p className="text-[#a1a1aa] text-sm">{error.message}</p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-medium transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
