import api from "../lib/api";

export const productService = {
    getProducts: async ({ page, limit, search, category, status, sortBy, sortOrder }: any) => {
        return api.get("/products", {
            params: { page, limit, search, category, status, sortBy, sortOrder }
        });
    },
    getProduct: async (id: string) => {
        return api.get(`/products/${id}`);
    },
    createProduct: async (data: any) => {
        return api.post("/products", data);
    },
    createProductsBatch: async (products: any[]) => {
        return api.post("/products/batch", { products });
    },
    updateProduct: async (id: string, data: any) => {
        return api.patch(`/products/${id}`, data);
    },
    deleteProduct: async (id: string) => {
        return api.delete(`/products/${id}`);
    },
};
