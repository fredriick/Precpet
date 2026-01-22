"use client"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="bg-[#0a0a0f] text-[#fafafa] min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">⚡</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-[#a1a1aa] text-sm">{error.message}</p>
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
