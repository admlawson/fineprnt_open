import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Handle mobile detection and sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      console.log('Mobile check:', { width: window.innerWidth, isMobile: mobile, currentState: sidebarCollapsed });
      setIsMobile(mobile);
      
      // Auto-collapse sidebar on mobile
      if (mobile && !sidebarCollapsed) {
        console.log('Auto-collapsing sidebar on mobile');
        setSidebarCollapsed(true);
      }
    };

    // Initial check
    checkMobile();
    
    // Add event listeners
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [sidebarCollapsed]);

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      console.log('Auto-collapsing sidebar on navigation');
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    console.log('Sidebar toggle called, current state:', sidebarCollapsed);
    setSidebarCollapsed(!sidebarCollapsed);
    console.log('New state will be:', !sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

