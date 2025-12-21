import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class APIClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: `${API_URL}/api/v1`,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = this.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired, try to refresh
                    const refreshed = await this.refreshToken();
                    if (refreshed && error.config) {
                        // Retry the original request
                        return this.client(error.config);
                    }
                    // Redirect to login
                    if (typeof window !== 'undefined') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }

    private setToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }

    private removeToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
        }
    }

    private async refreshToken(): Promise<boolean> {
        try {
            const token = this.getToken();
            if (!token) return false;

            const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
                token,
            });

            if (response.data.token) {
                this.setToken(response.data.token);
                return true;
            }
            return false;
        } catch {
            this.removeToken();
            return false;
        }
    }

    // Generic request methods
    async get<T>(url: string, params?: any): Promise<T> {
        const response = await this.client.get(url, { params });
        return response.data.data || response.data;
    }

    async post<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.post(url, data);
        return response.data.data || response.data;
    }

    async put<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.put(url, data);
        return response.data.data || response.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete(url);
        return response.data.data || response.data;
    }

    // Auth methods
    setAuthToken(token: string): void {
        this.setToken(token);
    }

    clearAuthToken(): void {
        this.removeToken();
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
}

export const apiClient = new APIClient();
export default apiClient;
