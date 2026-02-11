"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Package, LogOut, ClipboardList, Tags, Trash2, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { authService } from "@/services/authService"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/AuthProvider"
import { useState } from "react"
import { ClearDataDialog } from "@/components/admin/ClearDataDialog"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Products",
        href: "/products",
        icon: Package,
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user } = useAuth()
    const [isClearDataOpen, setIsClearDataOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await authService.logout()
            toast.success("Logged out")
            router.push("/login")
        } catch (error) {
            toast.error("Logout failed")
        }
    }

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card">
            <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Package className="h-6 w-6" />
                    <span>Inventory App</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-2 text-sm font-medium">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === item.href
                                    ? "bg-muted text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                    {user?.role === "ADMIN" && (
                        <>
                            <Link
                                href="/categories"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === "/categories"
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <Tags className="h-4 w-4" />
                                Categories
                            </Link>
                            <Link
                                href="/audit-logs"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === "/audit-logs"
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <ClipboardList className="h-4 w-4" />
                                Audit Logs
                            </Link>
                            <Link
                                href="/profit-loss"
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    pathname === "/profit-loss"
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Profit / Loss Report
                            </Link>

                            <button
                                onClick={() => setIsClearDataOpen(true)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all text-destructive hover:bg-destructive/10",
                                    "cursor-pointer"
                                )}
                            >
                                <Trash2 className="h-4 w-4" />
                                Clear Data
                            </button>
                        </>
                    )}
                </nav>
            </div>
            <div className="border-t p-4">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>

            <ClearDataDialog open={isClearDataOpen} onOpenChange={setIsClearDataOpen} />
        </div>
    )
}
