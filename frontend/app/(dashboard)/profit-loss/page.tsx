"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Filter, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categoryService } from "@/services/categoryService"
import { Input } from "@/components/ui/input"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const getDateRange = (range: string, customStart?: string, customEnd?: string) => {
    const now = new Date()
    let start = now
    let end = now

    switch (range) {
        case "TODAY":
            start = startOfDay(now)
            end = endOfDay(now)
            break
        case "WEEK":
            start = startOfWeek(now, { weekStartsOn: 1 })
            end = endOfDay(now)
            break
        case "MONTH":
            start = startOfMonth(now)
            end = endOfDay(now)
            break
        case "CUSTOM":
            if (customStart) start = startOfDay(new Date(customStart))
            if (customEnd) end = endOfDay(new Date(customEnd))
            break
    }

    return {
        startDate: start.toISOString(),
        endDate: end.toISOString()
    }
}

async function fetchStats({ queryKey }: any) {
    const [_key, { startDate, endDate, categoryId }] = queryKey
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (categoryId && categoryId !== "ALL") params.append("categoryId", categoryId)

    const { data } = await api.get(`/dashboard/profit-loss?${params.toString()}`)
    return data
}

export default function ProfitLossPage() {
    const [dateFilter, setDateFilter] = useState("MONTH")
    const [customStart, setCustomStart] = useState("")
    const [customEnd, setCustomEnd] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("ALL")


    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await categoryService.getAll()
            return res.data
        }
    })


    const { startDate, endDate } = useMemo(() =>
        getDateRange(dateFilter, customStart, customEnd),
        [dateFilter, customStart, customEnd]
    )

    const { data: statsData, isLoading, error, refetch } = useQuery({
        queryKey: ["profit-loss", { startDate, endDate, categoryId: categoryFilter }],
        queryFn: fetchStats,
    })

    const stats = statsData?.stats || {}
    const charts = statsData?.charts || { timeline: [], byCategory: [], byExpense: [] }
    const expenses = statsData?.breakdown?.expenses || []
    const kpi = statsData?.kpi || { grossProfitMargin: 0, netProfitMargin: 0, topSelling: [], mostProfitable: [] }

    if (isLoading) return <div>Loading report...</div>
    if (error) return <div>Error loading report data.</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Profit / Loss Report</h1>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="space-y-2">
                        <span className="text-sm font-medium">Date Range</span>
                        <div className="flex gap-2">
                            <Button
                                variant={dateFilter === "TODAY" ? "default" : "outline"}
                                onClick={() => setDateFilter("TODAY")}
                                size="sm"
                            >
                                Today
                            </Button>
                            <Button
                                variant={dateFilter === "WEEK" ? "default" : "outline"}
                                onClick={() => setDateFilter("WEEK")}
                                size="sm"
                            >
                                This Week
                            </Button>
                            <Button
                                variant={dateFilter === "MONTH" ? "default" : "outline"}
                                onClick={() => setDateFilter("MONTH")}
                                size="sm"
                            >
                                This Month
                            </Button>
                            <Button
                                variant={dateFilter === "CUSTOM" ? "default" : "outline"}
                                onClick={() => setDateFilter("CUSTOM")}
                                size="sm"
                            >
                                Custom
                            </Button>
                        </div>
                    </div>

                    {dateFilter === "CUSTOM" && (
                        <div className="flex gap-2 items-center">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Start</span>
                                <Input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-[140px]"
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">End</span>
                                <Input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-[140px]"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 min-w-[200px]">
                        <span className="text-sm font-medium">Category</span>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                {categories?.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            {/* KPI Section - Summary & Margins */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <span className="text-2xl font-bold">฿</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">฿{stats?.totalRevenue?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.transactionCount || 0} Transactions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <span className="text-2xl font-bold">฿</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">฿{(stats?.totalCost + stats?.totalExpenses)?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            COGS + Expenses
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <BarChart3 className={`h-4 w-4 ${stats?.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ฿{stats?.netProfit?.toLocaleString() || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Revenue - Total Cost
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpi?.grossProfitMargin?.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            (Gross Profit / Revenue)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${kpi?.netProfitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {kpi?.netProfitMargin?.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            (Net Profit / Revenue)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Best Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {kpi?.topSelling?.length > 0 ? kpi.topSelling.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b last:border-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-muted-foreground w-4">{i + 1}.</span>
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-semibold">{item.value.toLocaleString()} units</span>
                                </div>
                            )) : <div className="text-muted-foreground text-sm">No data available</div>}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Most Profitable Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {kpi?.mostProfitable?.length > 0 ? kpi.mostProfitable.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b last:border-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-muted-foreground w-4">{i + 1}.</span>
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-semibold text-green-600">฿{item.value.toLocaleString()}</span>
                                </div>
                            )) : <div className="text-muted-foreground text-sm">No data available</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Line Chart: Revenue vs Cost vs Profit */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Financial Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={charts.timeline}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return format(d, 'MMM dd');
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `฿${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [`฿${value.toLocaleString()}`, ""]}
                                        labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2} />
                                    <Line type="monotone" dataKey="cost" name="Cost" stroke="#ef4444" strokeWidth={2} />
                                    <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart: Revenue by Category */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.byCategory}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {charts.byCategory.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `฿${value.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Bar Chart: Profit Analysis */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Daily Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.timeline}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return format(d, 'MMM dd');
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `฿${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: any) => [`฿${value.toLocaleString()}`, "Net Profit"]}
                                        labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                                    />
                                    <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                        {charts.timeline.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#22c55e' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart: Expenses by Type */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Expenses Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {charts.byExpense.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.byExpense}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {charts.byExpense.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => `฿${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-muted-foreground text-sm">No expenses recorded</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>


            <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Breakdown */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Revenue Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Total Sales (Revenue)</span>
                                <span className="font-semibold">฿{stats?.totalRevenue?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Total Transactions</span>
                                <span className="font-semibold">{stats?.transactionCount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Items Sold</span>
                                <span className="font-semibold">{stats?.totalItemsSold?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Avg. Sale per Transaction</span>
                                <span className="font-semibold">฿{stats?.averageSalePerBill?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Cost of Goods Sold (COGS)</span>
                                <span className="font-semibold">฿{stats?.totalCost?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Operating Expenses</span>
                                <span className="font-semibold">฿{stats?.totalExpenses?.toLocaleString()}</span>
                            </div>

                            {/* Detailed Expenses List */}
                            {expenses.length > 0 && (
                                <div className="pl-4 border-l-2 border-muted mt-2 space-y-2">
                                    {expenses.map((exp: any) => (
                                        <div key={exp.id} className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{exp.description}</span>
                                            <span>฿{exp.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2 font-bold">
                                <span>Total Cost</span>
                                <span>฿{(stats?.totalCost + stats?.totalExpenses)?.toLocaleString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Profit Breakdown */}
                <Card className="h-full md:col-span-2">
                    <CardHeader>
                        <CardTitle>Profit Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-lg">Total Revenue</span>
                                <span className="text-lg font-semibold">฿{stats?.totalRevenue?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2 text-red-500">
                                <span>- Cost of Goods Sold (COGS)</span>
                                <span>(฿{stats?.totalCost?.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between items-center border-b-2 border-primary/20 pb-2 bg-muted/20 p-2 rounded">
                                <span className="font-bold">Gross Profit</span>
                                <span className="font-bold text-lg">฿{stats?.grossProfit?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2 text-red-500">
                                <span>- Operating Expenses</span>
                                <span>(฿{stats?.totalExpenses?.toLocaleString()})</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 p-2 rounded bg-primary/10">
                                <span className="font-bold text-xl">Net Profit</span>
                                <span className={`font-bold text-xl ${stats?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ฿{stats?.netProfit?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e'];
