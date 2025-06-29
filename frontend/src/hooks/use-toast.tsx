import { useCallback } from 'react';

interface ToastProps {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
}

export function useToast() {
    const toast = useCallback(({ title, description, variant }: ToastProps) => {
        const message = description ? `${title}: ${description}` : title;

        if (variant === 'destructive') {
            alert(`❌ ${message}`);
        } else {
            alert(`✅ ${message}`);
        }
    }, []);

    return { toast };
}
