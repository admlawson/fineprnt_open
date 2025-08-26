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
  }, []); // Remove sidebarCollapsed dependency to prevent infinite loop

  // Handle auto-collapse when mobile state changes
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      console.log('Auto-collapsing sidebar due to mobile state change');
      setSidebarCollapsed(true);
    }
  }, [isMobile]); // Only depend on isMobile, not sidebarCollapsed

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      console.log('Auto-collapsing sidebar on navigation');
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    console.log('=== Sidebar Toggle Called ===');
    console.log('Current sidebarCollapsed:', sidebarCollapsed);
    console.log('Current isMobile:', isMobile);
    console.log('About to set sidebarCollapsed to:', !sidebarCollapsed);
    
    try {
      setSidebarCollapsed(!sidebarCollapsed);
      console.log('setSidebarCollapsed called successfully');
    } catch (error) {
      console.error('Error in setSidebarCollapsed:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        key={`sidebar-${sidebarCollapsed}-${isMobile}`}
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

