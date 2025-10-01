// Mock data for when Supabase is paused
// This allows users to explore the app UI without database access

export interface MockDocument {
  id: string;
  filename: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
  status: 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';
}

export interface MockChatSession {
  id: string;
  document_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface MockChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  sequence_number: number;
}

export interface MockProcessingJob {
  id: string;
  document_id: string;
  stage: string;
  status: string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Mock documents
export const mockDocuments: MockDocument[] = [
  {
    id: 'mock-doc-1',
    filename: 'Apartment Lease Agreement.pdf',
    mime_type: 'application/pdf',
    file_size: 2048576, // 2MB
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'completed'
  },
  {
    id: 'mock-doc-2',
    filename: 'Employment Contract.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    file_size: 1536000, // 1.5MB
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    status: 'completed'
  },
  {
    id: 'mock-doc-3',
    filename: 'Medical Bill.jpg',
    mime_type: 'image/jpeg',
    file_size: 1024000, // 1MB
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: 'completed'
  },
  {
    id: 'mock-doc-4',
    filename: 'Subscription Terms.pdf',
    mime_type: 'application/pdf',
    file_size: 512000, // 512KB
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    status: 'completed'
  },
  {
    id: 'mock-doc-5',
    filename: 'Insurance Policy.pdf',
    mime_type: 'application/pdf',
    file_size: 3072000, // 3MB
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    status: 'processing'
  }
];

// Mock chat sessions
export const mockChatSessions: MockChatSession[] = [
  {
    id: 'mock-session-1',
    document_id: 'mock-doc-1',
    title: 'Lease Agreement Questions',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    message_count: 4
  },
  {
    id: 'mock-session-2',
    document_id: 'mock-doc-2',
    title: 'Employment Contract Review',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    message_count: 6
  },
  {
    id: 'mock-session-3',
    document_id: 'mock-doc-3',
    title: 'Medical Bill Analysis',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    message_count: 3
  }
];

// Mock chat messages
export const mockChatMessages: Record<string, MockChatMessage[]> = {
  'mock-session-1': [
    {
      id: 'msg-1-1',
      session_id: 'mock-session-1',
      role: 'user',
      content: 'What are the pet policies in this lease?',
      metadata: {},
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sequence_number: 1
    },
    {
      id: 'msg-1-2',
      session_id: 'mock-session-1',
      role: 'assistant',
      content: 'The lease states: "Tenant may not permit, even temporarily, any pet on the Property (including but not limited to any mammal, reptile, bird, fish, rodent, or insect)" unless otherwise agreed in writing [p3, "9. PETS: A."].',
      metadata: {},
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
      sequence_number: 2
    },
    {
      id: 'msg-1-3',
      session_id: 'mock-session-1',
      role: 'user',
      content: 'When is rent due?',
      metadata: {},
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      sequence_number: 3
    },
    {
      id: 'msg-1-4',
      session_id: 'mock-session-1',
      role: 'assistant',
      content: 'Rent is due on the 1st of each month with a 5-day grace period [p.1].',
      metadata: {},
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 90000).toISOString(),
      sequence_number: 4
    }
  ],
  'mock-session-2': [
    {
      id: 'msg-2-1',
      session_id: 'mock-session-2',
      role: 'user',
      content: 'What does the non-compete clause mean?',
      metadata: {},
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sequence_number: 1
    },
    {
      id: 'msg-2-2',
      session_id: 'mock-session-2',
      role: 'assistant',
      content: 'The non-compete clause restricts you from working for competitors for 12 months within 50 miles of the company location [p.3].',
      metadata: {},
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
      sequence_number: 2
    }
  ],
  'mock-session-3': [
    {
      id: 'msg-3-1',
      session_id: 'mock-session-3',
      role: 'user',
      content: 'What am I being charged for?',
      metadata: {},
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      sequence_number: 1
    },
    {
      id: 'msg-3-2',
      session_id: 'mock-session-3',
      role: 'assistant',
      content: 'You are being charged $125 for an ER facility fee [p.2].',
      metadata: {},
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
      sequence_number: 2
    }
  ]
};

// Mock processing jobs
export const mockProcessingJobs: MockProcessingJob[] = [
  {
    id: 'job-1',
    document_id: 'mock-doc-5',
    stage: 'processing',
    status: 'processing',
    input_data: {},
    output_data: {},
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString() // 35 minutes ago
  }
];

// Mock data service functions
export class MockDataService {
  static async getDocuments(filters?: { status?: string; order?: string }): Promise<{ data: MockDocument[] | null; error: any }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let documents = [...mockDocuments];
    
    if (filters?.status) {
      documents = documents.filter(doc => doc.status === filters.status);
    }
    
    if (filters?.order === 'created_at.desc') {
      documents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return { data: documents, error: null };
  }

  static async getChatSessions(limit?: number): Promise<{ data: MockChatSession[] | null; error: any }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let sessions = [...mockChatSessions];
    sessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    if (limit) {
      sessions = sessions.slice(0, limit);
    }
    
    return { data: sessions, error: null };
  }

  static async getChatMessages(sessionId: string): Promise<{ data: MockChatMessage[] | null; error: any }> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const messages = mockChatMessages[sessionId] || [];
    messages.sort((a, b) => a.sequence_number - b.sequence_number);
    
    return { data: messages, error: null };
  }

  static async getProcessingJobs(): Promise<{ data: MockProcessingJob[] | null; error: any }> {
    await new Promise(resolve => setTimeout(resolve, 250));
    return { data: mockProcessingJobs, error: null };
  }

  static async createChatSession(documentId: string, title: string): Promise<{ data: MockChatSession | null; error: any }> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const newSession: MockChatSession = {
      id: `mock-session-${Date.now()}`,
      document_id: documentId,
      title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0
    };
    
    return { data: newSession, error: null };
  }

  static async sendMessage(sessionId: string, content: string): Promise<{ data: MockChatMessage | null; error: any }> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate AI processing time
    
    const newMessage: MockChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: sessionId,
      role: 'assistant',
      content: 'This is a mock response. The actual AI service is not available in demo mode.',
      metadata: {},
      created_at: new Date().toISOString(),
      sequence_number: (mockChatMessages[sessionId]?.length || 0) + 1
    };
    
    return { data: newMessage, error: null };
  }
}
