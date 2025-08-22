import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const MarketingFooter: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border py-10 px-4">
      <div className="container mx-auto">
        <div className="grid gap-6 md:grid-cols-3 items-center">
          <div className="flex items-center justify-center md:justify-start">
            <span className="text-lg font-bold font-courier">Fineprnt</span>
          </div>
          <nav className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to="/termsofservice" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Terms of Service</Link>
            <Link className="hover:text-foreground" to="/privacypolicy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Privacy Policy</Link>
            <a className="hover:text-foreground" href="mailto:support@fineprnt.com">Support</a>
          </nav>
          <div className="text-sm text-muted-foreground text-center md:text-right">© {year} Fineprnt. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
