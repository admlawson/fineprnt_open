// Chat content rendering helpers for AI SDK v5
export function contentToString(content: unknown): string {
  if (content == null) return '';
  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
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

  if (typeof content === 'object' && (content as any).type === 'text' && typeof (content as any).text === 'string') {
    return (content as any).text;
  }

  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}
