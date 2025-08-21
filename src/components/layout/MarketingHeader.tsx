import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Menu, ArrowRight } from 'lucide-react';

const MarketingHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);

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
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors supports-[backdrop-filter]:bg-background/50 backdrop-blur',
        scrolled ? 'bg-background/70 border-border/60 shadow-sm' : 'bg-background/30 border-transparent'
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Go to home" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">MC</span>
          </div>
          <span className="text-xl font-bold">omniclause</span>
          <Badge variant="secondary" className="ml-2">Healthcare</Badge>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <button className="text-muted-foreground hover:text-foreground" onClick={() => handleNav('how-it-works')}>Product</button>
          <button className="text-muted-foreground hover:text-foreground" onClick={() => handleNav('features')}>Features</button>
          <button className="text-muted-foreground hover:text-foreground" onClick={() => handleNav('security')}>Security</button>
          <button className="text-muted-foreground hover:text-foreground" onClick={() => handleNav('faq')}>FAQ</button>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNav('how-it-works')}>Product</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNav('features')}>Features</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNav('security')}>Security</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNav('faq')}>FAQ</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/login')}>Sign in</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/login')}>Start free</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="Toggle theme">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" className="hidden md:inline-flex" onClick={() => navigate('/login')}>Sign in</Button>
          <Button className="hidden md:inline-flex" onClick={() => navigate('/login')}>
            Start free <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MarketingHeader;
