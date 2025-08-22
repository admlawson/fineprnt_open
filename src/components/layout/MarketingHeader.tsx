import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Menu, ArrowRight } from 'lucide-react';

const MarketingHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (id: string) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="container mx-auto">
        {/* Desktop floating pill */}
        <div className={cn(
          "hidden md:flex items-center justify-between transition-all duration-300 ease-out",
          scrolled 
            ? "mx-auto max-w-2xl bg-background/80 backdrop-blur-xl border border-border/40 rounded-full px-6 py-2.5 shadow-lg" 
            : "mx-auto max-w-4xl bg-background/60 backdrop-blur-sm border border-border/20 rounded-full px-8 py-3 shadow-sm"
        )}>
          <Link to="/" className="text-lg font-bold font-courier hover:opacity-80 transition-opacity" aria-label="Go to home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Fineprnt
          </Link>
          
          <nav className={cn(
            "flex items-center text-sm transition-all duration-300",
            scrolled ? "gap-4" : "gap-6"
          )}>
            <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleNav('how-it-works')}>Product</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleNav('features')}>Features</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleNav('security')}>Security</button>
            <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleNav('faq')}>FAQ</button>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 px-0">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button size="sm" className="text-xs" onClick={() => navigate('/login')}>
              Start free
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Mobile collapsed pill */}
        <div className="md:hidden">
          <div className={cn(
            "flex items-center justify-between transition-all duration-300 ease-out",
            "mx-auto max-w-md bg-background/90 backdrop-blur-xl border border-border/40 rounded-full px-6 py-3 shadow-lg"
          )}>
            <Link to="/" className="text-base font-bold font-courier hover:opacity-80 transition-opacity" aria-label="Go to home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Fineprnt
            </Link>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 h-9 px-0">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleNav('how-it-works')}>
                    Product
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNav('features')}>
                    Features
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNav('security')}>
                    Security
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNav('faq')}>
                    FAQ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/login')}>
                    Sign in
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button size="sm" className="text-sm h-9 px-4" onClick={() => navigate('/login')}>
                Start
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MarketingHeader;
