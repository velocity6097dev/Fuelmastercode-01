import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import BroadcastBanner from '../../components/common/BroadcastBanner';
import { triggerHaptic, playClick } from '../../utils/audio'; 
import { ImpactStyle } from '@capacitor/haptics';
import { 
  Activity, 
  Thermometer, 
  Cylinder, 
  FileCheck, 
  Info, 
  RefreshCw, 
  FileText, 
  UserCircle 
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useStation } from '../../context/StationContext';
import { useSystem } from '../../context/SystemContext';
import { useBroadcast } from '../../context/BroadcastContext';

const ClientDashboard = () => {
  const navigate = useNavigate();

  const { user, role } = useAuth();
  
  // 1. Get refreshKey and station theme
  const { station, loading: stationLoading, retry, refreshKey } = useStation(); 
  const { sysStatus } = useSystem(); 
  
  // 2. Get the reactive syncToken for real-time broadcast changes
  const { broadcast, syncToken } = useBroadcast();

  const handleNav = (path) => {
    playClick(); 
    navigate(path);
  };

  const handleRefresh = () => {
    if (!stationLoading) {
      triggerHaptic(ImpactStyle.Medium); 
      retry(); 
    }
  };

  return (
    /* FIX A: Tie the key to both refreshKey (Station) AND syncToken (Broadcast).
       If either changes in the DB, the entire layout re-renders instantly.
    */
    <div className="app-layout" key={`${refreshKey}-${syncToken}`}> 
      <Navbar title="FUELMASTER" isHome={true} />
      
      <main className="main-content">
         
         {/* FIX B: The key must be the syncToken. 
            When the DB updates 'broadcast_msg', syncToken changes, and the marquee resets with new text.
         */}
         <BroadcastBanner 
            key={syncToken}
            msg={broadcast?.msg} 
            type={broadcast?.type} 
            updatedAt={broadcast?.updatedAt} 
         />

         {/* SYSTEM STATUS CARD */}
         <div className="system-status-card">
            <div className="status-header">
                <div className="live-indicator" onClick={handleRefresh} style={{ cursor: 'pointer' }}>
                    <span className={`pulse-dot ${stationLoading ? 'yellow' : sysStatus.pulse}`}></span>
                    <span className="status-text" style={{
                        color: stationLoading ? '#f59e0b' : (sysStatus.pulse === 'green' ? 'var(--success)' : 'var(--warning)')
                    }}>
                        {stationLoading ? 'SYNCING...' : sysStatus.text}
                    </span>
                </div>
                
                <button 
                    className={`icon-btn-refresh ${stationLoading ? 'spinning' : ''}`} 
                    onClick={handleRefresh}
                    disabled={stationLoading}
                >
                    <RefreshCw size={16}/>
                </button>
            </div>
            
            <div className="status-details">
                {sysStatus.checks.map((check, i) => (
                    <div key={i} className="success-item" style={{
                        display:'flex', 
                        alignItems:'center', 
                        gap:5, 
                        fontSize:'0.75rem', 
                        color: (sysStatus.pulse === 'green' && !stationLoading) ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                        {check.icon} {check.label}
                    </div>
                ))}
            </div>
         </div>

         {/* WELCOME SECTION */}
         <div className="welcome-card animate__animated animate__fadeIn">
            <div className="welcome-text">
                <span className="sub-welcome" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>
                    WELCOME, {role === 'manager' ? 'MANAGER' : (user?.name || 'STAFF')}
                </span>

                {/* This will now update instantly when station.name changes */}
                <h2 style={{textTransform: 'uppercase'}}>{station?.name || 'STATION'}</h2>

                <div className="welcome-id">
                    ID: {user?.id}
                </div>
            </div>
            
            <Activity className="welcome-icon" size={48} />
         </div>

         {/* APP NAVIGATION GRID */}
         <div className="nav-grid">
            <button className="nav-card" onClick={() => handleNav('/density')}>
                <div className="icon-box blue"><Thermometer /></div>
                <span>Density</span>
            </button>
            <button className="nav-card" onClick={() => handleNav('/stocks')}>
                <div className="icon-box orange"><Cylinder /></div>
                <span>Stocks</span>
            </button>
            <button className="nav-card" onClick={() => handleNav('/variance')}>
                <div className="icon-box green"><FileCheck /></div>
                <span>Variance</span>
            </button>
            <button className="nav-card" onClick={() => handleNav('/compliance')}>
                <div className="icon-box purple" style={{background:'#8b5cf6'}}><FileText /></div>
                <span style={{fontSize:'0.75rem'}}>Reminders</span>
            </button>
            <button className="nav-card" onClick={() => handleNav('/about')}>
                <div className="icon-box red" style={{background:'#ef4444'}}><UserCircle /></div>
                <span>Owner</span>
            </button>
         </div>

         <div className="info-card">
            <h3><Info size={16}/> Anti-Piracy Warning</h3>
            <p style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
                Any unauthorized duplication, modification, or distribution of this software is prohibited.
            </p>
         </div>

         <footer className="app-footer">
            <p>Made with <span className="heart">♥</span> by <strong>Velocity6097</strong></p>
         </footer>
      </main>
    </div>
  );
};

export default ClientDashboard;