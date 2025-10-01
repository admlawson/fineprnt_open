// Chat content rendering helpers for AI SDK v5
export function contentToString(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part: unknown) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          if (part.type === 'text' && typeof part.text === 'string') return part.text;
          try {
            return JSON.stringify(part);
          } catch {
            return String(part);
          }
        }
        return String(part);
      })
      .join('');
  }

  if (typeof content === 'object' && content && 'type' in content && 'text' in content && 
      (content as { type: unknown; text: unknown }).type === 'text' && 
      typeof (content as { type: unknown; text: unknown }).text === 'string') {
    return (content as { type: unknown; text: string }).text;
  }

  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}
