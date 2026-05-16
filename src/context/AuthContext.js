import React, { createContext, useState, useEffect, useContext } from 'react'; 
import { supabase } from '../services/supabaseClient'; 

const AuthContext = createContext(); 

export const AuthProvider = ({ children }) => { 
    const [user, setUser] = useState(null); 
    const [role, setRole] = useState('manager'); // 'manager' | 'staff' 
    const [loading, setLoading] = useState(true); 

    // --- 1. LIVE SESSION & BLOCK VALIDATION --- 
    useEffect(() => { 
        const validateSession = async () => { 
            try { 
                const storedRole = localStorage.getItem('fm_user_role'); 
                const savedId = localStorage.getItem('fm_saved_id'); 
                const savedToken = localStorage.getItem('fm_auth_token'); // We use this to verify password changes

                if (storedRole === 'manager' && savedId && savedToken) { 
                    // PING DB: Check if Manager password changed OR if they are blocked
                    const { data: stData, error } = await supabase
                        .from('stations')
                        .select('manager_pass, is_blocked')
                        .eq('manager_user', savedId)
                        .maybeSingle();

                    if (error || !stData || stData.is_blocked === true || stData.manager_pass !== savedToken) {
                        console.log("Session invalid: Password changed or account blocked.");
                        clearLocalAuth();
                    } else {
                        setRole('manager'); 
                        setUser({ id: savedId, name: 'Manager' }); 
                    }

                } else if (storedRole === 'staff' && savedId && savedToken) { 
                    // PING DB: Check if Staff password changed OR if they are blocked
                    const { data: staff, error } = await supabase
                        .from('staff')
                        .select('pin, is_blocked, name')
                        .eq('phone', savedId)
                        .maybeSingle();

                    if (error || !staff || staff.is_blocked === true || staff.pin !== savedToken) {
                        console.log("Session invalid: PIN changed or account blocked.");
                        clearLocalAuth();
                    } else {
                        setRole('staff'); 
                        setUser({ id: savedId, name: staff.name }); 
                    }

                } else {
                    clearLocalAuth();
                }
            } catch (error) { 
                console.error("Auth Validation Failed:", error); 
                clearLocalAuth(); 
            } finally { 
                setLoading(false); 
            } 
        }; 

        validateSession(); 
    }, []); 

    // --- 2. CLEAR GLOBAL CSS LOADER --- 
    useEffect(() => { 
        if (!loading) { 
            const loader = document.getElementById('app-loader'); 
            if (loader) { 
                loader.style.opacity = '0'; 
                loader.style.visibility = 'hidden'; 
                const timeout = setTimeout(() => { loader.remove(); }, 500); 
                return () => clearTimeout(timeout); 
            } 
        } 
    }, [loading]); 

    // --- 3. HELPER TO WIPE SESSION ---
    const clearLocalAuth = () => {
        localStorage.removeItem('fm_station_id'); 
        localStorage.removeItem('fm_user_role'); 
        localStorage.removeItem('fm_auth_token'); // Remove the password validator
        localStorage.removeItem('fm_station_data'); 
        // We keep fm_saved_id and fm_user_name so the login screen remembers them
        setUser(null);
        setRole('manager');
    };

    // --- 4. CUSTOM LOGIN LOGIC ---
    const login = async (id, pass) => { 
        if (!navigator.onLine) throw new Error("No Internet Connection"); 
        
        // Try Manager Login
        let { data: stData, error: stError } = await supabase 
            .from('stations') 
            .select('station_id, manager_user, manager_pass, is_blocked') 
            .eq('manager_user', id) 
            .eq('manager_pass', pass) 
            .maybeSingle(); 

        if (stError && stError.code !== 'PGRST116') { 
            throw new Error("Database Connection Failed"); 
        } 

        if (stData) {
            // Check Membership Block
            if (stData.is_blocked) throw new Error("Account Suspended by Admin.");

            localStorage.setItem('fm_station_id', stData.station_id); 
            localStorage.setItem('fm_user_role', 'manager'); 
            localStorage.setItem('fm_saved_id', id); 
            localStorage.setItem('fm_user_name', 'Manager'); 
            localStorage.setItem('fm_auth_token', pass); // Save for future live validation
            
            setRole('manager'); 
            setUser({ id: id, name: 'Manager' }); 
            return true;
        }

        // Try Staff Login
        const { data: staff } = await supabase 
            .from('staff') 
            .select('*, stations(station_id)') 
            .eq('phone', id) 
            .eq('pin', pass) 
            .maybeSingle(); 

        if (staff) { 
            // Check Membership Block
            if (staff.is_blocked) throw new Error("Account Suspended by Admin.");

            localStorage.setItem('fm_station_id', staff.stations.station_id); 
            localStorage.setItem('fm_user_role', 'staff'); 
            localStorage.setItem('fm_saved_id', staff.phone); 
            localStorage.setItem('fm_user_name', staff.name); 
            localStorage.setItem('fm_auth_token', pass); // Save for future live validation

            setRole('staff'); 
            setUser({ id: staff.phone, name: staff.name }); 
            return true;
        } 

        // If neither worked
        throw new Error("Invalid ID or Password"); 
    }; 

    const logout = () => { 
        clearLocalAuth();
        window.location.href = '/login'; 
    }; 

    return ( 
        <AuthContext.Provider value={{ user, role, loading, login, logout }}> 
            {!loading && children} 
        </AuthContext.Provider> 
    ); 
}; 

export const useAuth = () => useContext(AuthContext);