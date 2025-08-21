import React from 'react';
import { Link } from 'react-router-dom';

const MarketingFooter: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border py-10 px-4">
      <div className="container mx-auto">
        <div className="grid gap-6 md:grid-cols-3 items-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">MC</span>
            </div>
            <span className="font-semibold">omniclause</span>
          </div>
          <nav className="flex justify-center gap-6 text-sm text-muted-foreground">
            <Link className="hover:text-foreground" to="/termsofservice" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Terms of Service</Link>
            <Link className="hover:text-foreground" to="/privacypolicy" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Privacy Policy</Link>
            <a className="hover:text-foreground" href="mailto:support@omniclause.com">Support</a>
          </nav>
          <div className="text-sm text-muted-foreground text-center md:text-right">© {year} omniclause. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
