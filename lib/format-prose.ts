/**
 * Format prose text to enforce novel-style formatting rules:
 * - Blank line between every paragraph
 * - Dialogue always starts a new paragraph
 * - No paragraph longer than 4-5 sentences
 * - Wall-of-text prevention
 */

export function formatProse(text: string): string {
  if (!text || text.trim().length === 0) return text;

  // Split into paragraphs (double newline or single newline)
  let paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);

  // Process each paragraph
  const formattedParagraphs: string[] = [];

  for (let para of paragraphs) {
    // Split on single newlines within paragraph
    const lines = para.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
    
    for (let line of lines) {
      // Check if line contains dialogue
      const dialogueMatch = line.match(/"[^"]*"/g);
      
      if (dialogueMatch && dialogueMatch.length > 0) {
        // Split dialogue into separate paragraphs
        const parts = line.split(/("(?:[^"\\]|\\.)*")/);
        
        for (let part of parts) {
          part = part.trim();
          if (part.length === 0) continue;
          
          // If it's dialogue or contains dialogue, make it its own paragraph
          if (part.startsWith('"')) {
            formattedParagraphs.push(part);
          } else {
            // Non-dialogue text - check sentence count
            const sentences = splitIntoSentences(part);
            if (sentences.length > 5) {
              // Split into chunks of max 4-5 sentences
              for (let i = 0; i < sentences.length; i += 4) {
                const chunk = sentences.slice(i, i + 4).join(' ');
                if (chunk.trim().length > 0) {
                  formattedParagraphs.push(chunk.trim());
                }
              }
            } else if (part.trim().length > 0) {
              formattedParagraphs.push(part.trim());
            }
          }
        }
      } else {
        // No dialogue - check sentence count
        const sentences = splitIntoSentences(line);
        
        if (sentences.length > 5) {
          // Split into chunks of max 4-5 sentences
          for (let i = 0; i < sentences.length; i += 4) {
            const chunk = sentences.slice(i, i + 4).join(' ');
            if (chunk.trim().length > 0) {
              formattedParagraphs.push(chunk.trim());
            }
          }
        } else if (line.trim().length > 0) {
          formattedParagraphs.push(line.trim());
        }
      }
    }
  }

  // Join with double newlines (blank line between paragraphs)
  return formattedParagraphs.join('\n\n');
}

/**
 * Split text into sentences (simple heuristic)
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space and capital letter
  // This is a simple heuristic and may not be perfect
  const sentences: string[] = [];
  let current = '';
  
  for (let i = 0; i < text.length; i++) {
    current += text[i];
    
    // Check for sentence ending
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') && 
        i < text.length - 1 && 
        text[i + 1] === ' ' &&
        i < text.length - 2 &&
        /[A-Z]/.test(text[i + 2])) {
      sentences.push(current.trim());
      current = '';
    }
  }
  
  // Add remaining text
  if (current.trim().length > 0) {
    sentences.push(current.trim());
  }
  
  return sentences.filter(s => s.length > 0);
}

/**
 * Validate if text follows formatting rules
 */
export function validateFormatting(text: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for wall of text (no paragraph breaks)
  if (!text.includes('\n\n') && text.length > 500) {
    issues.push('Wall of text detected - no paragraph breaks');
  }
  
  // Check each paragraph
  const paragraphs = text.split(/\n\n+/);
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (para.length === 0) continue;
    
    // Count sentences
    const sentences = splitIntoSentences(para);
    if (sentences.length > 5) {
      issues.push(`Paragraph ${i + 1} has ${sentences.length} sentences (max 5)`);
    }
    
    // Check for dialogue not on its own line
    const dialogueMatches = para.match(/"[^"]*"/g);
    if (dialogueMatches && dialogueMatches.length > 1) {
      // Multiple dialogue quotes in one paragraph - might need splitting
      const hasNonDialogue = para.replace(/"[^"]*"/g, '').trim().length > 20;
      if (hasNonDialogue) {
        issues.push(`Paragraph ${i + 1} mixes dialogue with narrative`);
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}
