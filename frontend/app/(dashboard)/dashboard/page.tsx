"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, CheckCircle } from "lucide-react"
import { Overview } from "@/components/overview"

async function fetchStats() {
    const { data } = await api.get("/dashboard/summary")
    return data
}

export default function DashboardPage() {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: fetchStats,
        retry: false,
    })

    if (isLoading) return <div>Loading dashboard...</div>
    if (error) return <div>Error loading dashboard data.</div>

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalProducts}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalStock}</div>
                </CardContent>
            </Card>


            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats?.lowStockCount}</div>
                </CardContent>
            </Card>

            <div className="col-span-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview data={stats?.salesData || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
