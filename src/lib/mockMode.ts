// Mock mode utilities - non-destructive approach
// This file provides utilities to check if mock mode is enabled
// without modifying existing Supabase code

export const isMockMode = (): boolean => {
  return import.meta.env.VITE_MOCK_MODE === 'true';
};

// Helper to show mock mode notifications
export const showMockModeNotification = (action: string): string => {
  return `Demo Mode: ${action} is disabled in demo mode.`;
};

// Helper to simulate network delay for realistic mock behavior
export const simulateNetworkDelay = (ms: number = 300): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
