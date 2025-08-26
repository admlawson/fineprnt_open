import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, FileText, Loader2, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SUPABASE_ANON_KEY } from '@/lib/constants';
import { functionUrl } from '@/lib/supabaseEndpoints';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: Date;
};

interface Document {
  id: string;
  filename: string;
  status: string;
  created_at: string;
}

// Enhanced formatter: optimized for two-lane approach with visual distinction
function formatAssistantText(input: string): string {
  if (!input) return '';
  let t = input.trim();

  // Ensure proper spacing around our two-lane headings
  t = t.replace(/^(\s*)### From your document\s*/i, '$1### From your document\n\n');
  t = t.replace(/^(\s*)### Missing or unclear from the document\s*/i, '$1### Missing or unclear from the document\n\n');
  t = t.replace(/^(\s*)### General guidance \(non-document\)\s*/i, '$1### General guidance (non-document)\n\n');
  t = t.replace(/^(\s*)### Where to look in the document\s*/i, '$1### Where to look in the document\n\n');

  // Normalize other potential headings to our format
  t = t.replace(/^(\s*)Answer\s*(?:[—-]\s*)?/i, '$1### From your document\n\n');
  t = t.replace(/\n\s*Citations\s*(?:[—-]\s*)?/i, '\n\n### Where to look in the document\n\n');

  // Ensure bullet points are properly formatted
  t = t.replace(/^(\s*)-(\s)/gm, '$1- $2');
  t = t.replace(/^(\s*)\*(\s)/gm, '$1- $2');

  // Clean up excessive whitespace while preserving structure
  t = t.replace(/\n{3,}/g, '\n\n');
  
  return t;
}

export const Chat: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [contractContext, setContractContext] = useState<string>('auto');

  const { user, session } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // pick up session from URL
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && sessionId !== selectedSession) {
      setSelectedSession(sessionId);
    } else if (!sessionId && selectedSession) {
      setSelectedSession('');
      setSelectedDocument('');
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user's documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, status, created_at')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return;
      }
      setDocuments(data || []);
    };

    fetchDocuments();
  }, [session?.user?.id]);

  // Load session details when session is selected
  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!selectedSession) return;

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('document_id, user_id')
        .eq('id', selectedSession)
        .single();

      if (error || !data || (session?.user?.id && data.user_id !== session.user.id)) {
        console.warn('Session not accessible or not found — starting new chat');
        setSelectedSession('');
        setSelectedDocument('');
        setMessages([]);
        navigate('/app/chat', { replace: true });
        return;
      }

      setSelectedDocument(data.document_id);
    };

    loadSessionDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession]);

  // Load messages when session is selected
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!selectedSession) {
        setMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selectedSession)
        .order('sequence_number', { ascending: true });

      if (error) {
        console.error('Error loading session messages:', error);
        return;
      }

      const loaded: ChatMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: String(msg.content ?? ''),
        createdAt: msg.created_at ? new Date(msg.created_at) : undefined,
      }));

      // Deduplicate consecutive identical assistant messages (often from double-save)
      const deduped: ChatMessage[] = [];
      for (const m of loaded) {
        const prev = deduped[deduped.length - 1];
        if (
          prev &&
          prev.role === 'assistant' &&
          m.role === 'assistant' &&
          prev.content.trim() !== '' &&
          prev.content.trim() === m.content.trim()
        ) {
          continue; // skip duplicate assistant message
        }
        deduped.push(m);
      }

      setMessages(deduped);
    };

    loadSessionMessages();
  }, [selectedSession]);

  // Save message to session (DB)
  const saveMessageToSession = async (sessionId: string, message: { role: 'user' | 'assistant'; content: string }) => {
    try {
      const { data: sessionData } = await supabase
        .from('chat_sessions')
        .select('message_count')
        .eq('id', sessionId)
        .single();

      const sequenceNumber = (sessionData?.message_count || 0) + 1;

      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: message.role,
          content: message.content,
          sequence_number: sequenceNumber,
          metadata: {}
        });

      await supabase
        .from('chat_sessions')
        .update({ 
          message_count: sequenceNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Create new chat session
  const createNewSession = async (firstMessage?: string) => {
    if (!selectedDocument || !session?.user?.id) return null;

    try {
      const title = firstMessage 
        ? generateSessionTitle(firstMessage)
        : 'New Chat';

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: session.user.id,
          document_id: selectedDocument,
          title,
          message_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedSession(data.id);
      setMessages([]);
      
      // Update URL to reflect the session
      window.history.pushState({}, '', `/app/chat?session=${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Error creating new session:', error);
      return null;
    }
  };

  // Generate intelligent session title from first message
  const generateSessionTitle = (message: string): string => {
    const truncated = message.length > 40 
      ? message.substring(0, 40).split(' ').slice(0, -1).join(' ') + '...'
      : message;
    return truncated.replace(/[?!]+$/, '').trim() || 'New Chat';
  };

  const startNewChat = () => {
    setIsStartingNewChat(true);
    setSelectedSession('');
    setSelectedDocument('');
    setMessages([]);
    navigate('/app/chat', { replace: true });
    setTimeout(() => setIsStartingNewChat(false), 100);
  };

  /**
   * Build legacy messages array that the Edge Function expects:
   * [{ role: 'user' | 'assistant', content: string }, ...]
   * Optionally append a new user message at the end.
   */
  const buildLegacyMessages = (appendUserText?: string) => {
    const base = messages
      // ignore any placeholder empty assistant bubble
      .filter(m => !(m.role === 'assistant' && m.content === ''))
      .map(m => ({ role: m.role, content: m.content }));
    if (appendUserText && appendUserText.trim()) {
      base.push({ role: 'user', content: appendUserText.trim() });
    }
    return base;
  };

  // STREAMING CALL DIRECT TO SUPABASE EDGE FUNCTION
  const callEdgeFunctionStream = async (payload: any) => {
    const url = functionUrl('chat_rag');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${session?.access_token ?? ''}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      throw new Error(`Edge function error ${res.status}: ${text}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      full += chunk;

      // Update the last assistant message in place
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx].role === 'assistant') {
          next[lastIdx] = { ...next[lastIdx], content: full };
        }
        return next;
      });
    }

    return full;
  };

  // Submit
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUiError(null);

    const text = inputText.trim();
    if (!text || !selectedDocument || !session) return;

    setIsLoading(true);

    try {
      // ensure session
      let activeSession = selectedSession;
      if (!activeSession) {
        activeSession = await createNewSession(text);
        if (!activeSession) throw new Error('Failed to create session');
      }

      // add user message UI + save
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      await saveMessageToSession(activeSession, { role: 'user', content: text });

      // add placeholder assistant message
      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date() },
      ]);

      // call edge function (stream) — include messages array expected by the function
      const final = await callEdgeFunctionStream({
        document_id: selectedDocument,
        session_id: activeSession,
        messages: buildLegacyMessages(text), // <— IMPORTANT
      });

      // Assistant message is persisted by the Edge Function to avoid duplicates

      setInputText('');
    } catch (err: any) {
      console.error('Chat submit error:', err);
      setUiError(err?.message || 'Unknown error');
      // if we showed an empty assistant bubble, keep it but mark error text
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          next[next.length - 1] = {
            ...last,
            content: 'Sorry—there was a problem generating a response.',
          };
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Suggested question handler
  const handleSuggestedQuestion = async (question: string) => {
    if (!selectedDocument || !session) return;
    setUiError(null);
    setIsLoading(true);

    try {
      let activeSession = selectedSession;
      if (!activeSession) {
        activeSession = await createNewSession(question);
        if (!activeSession) throw new Error('Failed to create session');
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      await saveMessageToSession(activeSession, { role: 'user', content: question });

      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date() },
      ]);

      const final = await callEdgeFunctionStream({
        document_id: selectedDocument,
        session_id: activeSession,
        messages: buildLegacyMessages(question), // <— IMPORTANT
      });

      // Assistant message is persisted by the Edge Function to avoid duplicates
    } catch (err: any) {
      console.error('Suggested question error:', err);
      setUiError(err?.message || 'Unknown error');
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          next[next.length - 1] = {
            ...last,
            content: 'Sorry—there was a problem generating a response.',
          };
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Context-aware suggested questions
  const getSuggestedQuestions = (contractType: string) => {
    const baseQuestions = [
      "What are the key terms of this contract?",
      "What are the payment terms and conditions?",
      "Are there any termination clauses?",
      "What are the main obligations?",
      "What happens if there's a breach?"
    ];
    
    const contractSpecificQuestions: Record<string, string[]> = {
      realestate: [
        "What are the rent payment terms?",
        "What are my responsibilities as a tenant?",
        "What happens if I need to break the lease?",
        "What utilities are included?",
        "What are the security deposit terms?"
      ],
      medical: [
        "What are the compliance requirements?",
        "What are the billing and payment terms?",
        "What are the authorization requirements?",
        "What are the liability limitations?",
        "How is patient privacy protected?"
      ],
      employment: [
        "What is the compensation structure?",
        "What are the work requirements?",
        "Are there non-compete restrictions?",
        "What are the termination terms?",
        "Who owns intellectual property?"
      ],
      financial: [
        "What are the interest rates and fees?",
        "What is the payment schedule?",
        "What are the default consequences?",
        "What collateral is required?",
        "What are the early termination fees?"
      ],
      legal: [
        "What is the governing law?",
        "How are disputes resolved?",
        "What are the liability limitations?",
        "What are the confidentiality terms?",
        "How can the contract be amended?"
      ],
      insurance: [
        "What is covered under this policy?",
        "What are the coverage limits?",
        "How do I file a claim?",
        "What are the premium payment terms?",
        "What are the exclusions?"
      ],
      technology: [
        "What are the license terms?",
        "Who owns the intellectual property?",
        "What are the API usage rights?",
        "How is data protected?",
        "What are the service level requirements?"
      ],
      construction: [
        "What is the project scope?",
        "What are the contractor responsibilities?",
        "How are change orders handled?",
        "What is the payment schedule?",
        "What are the warranty terms?"
      ],
      manufacturing: [
        "What are the quality standards?",
        "What is the delivery schedule?",
        "How is quality inspected?",
        "What are the warranty terms?",
        "What are the supply chain requirements?"
      ],
      transportation: [
        "What are the delivery schedules?",
        "What are the carrier responsibilities?",
        "What insurance is required?",
        "What are the equipment requirements?",
        "How are delays handled?"
      ],
      entertainment: [
        "What rights are being licensed?",
        "What are the royalty terms?",
        "What are the distribution rights?",
        "What are the performance requirements?",
        "What territories are covered?"
      ],
      education: [
        "What is the curriculum content?",
        "What are the accreditation requirements?",
        "What are the tuition terms?",
        "What are the attendance requirements?",
        "How is performance evaluated?"
      ],
      government: [
        "What are the compliance requirements?",
        "What funding is provided?",
        "What reporting is required?",
        "What are the audit requirements?",
        "What are the procurement terms?"
      ],
      nonprofit: [
        "What is the mission alignment?",
        "What funding is provided?",
        "What governance is required?",
        "What reporting is required?",
        "What are the program requirements?"
      ],
      consulting: [
        "What is the scope of work?",
        "What are the fee structures?",
        "What confidentiality is required?",
        "Who owns the intellectual property?",
        "What are the termination terms?"
      ],
      retail: [
        "What inventory is required?",
        "What are the pricing terms?",
        "What are the payment terms?",
        "What are the delivery requirements?",
        "What are the return policies?"
      ],
      hospitality: [
        "What service standards are required?",
        "What facility requirements exist?",
        "What are the booking procedures?",
        "What are the cancellation policies?",
        "What amenities are included?"
      ],
      energy: [
        "What are the consumption requirements?",
        "What are the billing terms?",
        "What service reliability is guaranteed?",
        "What maintenance is required?",
        "What safety standards apply?"
      ],
      telecom: [
        "What service plans are available?",
        "What are the usage limits?",
        "What are the billing terms?",
        "What coverage areas are included?",
        "What equipment is provided?"
      ],
      automotive: [
        "What warranty coverage is provided?",
        "What maintenance is required?",
        "What financing terms are available?",
        "What insurance is required?",
        "What registration is needed?"
      ],
      agriculture: [
        "What crops are covered?",
        "What equipment is required?",
        "What land requirements exist?",
        "What water rights are included?",
        "What are the harvest schedules?"
      ],
      pharmaceutical: [
        "What clinical trials are required?",
        "What regulatory approvals are needed?",
        "What manufacturing standards apply?",
        "What distribution terms exist?",
        "What patent protection is provided?"
      ],
      mining: [
        "What extraction methods are approved?",
        "What equipment is required?",
        "What safety standards apply?",
        "What environmental protections exist?",
        "What royalty terms apply?"
      ],
      aerospace: [
        "What aircraft specifications apply?",
        "What maintenance is required?",
        "What safety standards apply?",
        "What certifications are needed?",
        "What liability coverage exists?"
      ],
      maritime: [
        "What vessel requirements exist?",
        "What cargo handling is required?",
        "What navigation standards apply?",
        "What safety requirements exist?",
        "What insurance is required?"
      ]
    };
    
    return [...baseQuestions, ...(contractSpecificQuestions[contractType] || [])];
  };

  const suggestedQuestions = getSuggestedQuestions(contractContext || 'general');

  return (
    <div className="flex h-full bg-background">
      {/* Main chat area - full width */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg sm:text-xl font-semibold">Contract Chat</h1>
            {selectedSession && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm text-muted-foreground">Active conversation</span>
              </div>
            )}
          </div>
          {selectedDocument && (
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
              <FileText size={16} />
              <span className="truncate max-w-[200px] sm:max-w-none">
                {documents.find(d => d.id === selectedDocument)?.filename}
              </span>
            </div>
          )}
        </div>

        {/* Contract Context Selector */}
        {selectedDocument && (
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Settings size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Contract Type:</span>
                <Select value={contractContext} onValueChange={setContractContext}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select contract type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">🤖 Auto-detect</SelectItem>
                    <SelectItem value="realestate">🏠 Real Estate</SelectItem>
                    <SelectItem value="medical">🏥 Medical/Healthcare</SelectItem>
                    <SelectItem value="legal">⚖️ Legal/Corporate</SelectItem>
                    <SelectItem value="financial">💰 Financial</SelectItem>
                    <SelectItem value="employment">👔 Employment</SelectItem>
                    <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                    <SelectItem value="technology">💻 Technology</SelectItem>
                    <SelectItem value="construction">🏗️ Construction</SelectItem>
                    <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                    <SelectItem value="transportation">🚚 Transportation</SelectItem>
                    <SelectItem value="entertainment">🎭 Entertainment</SelectItem>
                    <SelectItem value="education">🎓 Education</SelectItem>
                    <SelectItem value="government">🏛️ Government</SelectItem>
                    <SelectItem value="nonprofit">🤝 Non-Profit</SelectItem>
                    <SelectItem value="consulting">💼 Consulting</SelectItem>
                    <SelectItem value="retail">🛍️ Retail</SelectItem>
                    <SelectItem value="hospitality">🏨 Hospitality</SelectItem>
                    <SelectItem value="energy">⚡ Energy</SelectItem>
                    <SelectItem value="telecom">📱 Telecommunications</SelectItem>
                    <SelectItem value="automotive">🚗 Automotive</SelectItem>
                    <SelectItem value="agriculture">🌾 Agriculture</SelectItem>
                    <SelectItem value="pharmaceutical">💊 Pharmaceutical</SelectItem>
                    <SelectItem value="mining">⛏️ Mining</SelectItem>
                    <SelectItem value="aerospace">✈️ Aerospace</SelectItem>
                    <SelectItem value="maritime">🚢 Maritime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Two-lane approach info */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Document Facts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>General Guidance</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {!selectedDocument ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Select a Document</h2>
                <p className="text-muted-foreground mb-6">
                  Choose a document to start analyzing contracts
                </p>
              </div>
              
              <Select value={selectedDocument} onValueChange={(value) => {
                setSelectedDocument(value);
                setSelectedSession('');
                setMessages([]);
              }}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="Select a document..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center space-x-2">
                        <FileText size={16} />
                        <span className="truncate">{doc.filename}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
                <p className="text-muted-foreground mb-6">
                  Ask questions about your selected contract
                </p>
                
                {/* Two-lane approach explanation */}
                <Card className="max-w-2xl mx-auto mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg">🤖</span>
                      </div>
                      <h3 className="text-sm font-semibold">How fineprnt Works</h3>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-1 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium text-foreground">Document Facts:</span>
                          <span className="ml-1">Grounded information directly from your contract with citations</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium text-foreground">General Guidance:</span>
                          <span className="ml-1">Helpful context and best practices (not specific to your contract)</span>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full mt-1 flex-shrink-0"></div>
                        <div>
                          <span className="font-medium text-foreground">Missing Info:</span>
                          <span className="ml-1">What we couldn't find in your document</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full h-auto p-4 text-left justify-start whitespace-normal"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="w-8 h-8 bg-primary">
                      <AvatarFallback className="text-primary-foreground text-sm">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <Card className={cn(
                    "max-w-[90%] sm:max-w-[80%] border-0",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <CardContent className="p-3 sm:p-4">
                      {message.role === 'assistant' ? (
                        message.content === '' ? (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing document...</span>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed space-y-3 max-w-[75ch]">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h3: ({ node, ...props }) => {
                                  const text = props.children?.[0] || '';
                                  let className = "text-base font-semibold mt-4 mb-3 pb-2 border-b";
                                  
                                  // Apply specific styling for each lane
                                  if (text.includes('From your document')) {
                                    className += " text-green-700 border-green-200 bg-green-50 px-3 py-2 rounded-t";
                                  } else if (text.includes('Missing or unclear')) {
                                    className += " text-amber-700 border-amber-200 bg-amber-50 px-3 py-2 rounded-t";
                                  } else if (text.includes('General guidance')) {
                                    className += " text-blue-700 border-blue-200 bg-blue-50 px-3 py-2 rounded-t";
                                  } else if (text.includes('Where to look')) {
                                    className += " text-purple-700 border-purple-200 bg-purple-50 px-3 py-2 rounded-t";
                                  }
                                  
                                  return <h3 className={className} {...props} />;
                                },
                                p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-3" {...props} />,
                                li: ({ node, ...props }) => <li className="leading-snug" {...props} />,
                                a: ({ node, ...props }) => <a className="underline underline-offset-2 text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer nofollow" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-200 pl-3 py-2 bg-blue-50 text-blue-900 rounded-r" {...props} />,
                                code: (props) => (
                                  <code className="px-1.5 py-0.5 rounded bg-muted/60 text-sm font-mono" {...props} />
                                ),
                              }}
                            >
                              {formatAssistantText(message.content)}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      )}
                      <p className={cn(
                        "text-xs mt-2 opacity-70",
                        message.role === 'user' ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>

                  {message.role === 'user' && (
                    <Avatar className="w-8 h-8 bg-secondary">
                      <AvatarFallback className="text-secondary-foreground text-sm">
                        {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              

              {uiError && (
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 bg-destructive">
                    <AvatarFallback className="text-destructive-foreground text-sm">
                      <AlertTriangle size={16} />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="border-destructive bg-destructive/10">
                    <CardContent className="p-4">
                      <p className="text-sm text-destructive">
                        Sorry, an error occurred. Please try again.
                        <br />
                        <span className="text-xs opacity-80">({uiError})</span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-3 sm:p-4 border-t border-border">
          <form onSubmit={onSubmit} className="flex space-x-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedDocument 
                  ? "Ask a question about your contract..."
                  : "Select a document first..."
              }
              disabled={!selectedDocument || isLoading}
              className="flex-1 text-sm sm:text-base"
            />
            <Button 
              type="submit" 
              disabled={!inputText.trim() || !selectedDocument || isLoading}
              size="icon"
              className="flex-shrink-0"
            >
              <Send size={16} />
            </Button>
          </form>

          {/* Persistent disclaimer */}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs leading-tight">AI can make mistakes. Fineprnt is not legal advice. Check important info.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
