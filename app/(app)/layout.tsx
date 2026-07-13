import { AuthGuard } from "@/components/auth-guard"
import { Sidebar, SidebarProvider } from "@/components/sidebar"
import { PageTransition } from "@/components/page-transition"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 md:ml-[var(--sidebar-w,16rem)] relative transition-all duration-200">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
