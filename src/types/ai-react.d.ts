declare module 'ai/react' {
  export const useChat: (options?: {
    api?: string;
    id?: string;
    initialMessages?: Message[];
    onFinish?: (message: Message) => void;
    onError?: (error: Error) => void;
  }) => {
    messages: Message[];
    input: string;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
    error?: Error;
    stop: () => void;
    reload: () => void;
    append: (message: Message) => void;
    setMessages: (messages: Message[]) => void;
  };
  
  export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt?: Date;
  }
}
