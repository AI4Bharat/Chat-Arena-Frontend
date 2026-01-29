import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Tenant storage key - matches the one in client.js
const TENANT_STORAGE_KEY = 'current_tenant';

// Create the context
const TenantContext = createContext(null);

// Provider component that wraps the app
export function TenantProvider({ children }) {
    const [tenant, setTenantState] = useState(null);
    const location = useLocation();

    // Custom setter that also updates localStorage
    const setTenant = (newTenant) => {
        setTenantState(newTenant);
        if (newTenant) {
            localStorage.setItem(TENANT_STORAGE_KEY, newTenant);
        } else {
            localStorage.removeItem(TENANT_STORAGE_KEY);
        }
    };

    // On mount, check if there's a stored tenant
    useEffect(() => {
        const storedTenant = localStorage.getItem(TENANT_STORAGE_KEY);
        if (storedTenant && !tenant) {
            setTenantState(storedTenant);
        }
    }, []);

    // Sync tenant with URL changes (URL is Source of Truth)
    useEffect(() => {
        const path = location.pathname;

        // 1. Check if URL has a tenant prefix (e.g. /aquarium/chat)
        // We look for patterns like /:tenant/chat, /:tenant/leaderboard
        const tenantMatch = path.match(/^\/([a-zA-Z0-9_-]+)\/(chat|leaderboard)/);

        if (tenantMatch) {
            const urlTenant = tenantMatch[1];
            // If URL has tenant, ensure context matches
            if (tenant !== urlTenant) {
                setTenant(urlTenant);
            }
        } else {
            // 2. If URL does NOT have a tenant prefix, but is a route that COULD have one
            // (like /chat or /leaderboard), it implies "Default Tenant".
            // We should clear the context tenant to match the URL.
            const isDefaultRoute = path.startsWith('/chat') || path.startsWith('/leaderboard');

            // Also check root path /
            const isRoot = path === '/';

            if ((isDefaultRoute || isRoot) && tenant) {
                setTenant(null);
            }
        }
    }, [location.pathname]);

    return (
        <TenantContext.Provider value={{ tenant, setTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

// Custom hook for easy access to tenant
export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

// Export context for direct access (needed by API client)
export { TenantContext };
