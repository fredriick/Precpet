import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-8xl font-bold text-[#10b981]">404</div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-[#a1a1aa] text-sm max-w-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl font-medium transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
