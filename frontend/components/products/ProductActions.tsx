"use client";

import { Upload, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface ProductActionsProps {
    isAdmin: boolean;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    onCreateClick: () => void;
}

export function ProductActions({
    isAdmin,
    onImport,
    onExport,
    onCreateClick
}: ProductActionsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex gap-2">
            {isAdmin && (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".csv"
                        onChange={onImport}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                </>
            )}
            <Button variant="outline" onClick={onExport}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            {isAdmin && (
                <Button onClick={onCreateClick}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            )}
        </div>
    );
}
