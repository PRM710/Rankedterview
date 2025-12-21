'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import apiClient from '@/lib/api/client';

interface AuthResponse {
    token: string;
    user: User;
    success?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (provider: string, userData: any, token?: string) => Promise<void>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                apiClient.setAuthToken(token);
                try {
                    const userData = await apiClient.get<User>('/users/me');
                    if (userData) {
                        setUser(userData);
                    }
                } catch (error) {
                    localStorage.removeItem('auth_token');
                    apiClient.clearAuthToken();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (provider: string, userData: any, token?: string) => {
        try {
            if (token) {
                // Direct login with token (from OAuth callback)
                localStorage.setItem('auth_token', token);
                apiClient.setAuthToken(token);
                setUser(userData);
            } else {
                // Call backend to register/login with OAuth data
                const response = await apiClient.post<AuthResponse>('/auth/callback', {
                    provider,
                    oauthId: userData.id,
                    email: userData.email,
                    name: userData.name,
                    avatar: userData.avatar || userData.picture || '',
                });

                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                    apiClient.setAuthToken(response.token);
                    setUser(response.user);
                }
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        apiClient.clearAuthToken();
        setUser(null);
        window.location.href = '/login';
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...data });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                updateUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
