import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const BroadcastContext = createContext();

export const BroadcastProvider = ({ children }) => {
  // 1. Initial State from Storage (Instant load on refresh)
  const [maintenance, setMaintenance] = useState(() => {
    const saved = localStorage.getItem('fm_maint_v2');
    try { return saved ? JSON.parse(saved) : { active: false }; } catch (e) { return { active: false }; }
  });

  const [broadcast, setBroadcast] = useState(() => {
    const saved = localStorage.getItem('fm_broad_v2');
    try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
  });

  // This is the "Heartbeat" that tells the Dashboard to re-render
  const [syncToken, setSyncToken] = useState(Date.now());

  const applySettings = useCallback((settings) => {
    if (!settings) return;
    
    // Maintenance Lock
    const maintObj = { active: !!settings.downtime_active };
    setMaintenance(maintObj);
    localStorage.setItem('fm_maint_v2', JSON.stringify(maintObj));

    // Broadcast Message
    const msg = settings.broadcast_msg?.trim() || "";
    if (msg !== "") {
        const broadObj = { 
            msg, 
            type: settings.broadcast_type || 'info',
            updatedAt: Date.now() 
        };
        setBroadcast(broadObj);
        localStorage.setItem('fm_broad_v2', JSON.stringify(broadObj));
    } else {
        setBroadcast(null);
        localStorage.removeItem('fm_broad_v2');
    }

    // CRITICAL: Forces UI re-render
    setSyncToken(Date.now());
  }, []);

  useEffect(() => {
    let timeoutId;
    
    const startSync = async () => {
      // A. Initial Fetch
      const { data } = await supabase.from('system_settings').select('*').eq('id', 1).single();
      if (data) applySettings(data);

      // B. Setup Subscription
      const channel = supabase
        .channel('system-broadcast-realtime')
        .on(
          'postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'system_settings', filter: 'id=eq.1' }, 
          (payload) => {
            console.log("Real-time Broadcast Sync:", payload.new);
            applySettings(payload.new);
          }
        )
        .subscribe((status) => {
          // Auto-recovery if connection drops
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn("Broadcast sync lost. Reconnecting in 5s...");
            timeoutId = setTimeout(startSync, 5000);
          }
        });

      return channel;
    };

    const channelPromise = startSync();

    return () => {
      clearTimeout(timeoutId);
      channelPromise.then(c => { if(c) supabase.removeChannel(c); });
    };
  }, [applySettings]);

  return (
    <BroadcastContext.Provider value={{ maintenance, broadcast, syncToken }}>
      {children}
    </BroadcastContext.Provider>
  );
};

export const useBroadcast = () => useContext(BroadcastContext);