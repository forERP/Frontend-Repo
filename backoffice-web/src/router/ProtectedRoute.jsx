import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute() {
    const location = useLocation();
    const token = sessionStorage.getItem('accessToken');

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ authRequired: true, from: location.pathname }}
            />
        );
    }

    return <Outlet />;
}
