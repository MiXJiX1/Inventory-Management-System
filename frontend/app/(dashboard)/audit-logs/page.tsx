"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { auditService } from "@/services/auditService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/components/providers/AuthProvider"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export default function AuditLogsPage() {
    const [page, setPage] = useState(1)
    const { user } = useAuth()

    const { data, isLoading } = useQuery({
        queryKey: ["audit-logs", page],
        queryFn: () => auditService.getLogs({ page, limit: 20 }),
        enabled: user?.role === "ADMIN" // Only fetch if admin
    })

    if (user?.role !== "ADMIN") {
        return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>
    }

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : data?.data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No logs found.</TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.data?.map((log: any) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.user?.name || "Unknown"}</span>
                                            <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            log.action === "LOGIN" ? "secondary" :
                                                log.action === "DELETE" ? "destructive" :
                                                    log.action === "CREATE" || log.action === "REGISTER" ? "default" :
                                                        "outline"
                                        }>
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{log.entity} {log.entityId && <span className="text-xs text-muted-foreground">({log.entityId.substring(0, 8)}...)</span>}</TableCell>
                                    <TableCell>
                                        <div className="max-w-xs truncate text-xs font-mono text-muted-foreground" title={log.details}>
                                            {log.details}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Simple Pagination */}
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>Page {data?.data?.meta?.page} of {data?.data?.meta?.totalPages}</div>
                <div className="space-x-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        className="underline disabled:opacity-50"
                    >Previous</button>
                    <button
                        disabled={page >= (data?.data?.meta?.totalPages || 1)}
                        onClick={() => setPage(p => p + 1)}
                        className="underline disabled:opacity-50"
                    >Next</button>
                </div>
            </div>
        </div>
    )
}
