"use client";

import { Pencil, Trash2, ShoppingCart, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/alert-dialog";

interface ProductTableProps {
    products: any[];
    isLoading: boolean;
    isAdmin: boolean;
    onEdit: (product: any) => void;
    onDelete: (id: string) => void;
    onSell: (product: any) => void;
    sorting: { column: string; direction: string };
    onSort: (column: string) => void;
}

export function ProductTable({
    products,
    isLoading,
    isAdmin,
    onEdit,
    onDelete,
    onSell,
    sorting,
    onSort
}: ProductTableProps) {
    if (isLoading) {
        return (
            <div className="rounded-md border p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => onSort("name")} className="hover:bg-transparent p-0">
                                Name <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => onSort("price")} className="hover:bg-transparent p-0">
                                Price <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => onSort("quantity")} className="hover:bg-transparent p-0">
                                Quantity <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24">No products found.</TableCell>
                        </TableRow>
                    ) : (
                        products?.map((product: any) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.sku}</TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>{product.Category?.name || product.category}</TableCell>
                                <TableCell>฿{product.price}</TableCell>
                                <TableCell>฿{product.costPrice || 0}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${product.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                            product.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {product.status?.replace('_', ' ')}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => onSell(product)}
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
                                                        onClick={() => onDelete(product.id)}
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
    );
}
