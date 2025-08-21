import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ChatSession {
  id: string;
  title: string;
  document_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export const useChatSessions = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
      
      setChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, title, updated_at: new Date().toISOString() }
            : session
        )
      );
    } catch (error) {
      console.error('Error updating session title:', error);
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Delete messages first
      await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionId);

      // Then delete session
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSessions();

    // Set up real-time subscription
    const channel = supabase
      .channel('chat-sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_sessions',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.organizationId]);

  return {
    chatSessions,
    loading,
    refetchSessions: fetchSessions,
    updateSessionTitle,
    deleteSession
  };
};