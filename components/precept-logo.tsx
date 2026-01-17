export function PreceptLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer glow ring */}
      <circle cx="20" cy="20" r="18" stroke="url(#precept-gradient)" strokeWidth="2" opacity="0.3" />

      {/* Main circle */}
      <circle cx="20" cy="20" r="14" fill="url(#precept-gradient)" />

      {/* Inner highlight */}
      <circle cx="16" cy="16" r="4" fill="white" opacity="0.3" />

      {/* Motion lines */}
      <path d="M28 12C30 15 30 25 28 28" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M32 10C35 14 35 26 32 30" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

      <defs>
        <linearGradient id="precept-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}
