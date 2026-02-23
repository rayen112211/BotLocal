import React, { createContext, useContext, useState, useEffect } from 'react';

interface Business {
    id: string;
    email: string;
    name: string;
    telegramBotToken?: string;
    telegramBotUsername?: string;
    plan?: string;
    messageCount?: number;
}

interface AuthContextType {
    business: Business | null;
    token: string | null;
    login: (token: string, business: Business) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [business, setBusiness] = useState<Business | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedBusiness = localStorage.getItem('business');

        if (storedToken && storedBusiness) {
            try {
                setToken(storedToken);
                setBusiness(JSON.parse(storedBusiness));
            } catch (e) {
                console.error("Failed to parse stored business info");
                localStorage.removeItem('token');
                localStorage.removeItem('business');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newBusiness: Business) => {
        setToken(newToken);
        setBusiness(newBusiness);
        localStorage.setItem('token', newToken);
        localStorage.setItem('business', JSON.stringify(newBusiness));
    };

    const logout = () => {
        setToken(null);
        setBusiness(null);
        localStorage.removeItem('token');
        localStorage.removeItem('business');
    };

    return (
        <AuthContext.Provider value={{ business, token, login, logout, isAuthenticated: !!token, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
