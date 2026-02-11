"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "@/services/authService";
import { useRouter } from "next/navigation";

interface User {
    id: string;
    email: string;
    name?: string;
    role: "ADMIN" | "USER";
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const res = await authService.me();
            setUser(res.data);
        } catch (error) {
            setUser(null);
            // Optional: Redirect to login if sensitive routes are accessed
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: any) => {
        const res = await authService.login(data);
        setUser(res.data.user);
        router.push("/dashboard");
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        router.push("/login");
    };

    // Inactivity Check
    useEffect(() => {
        const events = ["mousedown", "keydown", "scroll", "touchstart"];

        const resetTimer = () => {
            localStorage.setItem("lastActive", Date.now().toString());
        };

        const checkInactivity = () => {
            const lastActive = localStorage.getItem("lastActive");
            if (lastActive) {
                const now = Date.now();
                const timeSinceLastActive = now - parseInt(lastActive);

                // 10 minutes = 600,000 ms
                if (timeSinceLastActive > 10 * 60 * 1000 && user) {
                    logout(); // Auto logout
                }
            }
        };

        // Check on mount and interval
        const interval = setInterval(checkInactivity, 60 * 1000); // Check every minute

        // Add event listeners
        events.forEach(event => window.addEventListener(event, resetTimer));

        // Initial set
        if (!localStorage.getItem("lastActive")) {
            resetTimer();
        }

        return () => {
            clearInterval(interval);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [user, router]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
