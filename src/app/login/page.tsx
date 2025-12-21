'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Chrome, Github } from 'lucide-react';
import Script from 'next/script';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, config: any) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [googleLoaded, setGoogleLoaded] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleGoogleCallback = useCallback(async (response: any) => {
        setLoading(true);
        setError('');

        try {
            // Decode JWT token from Google
            const payload = JSON.parse(atob(response.credential.split('.')[1]));

            // Create user data from Google response
            const userData = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                avatar: payload.picture,
            };

            await login('google', userData);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Login failed. Please try again.');
            setLoading(false);
        }
    }, [login, router]);

    useEffect(() => {
        if (googleLoaded && window.google) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
                auto_select: false,
            });

            const buttonDiv = document.getElementById('google-signin-button');
            if (buttonDiv) {
                window.google.accounts.id.renderButton(buttonDiv, {
                    theme: 'outline',
                    size: 'large',
                    width: '100%',
                    text: 'continue_with',
                });
            }
        }
    }, [googleLoaded, handleGoogleCallback]);

    const handleGitHubLogin = () => {
        setError('GitHub OAuth not configured yet. Please use Google login.');
    };

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={() => setGoogleLoaded(true)}
                strategy="afterInteractive"
            />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-purple-50 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                                RANKEDterview
                            </span>
                        </h1>
                        <p className="text-gray-600">Sign in to practice interviews</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                            <p className="text-gray-600 mt-2">Signing you in...</p>
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    {!loading && (
                        <div className="space-y-4">
                            <div id="google-signin-button" className="flex justify-center"></div>

                            {!googleLoaded && (
                                <button
                                    disabled
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg font-medium opacity-50"
                                >
                                    <Chrome size={20} className="text-teal-600" />
                                    Loading Google Sign-In...
                                </button>
                            )}

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGitHubLogin}
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Github size={20} />
                                Continue with GitHub
                            </button>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>🔒 Your real Google account will be used</p>
                        <p className="mt-1">Change display name anytime in Profile</p>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-400 mt-6">
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="hover:underline text-teal-600">
                            Terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="hover:underline text-teal-600">
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
