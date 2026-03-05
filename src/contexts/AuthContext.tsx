import React, { createContext, useContext, useState, useEffect } from 'react';
import { graphqlRequest } from '../lib/graphqlClient';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    isSystemAdmin: boolean;
    businessId?: string;
    business?: {
        name: string;
        isActive?: boolean;
        trialEndsAt?: string | Date;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

    useEffect(() => {
        const savedUser = localStorage.getItem('auth_user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('auth_token', newToken);
        localStorage.setItem('auth_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const refreshUser = async () => {
        try {
            const query = `
                query GetMe {
                    me {
                        id
                        email
                        firstName
                        lastName
                        name
                        isSystemAdmin
                        businessId
                        business {
                            name
                            isActive
                            trialEndsAt
                        }
                    }
                }
            `;
            const data = await graphqlRequest(query);
            if (data?.me) {
                setUser(data.me);
                localStorage.setItem('auth_user', JSON.stringify(data.me));
            }
        } catch (e) {
            console.error("Failed to refresh user", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isAuthenticated: !!token }}>
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
