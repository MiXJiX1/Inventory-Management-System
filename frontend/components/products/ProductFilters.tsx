"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface ProductFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    categoryFilter: string;
    onCategoryChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    categories?: any[];
}

export function ProductFilters({
    search,
    onSearchChange,
    categoryFilter,
    onCategoryChange,
    statusFilter,
    onStatusChange,
    categories
}: ProductFiltersProps) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8"
                />
            </div>

            <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categories?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                variant={statusFilter === 'low_stock' ? "destructive" : "outline"}
                onClick={() => onStatusChange(statusFilter === 'low_stock' ? "" : "low_stock")}
                className="gap-2"
            >
                <Filter className="h-4 w-4" />
                Low Stock
            </Button>
        </div>
    );
}
