import { useEffect, useState } from "react";

export default function useBackendHealth() {
    const [isDown, setIsDown] = useState(false);

    useEffect(() => {
        if (!isDown) return;

        let timeoutId;
        let isFirstAttempt = true;

        const checkHealth = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8000"}/health/`, { method: "GET" });
                if (res.ok) {
                    window.dispatchEvent(new Event("backend-up"));
                    return; // Stop polling once recovered
                }
            } catch { }

            // First retry: 3-5s. Subsequent retries: 10-15s to prevent thundering herd.
            const nextDelay = isFirstAttempt
                ? 3000 + Math.random() * 2000
                : 10000 + Math.random() * 5000;
            isFirstAttempt = false;
            timeoutId = setTimeout(checkHealth, nextDelay);
        };

        // Start first poll quickly (3-5s after going down)
        timeoutId = setTimeout(checkHealth, 3000 + Math.random() * 2000);

        return () => clearTimeout(timeoutId);
    }, [isDown]);

    useEffect(() => {
        const handleBackendDown = () => {
            setIsDown(true);
        };

        const handleBackendUp = () => {
            setIsDown(false);
        };

        window.addEventListener("backend-down", handleBackendDown);
        window.addEventListener("backend-up", handleBackendUp);

        return () => {
            window.removeEventListener("backend-down", handleBackendDown);
            window.removeEventListener("backend-up", handleBackendUp);
        };
    }, []);

    return isDown;
}