import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStation } from '../../context/StationContext';

const RequireAuth = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { station } = useStation(); 
  const location = useLocation();

  // 1. Wait for Auth to finish initializing
  if (authLoading) {
      return null; // Or a spinner
  }

  // 2. If no user, kick to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If logged in but no station data yet, show a loader (prevents crash)
  if (!station) {
     return (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="spinner-mini darker"></div>
            <p style={{marginLeft: 10, color: '#666'}}>Loading Station Data...</p>
        </div>
     );
  }

  // 4. Success - Render the Dashboard
  return children;
};

export default RequireAuth;