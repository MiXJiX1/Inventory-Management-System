"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productService } from "@/services/productService"
import { categoryService } from "@/services/categoryService"
import { useAuth } from "@/components/providers/AuthProvider"
import { toast } from "sonner"
import Papa from "papaparse"
import { useDebounce } from "@/hooks/use-debounce"

// Sub-components
import { ProductTable } from "@/components/products/ProductTable"
import { ProductFilters } from "@/components/products/ProductFilters"
import { ProductActions } from "@/components/products/ProductActions"
import { ProductDialog, ProductFormData } from "@/components/products/ProductDialog"

export default function ProductsPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("ALL")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [sorting, setSorting] = useState({ column: "createdAt", direction: "desc" })

    const debouncedSearch = useDebounce(search, 500)
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const isAdmin = user?.role === 'ADMIN'

    // Queries
    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await categoryService.getAll()
            return res.data
        }
    })

    const { data, isLoading } = useQuery({
        queryKey: ["products", page, debouncedSearch, statusFilter, categoryFilter, sorting],
        queryFn: () => productService.getProducts({
            page,
            limit: 10,
            search: debouncedSearch,
            status: statusFilter,
            category: categoryFilter !== "ALL" ? categoryFilter : undefined,
            sortBy: sorting.column,
            sortOrder: sorting.direction
        }),
    })

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) => productService.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            setIsCreateOpen(false)
            toast.success("Product created")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create product")
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) =>
            productService.updateProduct(id, { ...data, reason: 'ADJUST' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            setEditingProduct(null)
            toast.success("Product updated")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update product")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: productService.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success("Product deleted")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete product")
        }
    })

    const sellMutation = useMutation({
        mutationFn: ({ id, currentQuantity }: { id: string; currentQuantity: number }) => {
            if (currentQuantity <= 0) throw new Error("Out of stock")
            return productService.updateProduct(id, { quantity: currentQuantity - 1, reason: 'SALE' })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["dashboardStats"] })
            toast.success("Sold 1 unit!")
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to sell product")
        }
    })

    const importMutation = useMutation({
        mutationFn: productService.createProductsBatch,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast.success(data.data.message || "Products imported successfully")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to import products")
        }
    })

    // Handlers
    const handleExport = () => {
        if (!data?.data?.data) return;
        const csvData = data.data.data.map((p: any) => ({
            name: p.name,
            sku: p.sku,
            category: p.Category?.name || p.category,
            price: p.price,
            quantity: p.quantity,
            minStock: p.minStock
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const products = results.data.map((row: any) => ({
                    name: row.name,
                    sku: row.sku,
                    category: row.category,
                    price: Number(row.price),
                    quantity: Number(row.quantity),
                    minStock: Number(row.minStock || 10)
                })).filter((p: any) => p.name && p.sku);

                if (products.length > 0) {
                    importMutation.mutate(products);
                } else {
                    toast.error("No valid products found in CSV");
                }
            },
            error: (error) => toast.error("Error parsing CSV: " + error.message)
        });
    }

    const handleSort = (column: string) => {
        setSorting(prev => ({
            column,
            direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc"
        }));
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">
                    Products {statusFilter === 'low_stock' && <span className="text-red-500 text-sm ml-2">(Low Stock Only)</span>}
                </h1>
                <ProductActions
                    isAdmin={isAdmin}
                    onImport={handleImport}
                    onExport={handleExport}
                    onCreateClick={() => setIsCreateOpen(true)}
                />
            </div>

            <ProductFilters
                search={search}
                onSearchChange={setSearch}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                categories={categories}
            />

            <ProductTable
                products={data?.data?.data}
                isLoading={isLoading}
                isAdmin={isAdmin}
                onEdit={setEditingProduct}
                onDelete={(id) => deleteMutation.mutate(id)}
                onSell={(p) => sellMutation.mutate({ id: p.id, currentQuantity: p.quantity })}
                sorting={sorting}
                onSort={handleSort}
            />

            <ProductDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={(values) => createMutation.mutate(values)}
                title="Create Product"
                description="Add a new product to your inventory."
                categories={categories}
            />

            {editingProduct && (
                <ProductDialog
                    open={!!editingProduct}
                    onOpenChange={(open) => !open && setEditingProduct(null)}
                    onSubmit={(values) => updateMutation.mutate({ id: editingProduct.id, data: values })}
                    defaultValues={{
                        ...editingProduct,
                        categoryId: editingProduct.categoryId || "",
                        price: editingProduct.price,
                        costPrice: editingProduct.costPrice || 0,
                        quantity: editingProduct.quantity,
                        minStock: editingProduct.minStock
                    }}
                    title="Edit Product"
                    description="Update product details."
                    categories={categories}
                />
            )}
        </div>
    )
}
