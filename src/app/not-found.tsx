'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50">
            <div className="text-center px-4">
                <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
                <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline" className="gap-2">
                            <Home size={20} />
                            Go Home
                        </Button>
                    </Link>
                    <Button onClick={() => window.history.back()} className="gap-2">
                        <ArrowLeft size={20} />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
