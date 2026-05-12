import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('manager'); // 'manager' | 'staff'
  const [loading, setLoading] = useState(true);

  // --- 1. HANDLE INITIALIZATION ---
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedStationId = localStorage.getItem('fm_station_id');
        const storedRole = localStorage.getItem('fm_user_role');
        const savedId = localStorage.getItem('fm_saved_id');
        const savedName = localStorage.getItem('fm_user_name');
        
        if (storedStationId && storedRole) {
          setRole(storedRole);
          if (storedRole === 'staff') {
              setUser({ id: savedId || 'Staff', name: savedName || 'Staff Member' });
          } else {
              setUser({ id: savedId, name: 'Manager' });
          }
        }
      } catch (error) {
        console.error("Auth Initialization Failed:", error);
        localStorage.removeItem('fm_station_id');
        localStorage.removeItem('fm_user_role');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // --- 2. CLEAR GLOBAL CSS LOADER ---
  // This removes the #app-loader element from your index.html/CSS
  useEffect(() => {
    if (!loading) {
      const loader = document.getElementById('app-loader');
      if (loader) {
        // Apply the fade transition defined in your CSS
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        
        // Remove from DOM after transition completes (0.5s per your CSS)
        const timeout = setTimeout(() => {
          loader.remove();
        }, 500);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [loading]);

  const login = async (id, pass) => {
    if (!navigator.onLine) throw new Error("No Internet Connection");

    let { data: stData, error } = await supabase
      .from('stations')
      .select('station_id, manager_user, manager_pass')
      .eq('manager_user', id)
      .eq('manager_pass', pass)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        throw new Error("Database Connection Failed");
    }

    let finalRole = 'manager';
    let userInfo = { id: id, name: 'Manager' };

    if (!stData) {
      const { data: staff } = await supabase
        .from('staff')
        .select('*, stations(station_id)')
        .eq('phone', id)
        .eq('pin', pass)
        .maybeSingle();

      if (staff) {
        stData = staff.stations;
        finalRole = 'staff';
        userInfo = { id: staff.phone, name: staff.name };
      }
    }

    if (!stData) throw new Error("Invalid ID or Password");

    localStorage.setItem('fm_station_id', stData.station_id);
    localStorage.setItem('fm_user_role', finalRole);
    localStorage.setItem('fm_saved_id', userInfo.id);
    localStorage.setItem('fm_user_name', userInfo.name);

    setRole(finalRole);
    setUser(userInfo);
    
    return true; 
  };

  const logout = () => {
    localStorage.removeItem('fm_station_id');
    localStorage.removeItem('fm_user_role');
    //localStorage.removeItem('fm_saved_id');
    localStorage.removeItem('fm_station_data');
    localStorage.removeItem('fm_user_name');
    setUser(null);
    setRole('manager');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {/* CRITICAL: If loading is true, we render nothing so the 
         #app-loader remains visible and interactive.
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);