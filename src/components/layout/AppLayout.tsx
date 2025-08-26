import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Handle mobile detection and sidebar state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-collapse sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Handle overlay click to close sidebar on mobile
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay - only show when sidebar is expanded on mobile */}
      {isMobile && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar - fixed positioning on mobile, relative on desktop */}
      <div className={cn(
        "z-50",
        isMobile ? "fixed inset-y-0 left-0" : "relative"
      )}>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={handleSidebarToggle}
          isMobile={isMobile}
        />
      </div>

      {/* Main content - add left margin on mobile when sidebar is expanded */}
      <div className={cn(
        "flex flex-col flex-1 min-w-0 transition-all duration-medium",
        isMobile && !sidebarCollapsed ? "ml-0" : "",
        !isMobile ? "ml-0" : ""
      )}>
        {/* Mobile Hamburger Menu Button - Only show when sidebar is collapsed on mobile */}
        {isMobile && sidebarCollapsed && (
          <div className="absolute top-4 left-4 z-30 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="bg-background/80 backdrop-blur-sm border border-border shadow-sm"
            >
              <PanelLeftOpen size={20} />
            </Button>
          </div>
        )}
        
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

