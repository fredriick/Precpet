import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { AuthGuard } from "@/components/auth-guard"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}))

describe("AuthGuard", () => {
  it("does not render children when unauthenticated", () => {
    render(
      <AuthGuard>
        <div>secret content</div>
      </AuthGuard>,
    )
    expect(screen.queryByText("secret content")).not.toBeInTheDocument()
  })
})
