"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { categoryService, Category } from "@/services/categoryService"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function CategoriesPage() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [formData, setFormData] = useState({ name: "" })

    const isAdmin = user?.role === 'ADMIN'

    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await categoryService.getAll()
            return res.data
        }
    })

    const createMutation = useMutation({
        mutationFn: categoryService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast.success("Category created")
            setIsCreateOpen(false)
            setFormData({ name: "" })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create category")
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name: string } }) => categoryService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast.success("Category updated")
            setEditingCategory(null)
            setFormData({ name: "" })
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update category")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: categoryService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast.success("Category deleted")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete category")
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, data: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    const openEdit = (category: Category) => {
        setEditingCategory(category)
        setFormData({ name: category.name })
    }

    if (!isAdmin) {
        return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                <Dialog open={isCreateOpen || !!editingCategory} onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false)
                        setEditingCategory(null)
                        setFormData({ name: "" })
                    } else {
                        setIsCreateOpen(true)
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                            <DialogDescription>
                                {editingCategory ? "Update the category name." : "Create a new product category."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Electronics"
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                    {createMutation.isPending || updateMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : null}
                                    {editingCategory ? "Update" : "Create"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Products Count</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">Loading...</TableCell>
                            </TableRow>
                        ) : categories?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">No categories found.</TableCell>
                            </TableRow>
                        ) : (
                            categories?.map((category: Category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>{category._count?.products || 0}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the category "{category.name}".
                                                            {category._count?.products ? (
                                                                <span className="block mt-2 font-bold text-red-500">
                                                                    Warning: This category has {category._count.products} associated products. You cannot delete it until you reassign or delete those products.
                                                                </span>
                                                            ) : null}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => deleteMutation.mutate(category.id)}
                                                            disabled={!!category._count?.products}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
