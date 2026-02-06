import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole }) {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Check if user is logged in
    if (!token || !userStr) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);

    // Check if user has required role
    if (requiredRole && user.role !== requiredRole) {
        // Redirect to home if user doesn't have required role
        alert('Bạn không có quyền truy cập trang này!');
        return <Navigate to="/" replace />;
    }

    // User is authenticated and has required role
    return children;
}
