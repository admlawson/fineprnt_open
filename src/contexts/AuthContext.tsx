import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { extractDomainFromEmail, getOrganizationNameFromDomain } from '@/lib/utils';
import { APP_BASE_URL } from '@/lib/constants';
export type UserRole = 'user';

export interface User {
  id: string;
  email: string;
  // Backward compatibility: keep `name`, but source it from profiles.display_name when available
  name: string;
  displayName: string;
  avatar?: string; // initials fallback
  avatarUrl?: string; // signed URL to avatars bucket
  bio?: string;
  phone?: string;
  title?: string;
  role: UserRole;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'incomplete';
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, companyName?: string) => Promise<void>;
  signInWithAzureAD: (email?: string, customRedirectUrl?: string) => Promise<void>;
  signInWithGoogle: (customRedirectUrl?: string) => Promise<void>;
  checkDomainOrganization: (email: string) => Promise<{ hasOrganization: boolean; adminContact?: any }>;
  resetPassword: (email: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string, type?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile data based on Supabase user
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const buildUser = async (): Promise<User> => {
        // Join with profiles table
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('display_name, avatar_path, bio, phone, title')
          .eq('id', supabaseUser.id)
          .maybeSingle();
        if (profileErr) console.warn('Profile fetch warning:', profileErr.message);

        const displayName = profile?.display_name || supabaseUser.user_metadata?.name || (supabaseUser.email?.split('@')[0] ?? 'User');

        // Signed URL for avatar if present
        let avatarUrl: string | undefined = undefined;
        if (profile?.avatar_path) {
          const { data: signed, error: signErr } = await supabase.storage
            .from('avatars')
            .createSignedUrl(profile.avatar_path, 60 * 60);
          if (!signErr) avatarUrl = signed?.signedUrl;
        }

        // Compute initials fallback
        const initials = displayName
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: displayName, // keep name for BC
          displayName,
          avatar: initials,
          avatarUrl,
          bio: profile?.bio ?? undefined,
          phone: profile?.phone ?? undefined,
          title: profile?.title ?? undefined,
          role: 'user',
        };
      };
      return await buildUser();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Deprecated org logic removed for B2C

  const acceptInvitationsForCurrentUser = async (_supabaseUser: SupabaseUser) => {
    // No-op in B2C
    localStorage.removeItem('inviteToken');
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer to avoid deadlocks and accept invite before fetching profile
          setTimeout(async () => {
            await acceptInvitationsForCurrentUser(session.user);
            const userProfile = await fetchUserProfile(session.user);
            setUser(userProfile);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Accept invite first if present, then fetch profile
        (async () => {
          await acceptInvitationsForCurrentUser(session.user!);
          const userProfile = await fetchUserProfile(session.user!);
          setUser(userProfile);
          setIsLoading(false);
        })();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
    
    // User state will be updated via the auth state change listener
  };

  const checkDomainOrganization = async (_email: string) => ({ hasOrganization: false });

  const signUp = async (email: string, password: string, companyName?: string) => {
    setIsLoading(true);
    const hasInvite = !!localStorage.getItem('inviteToken');
    
    const redirectUrl = `${APP_BASE_URL}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        // B2C: no org metadata required
      }
    });
    
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }

    setIsLoading(false);
    // User will need to verify email before being fully authenticated
  };

  const signInWithAzureAD = async (email?: string, customRedirectUrl?: string) => {
    setIsLoading(true);
    
    const redirectUrl = customRedirectUrl || `${APP_BASE_URL}/app`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: redirectUrl,
        scopes: 'openid profile email',
        ...(email && { queryParams: { login_hint: email } })
      }
    });
    
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
    
    // Loading state will be handled by the auth state change listener
  };

  const signInWithGoogle = async (customRedirectUrl?: string) => {
    setIsLoading(true);
    const redirectUrl = customRedirectUrl || `${APP_BASE_URL}/app`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'openid profile email'
      }
    });
    if (error) {
      setIsLoading(false);
      throw new Error(error.message);
    }
  };


  const resetPassword = async (email: string) => {
    const redirectUrl = `${APP_BASE_URL}/auth/reset`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const sendMagicLink = async (email: string) => {
    const redirectUrl = `${APP_BASE_URL}/app`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const verifyOtp = async (email: string, token: string, type?: string) => {
    // Map to proper Supabase OTP types
    const t = (type || '').toLowerCase();
    const supaType =
      t === 'recovery' || t === 'password_reset' ? 'recovery' :
      t === 'invite' ? 'invite' :
      t === 'email_change' ? 'email_change' :
      'email';

    const { error } = await supabase.auth.verifyOtp({ 
      email, 
      token, 
      type: supaType as any 
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    // User state will be updated via the auth state change listener
  };

  const refreshUserProfile = async () => {
    if (!session?.user) return;
    
    try {
      const userProfile = await fetchUserProfile(session.user);
      setUser(userProfile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      signUp,
      signInWithAzureAD,
      signInWithGoogle,
      checkDomainOrganization,
      resetPassword,
      sendMagicLink,
      verifyOtp,
      logout,
      refreshUserProfile,
      isAuthenticated: !!user && !!session,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
