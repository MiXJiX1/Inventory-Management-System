
import api from "../lib/api";

export interface Category {
    id: string;
    name: string;
    _count?: {
        products: number;
    };
}

export const categoryService = {
    getAll: async () => {
        return api.get<Category[]>("/categories");
    },
    create: async (data: { name: string }) => {
        return api.post<Category>("/categories", data);
    },
    update: async (id: string, data: { name: string }) => {
        return api.put<Category>(`/categories/${id}`, data);
    },
    delete: async (id: string) => {
        return api.delete(`/categories/${id}`);
    },
};
