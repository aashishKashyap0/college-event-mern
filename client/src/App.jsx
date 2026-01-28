import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/chatbot';


// Pages
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import HODDashboard from './pages/HODDashboard';
import CheckIn from './pages/CheckIn';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Chatbot />
        
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/coordinator"
            element={
              <ProtectedRoute allowedRoles={['COORDINATOR']}>
                <CoordinatorDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/hod"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HODDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/checkin/:eventId"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <CheckIn />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 - Not found */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;