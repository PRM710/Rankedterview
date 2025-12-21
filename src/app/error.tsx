'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <div className="text-center px-4">
                <AlertCircle size={64} className="mx-auto text-red-600 mb-4" />
                <h2 className="text-3xl font-bold mb-4">Something Went Wrong</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    We're sorry, but something unexpected happened. Please try again.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={() => reset()}>Try Again</Button>
                    <Button variant="outline" onClick={() => (window.location.href = '/')}>
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
