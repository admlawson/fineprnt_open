import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  FileText, 
  Settings, 
  Shield, 
  Menu,
  PenSquare,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserProfileDialog } from '@/components/auth/UserProfileDialog';
import { SubscriptionStartDialog } from '@/components/auth/SubscriptionStartDialog';
import { useToast } from '@/hooks/use-toast';
import { functionUrl } from '@/lib/supabaseEndpoints';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  document_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface Document {
  id: string;
  filename: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, isMobile = false }) => {
  const { user, session, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'General' | 'Chat quality' | 'Bug' | 'Idea' | 'Other'>('General');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState<'Document upload' | 'Processing issues' | 'Billing & credits' | 'Account & login' | 'Chat answers' | 'Feature request' | 'Other'>('Document upload');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [sendingSupport, setSendingSupport] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [credits, setCredits] = useState<{ available: number; total: number } | null>(null);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [showStartSub, setShowStartSub] = useState(false);
  const { toast } = useToast();

  // Fetch chat sessions and documents
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // Fetch documents (B2C)
      const { data: docsData } = await supabase
        .from('documents' as any)
        .select('id, filename')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      // Fetch chat sessions (B2C)
      const { data: sessionsData } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      setDocuments(((docsData as any[]) || []).map((d: any) => ({ id: String(d.id), filename: String(d.filename) })));
      setChatSessions(sessionsData || []);
    };

    fetchData();

    // Set up real-time subscription for chat sessions
    const channel = supabase
      .channel('chat-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchData(); // Refetch when sessions change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load credits and subscription status
  useEffect(() => {
    const loadCredits = async () => {
      if (!user?.id) return;
      
      try {
        // Use raw SQL for now until types are updated
        const { data: credit } = await (supabase as any).rpc('get_credit_summary', { p_user_id: user.id });
        if (credit && Array.isArray(credit) && credit.length > 0) {
          const row = credit[0];
          const start = Number(row.starting_credits ?? 0);
          const over = Number(row.overage_units ?? 0);
          const used = Number(row.credits_used ?? 0);
          setCredits({
            available: Math.max(0, start + over - used),
            total: start + over,
          });
        }
      } catch (err) {
        console.warn('get_credit_summary not available yet');
        setCredits({ available: 0, total: 0 });
      }
    };

    const loadSub = async () => {
      if (!user?.id) return;
      
      try {
        // Use raw SQL for subscription data
        const { data: subData } = await (supabase as any).rpc('get_user_subscription', { p_user_id: user.id });
        if (subData && Array.isArray(subData) && subData.length > 0) {
          const row = subData[0];
          setSubStatus(row.status ?? 'inactive');
        } else {
          setSubStatus('inactive');
        }
      } catch (err) {
        console.warn('get_user_subscription not available yet');
        setSubStatus('inactive');
      }
    };

    loadCredits();
    loadSub();

    // Realtime: refresh credits when consumption events occur or credits table changes
    const channel = supabase
      .channel('credits-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'document_usage_log',
        filter: `user_id=eq.${user?.id || ''}`
      }, () => { loadCredits(); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'document_credits',
        filter: `user_id=eq.${user?.id || ''}`
      }, () => { loadCredits(); })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${user?.id || ''}`
      }, (payload) => {
        const newStatus = (payload as any)?.new?.status;
        if (newStatus === 'completed') {
          loadCredits();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const navigationItems = [
    {
      label: 'Document Library',
      icon: FileText,
      href: '/app/documents'
    }
  ];

  // B2C: hide org/platform admin items
  const adminItems: { label: string; icon: any; href: string }[] = [];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const createNewChat = async () => {
    // Navigate to chat with replace to clear any existing session state
    navigate('/app/chat', { replace: true });
  };

  const navigateToSession = (sessionId: string) => {
    navigate(`/app/chat?session=${sessionId}`);
  };

  const submitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      toast({ title: 'Feedback required', description: 'Please share a bit about your feedback.', variant: 'destructive' });
      return;
    }
    try {
      setSendingFeedback(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(functionUrl('send-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: feedbackCategory,
          message: feedbackMessage,
          email: feedbackEmail || user?.email,
          user_id: user?.id,
          path: window.location.pathname + window.location.search
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Thank you!', description: 'Your feedback has been sent.' });
      setFeedbackMessage('');
      setFeedbackOpen(false);
    } catch (e) {
      toast({ title: 'Failed to send feedback', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setSendingFeedback(false);
    }
  };

  const submitSupport = async () => {
    if (!supportMessage.trim()) {
      toast({ title: 'Message required', description: 'Please describe the problem.', variant: 'destructive' });
      return;
    }
    try {
      setSendingSupport(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch(functionUrl('send-support'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: supportCategory,
          message: supportMessage,
          email: supportEmail || user?.email,
          user_id: user?.id,
          path: window.location.pathname + window.location.search
        })
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: 'Request sent', description: 'We will get back to you soon.' });
      setSupportMessage('');
      setSupportOpen(false);
    } catch (e) {
      toast({ title: 'Failed to send request', description: 'Please try again later.', variant: 'destructive' });
    } finally {
      setSendingSupport(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Delete associated messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      // Then delete the session
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      // Update local state
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If we're currently viewing this session, redirect to new chat
      const urlParams = new URLSearchParams(window.location.search);
      const currentSessionId = urlParams.get('session');
      if (currentSessionId === sessionId) {
        navigate('/app/chat');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const startEditingSession = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(sessionId);
    setEditingTitle(currentTitle);
  };

  const saveSessionTitle = async (sessionId: string) => {
    if (!editingTitle.trim()) return;
    
    try {
      await supabase
        .from('chat_sessions')
        .update({ title: editingTitle.trim(), updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title: editingTitle.trim(), updated_at: new Date().toISOString() }
            : session
        )
      );
      
      setEditingSession(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const cancelEditingSession = () => {
    setEditingSession(null);
    setEditingTitle('');
  };

  const getDocumentName = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc?.filename || 'Unknown Document';
  };

  const displayedSessions = showAllSessions ? chatSessions : chatSessions.slice(0, 5);
  const isOnChatPage = location.pathname === '/app/chat';

  return (
    <>
      {/* Mobile Overlay - Only show when sidebar is open on mobile */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        // Desktop behavior
        !isMobile && (collapsed ? "w-16" : "w-64"),
        // Mobile behavior - always full width when open, hidden when closed
        isMobile && (collapsed ? "w-0 -translate-x-full" : "w-80"),
        // Mobile positioning
        isMobile && "fixed left-0 top-0 z-50 h-full shadow-2xl"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center justify-center">
              <img
                src={resolvedTheme === 'dark' 
                  ? "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt%20icon%20-%20dark.png"
                  : "https://api.fineprnt.com/storage/v1/object/public/website/Fineprnt%20icon%20-%20light.png"
                }
                alt="Fineprnt"
                className="h-10 w-auto"
                loading="eager"
                decoding="async"
              />
            </div>
          )}
          
          {/* Single toggle button - only show when not collapsed on mobile */}
          {(!collapsed || !isMobile) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {isMobile ? <X size={16} /> : (collapsed ? <Menu size={16} /> : <Menu size={16} />)}
            </Button>
          )}
        </div>

        {/* Mobile Hamburger Menu Icon - Only show when collapsed on mobile */}
        {isMobile && collapsed && (
          <div 
            className="fixed top-20 left-4 z-[9999] md:hidden"
            style={{
              position: 'fixed',
              top: '5rem',
              left: '1rem',
              zIndex: 9999,
              pointerEvents: 'auto'
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hamburger menu clicked!');
                console.log('Current collapsed state:', collapsed);
                console.log('Calling onToggle...');
                onToggle();
              }}
              className="h-12 w-12 bg-sidebar border-2 border-sidebar-border shadow-xl hover:bg-sidebar-accent rounded-lg flex items-center justify-center cursor-pointer"
              style={{ 
                minWidth: '48px',
                minHeight: '48px',
                touchAction: 'manipulation'
              }}
            >
              <Menu size={24} />
            </button>
          </div>
        )}

        {/* Navigation Content - Only render when not collapsed on mobile */}
        {(!isMobile || !collapsed) && (
          <>
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-2">
              {/* New Chat Button */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-sidebar-border bg-sidebar-accent/50",
                    collapsed ? "px-2" : "px-3"
                  )}
                  onClick={createNewChat}
                >
                  <PenSquare size={16} className={collapsed ? "" : "mr-3"} />
                  {!collapsed && "New Chat"}
                </Button>
              </div>

              {/* Chat History */}
              {(isMobile || !collapsed) && chatSessions.length > 0 && (
                <div className="mb-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {displayedSessions.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "group relative rounded-lg p-2 cursor-pointer hover:bg-sidebar-accent transition-colors",
                            isOnChatPage && "bg-sidebar-accent/50"
                          )}
                          onClick={() => navigateToSession(session.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              {editingSession === session.id ? (
                                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="h-6 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveSessionTitle(session.id);
                                      } else if (e.key === 'Escape') {
                                        cancelEditingSession();
                                      }
                                    }}
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                                      onClick={() => saveSessionTitle(session.id)}
                                    >
                                      <Check size={10} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                      onClick={cancelEditingSession}
                                    >
                                      <X size={10} />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {session.title}
                                  </p>
                                  <p className="text-xs text-sidebar-foreground/60 truncate">
                                    {getDocumentName(session.document_id)}
                                  </p>
                                  <p className="text-xs text-sidebar-foreground/40">
                                    {new Date(session.updated_at).toLocaleDateString()}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                                onClick={(e) => startEditingSession(session.id, session.title, e)}
                              >
                                <Edit2 size={12} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-sidebar-foreground/60 hover:text-destructive"
                                onClick={(e) => deleteSession(session.id, e)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {chatSessions.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
                          onClick={() => setShowAllSessions(!showAllSessions)}
                        >
                          {showAllSessions ? 'Show Less' : `Show ${chatSessions.length - 5} More`}
                        </Button>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-sidebar-border my-4" />
                </div>
              )}

              {/* Other Navigation */}
              <nav className="space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed ? "px-2" : "px-3"
                    )}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <item.icon size={16} className={collapsed ? "" : "mr-3"} />
                    {!collapsed && item.label}
                  </Button>
                ))}

                {/* Feedback button */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed ? "px-2" : "px-3"
                  )}
                  onClick={() => {
                    setFeedbackEmail(user?.email || '');
                    setFeedbackOpen(true);
                  }}
                >
                  <MessageSquare size={16} className={collapsed ? '' : 'mr-3'} />
                  {!collapsed && 'Send feedback'}
                </Button>

                {/* Support button */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed ? "px-2" : "px-3"
                  )}
                  onClick={() => {
                    setSupportEmail(user?.email || '');
                    setSupportOpen(true);
                  }}
                >
                  <Shield size={16} className={collapsed ? '' : 'mr-3'} />
                  {!collapsed && 'Get Help'}
                </Button>
              </nav>

              {/* Admin Section */}
              {adminItems.length > 0 && (
                <>
                  <div className="border-t border-sidebar-border my-4" />
                  <nav className="space-y-1">
                    {!collapsed && (
                      <p className="px-3 text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                        Administration
                      </p>
                    )}
                    {adminItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed ? "px-2" : "px-3"
                        )}
                        onClick={() => handleNavigation(item.href)}
                      >
                        <item.icon size={16} className={collapsed ? "" : "mr-3"} />
                        {!collapsed && item.label}
                      </Button>
                    ))}
                  </nav>
                </>
              )}
            </div>

            {/* Theme Toggle and User Menu */}
            <div className="p-2 border-t border-sidebar-border space-y-2">
              {/* Theme Toggle */}
              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme('light')}>
                      <Sun size={16} className="mr-2" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                      <Moon size={16} className="mr-2" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme('system')}>
                      <Monitor size={16} className="mr-2" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* User Menu */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {!collapsed && (
                        <span className="ml-2 text-xs">{user.name.split(' ')[0]}</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {credits && (
                          <p className="text-xs text-muted-foreground">Credits: {credits.available}/{credits.total}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                      Account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        if (subStatus !== 'active') {
                          setShowStartSub(true);
                          return;
                        }
                        // already subscribed: open portal
                        (async () => {
                          try {
                            const token = (await supabase.auth.getSession()).data.session?.access_token;
                            const res = await fetch(functionUrl('stripe-portal'), { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                            const json = await res.json();
                            if (json?.url) window.location.href = json.url;
                          } catch {}
                        })();
                      }}
                    >
                      <CreditCard size={16} className="mr-2" />
                      {subStatus === 'active' ? 'Manage/Upgrade plan' : 'Start subscription'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut size={16} className="mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}
      </div>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share feedback</DialogTitle>
            <DialogDescription>
              Tell us what we can improve. We read every note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(['General','Chat quality','Bug','Idea','Other'] as const).map((c) => (
                <Button key={c} variant={feedbackCategory===c? 'default':'outline'} size="sm" onClick={() => setFeedbackCategory(c)}>
                  {c}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fb-msg">Your feedback</Label>
              <Textarea id="fb-msg" placeholder="What's working well? What could be better?" value={feedbackMessage} onChange={(e)=>setFeedbackMessage(e.target.value)} rows={5} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fb-email">Contact (optional)</Label>
              <Input id="fb-email" type="email" value={feedbackEmail} onChange={(e)=>setFeedbackEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setFeedbackOpen(false)}>Cancel</Button>
              <Button onClick={submitFeedback} disabled={sendingFeedback}>{sendingFeedback ? 'Sending...' : 'Send'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support / Help</DialogTitle>
            <DialogDescription>
              Choose a category and describe what you need help with.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(['Document upload','Processing issues','Billing & credits','Account & login','Chat answers','Feature request','Other'] as const).map((c) => (
                <Button key={c} variant={supportCategory===c? 'default':'outline'} size="sm" onClick={() => setSupportCategory(c)}>
                  {c}
                </Button>
              ))}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sup-msg">Describe the issue</Label>
              <Textarea id="sup-msg" placeholder="What happened? Any steps to reproduce?" value={supportMessage} onChange={(e)=>setSupportMessage(e.target.value)} rows={5} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sup-email">Contact (optional)</Label>
              <Input id="sup-email" type="email" value={supportEmail} onChange={(e)=>setSupportEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=>setSupportOpen(false)}>Cancel</Button>
              <Button onClick={submitSupport} disabled={sendingSupport}>{sendingSupport ? 'Sending...' : 'Send'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <UserProfileDialog 
        open={showProfileDialog} 
        onOpenChange={setShowProfileDialog} 
      />
      <SubscriptionStartDialog open={showStartSub} onOpenChange={setShowStartSub} />
    </>
  );
};
