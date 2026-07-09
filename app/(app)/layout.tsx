import { AuthGuard } from "@/components/auth-guard"
import { Sidebar } from "@/components/sidebar"
import { PageTransition } from "@/components/page-transition"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 md:ml-64 relative">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </div>
    </AuthGuard>
  )
}
