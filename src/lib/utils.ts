import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Domain detection utilities for multi-tenant OAuth
const PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'live.com',
  'msn.com',
  'protonmail.com',
  'yandex.com',
  'mail.com',
  'zoho.com'
]);

export function extractDomainFromEmail(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : '';
}

export function isBusinessDomain(email: string): boolean {
  const domain = extractDomainFromEmail(email);
  return domain.length > 0 && !PERSONAL_DOMAINS.has(domain);
}

export function isPersonalDomain(email: string): boolean {
  const domain = extractDomainFromEmail(email);
  return PERSONAL_DOMAINS.has(domain);
}

export function getOrganizationNameFromDomain(domain: string): string {
  // Convert domain to a user-friendly organization name
  const parts = domain.split('.');
  const mainPart = parts[0];
  
  // Capitalize first letter and handle common patterns
  return mainPart.charAt(0).toUpperCase() + mainPart.slice(1).replace(/[-_]/g, ' ');
}

export function suggestAuthMethod(email: string): 'oauth' | 'email' {
  return isBusinessDomain(email) ? 'oauth' : 'email';
}
