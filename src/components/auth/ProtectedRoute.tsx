import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token } = useAuth();
    const location = useLocation();

    // Also check for token in localStorage in case state is refreshing
    const hasToken = token || localStorage.getItem('auth_token');

    if (!isAuthenticated && !hasToken) {
        // Redirect to login but save the current location to return after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
