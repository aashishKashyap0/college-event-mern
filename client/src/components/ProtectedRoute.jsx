import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but role not allowed, redirect based on user role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRedirects = {
      STUDENT: '/student',
      COORDINATOR: '/coordinator',
      HOD: '/hod'
    };
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
