"use client"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="bg-[#0a0a0f] text-[#fafafa] min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
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
