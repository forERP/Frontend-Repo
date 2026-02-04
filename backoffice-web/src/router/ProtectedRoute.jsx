import { Navigate, Outlet } from 'react-router-dom';

const DEV_BYPASS = import.meta.env.DEV;

export default function ProtectedRoute() {
    if (DEV_BYPASS) return <Outlet />;

    const token = localStorage.getItem('accessToken');
    if (!token) return <Navigate to="/login" replace />;

    return <Outlet />;
}
