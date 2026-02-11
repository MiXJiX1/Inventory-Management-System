"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { auditService } from "@/services/auditService"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/components/providers/AuthProvider"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AuditLogsPage() {
    const [page, setPage] = useState(1)
    const { user } = useAuth()
    const [search, setSearch] = useState("")

    const { data, isLoading } = useQuery({
        queryKey: ["audit-logs", page, search],
        queryFn: () => auditService.getLogs({ page, limit: 20, search }),
        enabled: user?.role === "ADMIN"
    })

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        setPage(1)
    }

    const [selectedLog, setSelectedLog] = useState<any>(null)

    if (user?.role !== "ADMIN") {
        return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>
    }

    const formatDetails = (detailsStr: string | null, truncate: boolean = false) => {
        if (!detailsStr) return "-";
        try {
            const details = JSON.parse(detailsStr);

            if (details.productName && details.updates) {
                const keys = Object.keys(details.updates);
                const fields = keys.join(", ");

                if (truncate) {
                    return (
                        <div className="flex flex-col gap-1">
                            {keys.length > 0 ? (
                                <span className="truncate block max-w-[200px]" title={`(${details.productName}) update: ${fields}`}>
                                    <span className="font-semibold">({details.productName})</span> update: {fields}
                                </span>
                            ) : (
                                <span className="text-muted-foreground">({details.productName}) No changes detected</span>
                            )}
                            {details.note && (
                                <span className="text-xs text-muted-foreground italic truncate block max-w-[200px]">Note: {details.note}</span>
                            )}
                        </div>
                    )
                }

                return (
                    <div className="flex flex-col gap-2">
                        <div className="text-sm">
                            <span className="font-semibold text-base block mb-1">Product: {details.productName}</span>
                            {keys.length > 0 ? (
                                <>
                                    <div className="text-muted-foreground mb-1">Changes:</div>
                                    <ul className="space-y-1 ml-1">
                                        {Object.entries(details.updates).map(([key, val]: [string, any]) => {
                                            if (val && typeof val === 'object' && 'old' in val && 'new' in val) {
                                                return (
                                                    <li key={key} className="flex gap-2 items-center bg-muted/50 p-1 rounded px-2">
                                                        <span className="font-semibold capitalize w-24">{key}</span>
                                                        <span className="text-red-500 line-through text-xs mr-1">{String(val.old)}</span>
                                                        <span>&rarr;</span>
                                                        <span className="text-green-600 font-bold ml-1">{String(val.new)}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase border border-border px-1 rounded ml-auto">Edit</span>
                                                    </li>
                                                )
                                            }
                                            return (
                                                <li key={key}>
                                                    <span className="font-medium">{key}:</span> {String(val)}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </>
                            ) : (
                                <div className="text-muted-foreground italic">No actual fields were changed.</div>
                            )}
                        </div>
                        {details.note && (
                            <div className="mt-2 p-2 bg-muted rounded-md border text-yellow-800 bg-yellow-50/50">
                                <span className="font-semibold text-xs uppercase text-yellow-600 block mb-1">Note</span>
                                <p className="italic text-sm">{details.note}</p>
                            </div>
                        )}
                    </div>
                );
            }

            if (truncate) {
                if (details.updates) return <span className="truncate block max-w-[200px]">{JSON.stringify(details.updates)}</span>;
                return <span className="truncate block max-w-[200px]">{JSON.stringify(details)}</span>;
            }

            if (details.updates) {
                return (
                    <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                        {JSON.stringify(details.updates, null, 2)}
                    </pre>
                );
            }

            return (
                <pre className="bg-muted p-2 rounded-md overflow-auto text-xs">
                    {JSON.stringify(details, null, 2)}
                </pre>
            );
        } catch (e) {
            return detailsStr;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="px-3 py-2 border rounded-md text-sm w-64"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
            </div>

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
                                <TableRow
                                    key={log.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {log.user?.name || "Unknown"}
                                                {log.user?.role && <span className="text-muted-foreground ml-1">({log.user.role.toLowerCase()})</span>}
                                            </span>
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
                                        <div className="text-sm">
                                            {formatDetails(log.details, true)}
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

            {/* Details Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            {selectedLog && format(new Date(selectedLog.createdAt), "MMMM d, yyyy 'at' HH:mm:ss")}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="font-semibold">User:</span> {selectedLog.user?.name}
                                </div>
                                <div>
                                    <span className="font-semibold">Action:</span> <Badge>{selectedLog.action}</Badge>
                                </div>
                                <div>
                                    <span className="font-semibold">Entity:</span> {selectedLog.entity}
                                </div>
                                <div>
                                    <span className="font-semibold">ID:</span> <span className="font-mono text-xs">{selectedLog.entityId}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold mb-2">Change Details</h4>
                                {formatDetails(selectedLog.details, false)}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
