"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productService } from "@/services/productService"
import { categoryService } from "@/services/categoryService"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, ShoppingCart, Filter } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Papa from "papaparse"
import { useRef } from "react"
import { Download, Upload, ArrowUpDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
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




type ProductFormData = z.infer<typeof productSchema>

const productSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    categoryId: z.string().min(1, "Category is required"),
    price: z.coerce.number().min(0, "Price must be positive"),
    costPrice: z.coerce.number().min(0, "Cost Price must be positive").default(0),
    quantity: z.coerce.number().int().min(0, "Quantity must be positive"),
    minStock: z.coerce.number().int().min(0).default(10),
    note: z.string().optional(),
})

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isAdmin = user?.role === 'ADMIN'

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

    const createMutation = useMutation({
        mutationFn: (data: ProductFormData) => {
            return productService.createProduct(data)
        },
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
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => productService.updateProduct(id, { ...data, reason: 'ADJUST' }),
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

    const handleExport = () => {
        if (!data?.data?.data) return;
        const csv = Papa.unparse(data.data.data.map((p: any) => ({
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: p.price,
            quantity: p.quantity,
            minStock: p.minStock
        })));
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "products_export.csv");
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
                if (fileInputRef.current) fileInputRef.current.value = "";
            },
            error: (error) => {
                toast.error("Error parsing CSV: " + error.message)
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Products {statusFilter === 'low_stock' && <span className="text-red-500 text-sm ml-2">(Low Stock Only)</span>}</h1>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleImport} />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> Import CSV
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {categories?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant={statusFilter === 'low_stock' ? "destructive" : "outline"}
                    onClick={() => setStatusFilter(prev => prev === 'low_stock' ? "" : "low_stock")}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    Low Stock
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>

                            <TableHead>SKU</TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => setSorting({ column: "name", direction: sorting.column === "name" && sorting.direction === "asc" ? "desc" : "asc" })}>
                                    Name <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => setSorting({ column: "price", direction: sorting.column === "price" && sorting.direction === "asc" ? "desc" : "asc" })}>
                                    Price <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>
                                <Button variant="ghost" onClick={() => setSorting({ column: "quantity", direction: sorting.column === "quantity" && sorting.direction === "asc" ? "desc" : "asc" })}>
                                    Quantity <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="p-4">
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                {/* <Skeleton className="h-12 w-12 rounded-full" /> */}
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-[250px]" />
                                                    <Skeleton className="h-4 w-[200px]" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data?.data?.data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">No products found.</TableCell>
                            </TableRow>
                        ) : (
                            data?.data?.data?.map((product: any) => (
                                <TableRow key={product.id}>

                                    <TableCell className="font-medium">{product.sku}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>
                                        {/* Display category name from relation if available, else fallback string */}
                                        {product.Category?.name || product.category}
                                    </TableCell>
                                    <TableCell>฿{product.price}</TableCell>
                                    <TableCell>฿{product.costPrice || 0}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${product.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                            product.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {product.status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => sellMutation.mutate({ id: product.id, currentQuantity: product.quantity })}
                                            disabled={product.quantity <= 0}
                                            title="Quick Sell (-1)"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                        </Button>
                                        {isAdmin && (
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
                                                            This action cannot be undone. This will permanently delete the product "{product.name}".
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => deleteMutation.mutate(product.id)}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

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

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (values: ProductFormData) => void
    defaultValues?: Partial<ProductFormData>
    title: string
    description: string
    categories?: any[]
}

function ProductDialog({ open, onOpenChange, onSubmit, defaultValues, title, description, categories }: ProductDialogProps) {
    const form = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: defaultValues?.name || "",
            sku: defaultValues?.sku || "",
            categoryId: defaultValues?.categoryId || "",
            price: Number(defaultValues?.price) || 0,
            costPrice: Number(defaultValues?.costPrice) || 0,
            quantity: Number(defaultValues?.quantity) || 0,
            minStock: Number(defaultValues?.minStock) || 10,
            note: ""
        },
    })


    useEffect(() => {
        if (open) {
            form.reset(defaultValues || {
                name: "", sku: "", categoryId: "", price: 0, costPrice: 0, quantity: 0, minStock: 10
            })
        }
    }, [open, defaultValues, form])


    const onError = (errors: any) => {
        console.error("Form validation errors:", JSON.stringify(errors, null, 2))
        toast.error("Please check the form for errors")


        const errorMessages = Object.entries(errors).map(([key, value]: [string, any]) => `${key}: ${value.message}`).join(", ")
        if (errorMessages) {
            toast.error(errorMessages)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sku"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>SKU</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories?.map((cat: any) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price (฿)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="costPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cost Price (฿)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="minStock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Min Stock</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Note / Remark (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Reason for change..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit">
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
