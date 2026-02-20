'use client';

import { useEffect } from 'react';

/**
 * Global component to suppress harmless browser media errors.
 * Specifically handles AbortError which occurs when a play() promise 
 * is interrupted by a pause(), source change, or unmount.
 */
export default function MediaErrorSuppressor() {
    useEffect(() => {
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            // Suppress AbortError related to media playback interruptions
            const isAbortError =
                event.reason &&
                (event.reason.name === 'AbortError' ||
                    event.reason.message?.includes('play() request was interrupted'));

            if (isAbortError) {
                // Prevent the error from showing up in the console as "Uncaught"
                event.preventDefault();
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    return null;
}
