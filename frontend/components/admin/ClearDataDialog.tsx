"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import api from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

interface ClearDataDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ClearDataDialog({ open, onOpenChange }: ClearDataDialogProps) {
    const [confirmText, setConfirmText] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()

    const handleClearData = async () => {
        if (confirmText !== "Delete All Data") {
            toast.error("Confirmation text does not match")
            return
        }
        if (!password) {
            toast.error("Password is required")
            return
        }

        setLoading(true)
        try {
            await api.post("/admin/clear-data", { password })
            toast.success("All data cleared successfully")
            onOpenChange(false)
            setConfirmText("")
            setPassword("")
            queryClient.invalidateQueries()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to clear data")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-destructive">Clear All Data</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently delete all products, categories, transactions, and audit logs.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-text" className="text-destructive font-semibold">
                            Type "Delete All Data" to confirm
                        </Label>
                        <Input
                            id="confirm-text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Delete All Data"
                            className="border-destructive/50 focus-visible:ring-destructive"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Admin Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleClearData}
                        disabled={confirmText !== "Delete All Data" || !password || loading}
                    >
                        {loading ? "Deleting..." : "Delete All Data"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
