declare global {
    interface Window {
        snap: {
            pay: (
                token: string,
                callbacks: {
                    onSuccess?: (result: Record<string, unknown>) => void;
                    onPending?: (result: Record<string, unknown>) => void;
                    onError?: (result: Record<string, unknown>) => void;
                    onClose?: () => void;
                }
            ) => void;
        };
    }
}

let snapPromise: Promise<void> | null = null;

/**
 * Dynamically loads the Midtrans Snap.js script.
 * Uses VITE_MIDTRANS_CLIENT_KEY and VITE_MIDTRANS_IS_PRODUCTION env vars.
 * The script is loaded only once and cached for subsequent calls.
 */
export function loadSnapJs(): Promise<void> {
    if (snapPromise) return snapPromise;

    snapPromise = new Promise((resolve, reject) => {
        // If already loaded (e.g., from index.html fallback), resolve immediately
        if (window.snap) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '';
        const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';

        script.src = isProduction
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.type = 'text/javascript';

        script.onload = () => resolve();
        script.onerror = () => {
            snapPromise = null; // Allow retry on failure
            reject(new Error('Failed to load Midtrans Snap.js'));
        };

        document.head.appendChild(script);
    });

    return snapPromise;
}

/**
 * Checks if Snap.js is currently loaded and ready to use.
 */
export function isSnapReady(): boolean {
    return typeof window.snap !== 'undefined' && typeof window.snap.pay === 'function';
}
