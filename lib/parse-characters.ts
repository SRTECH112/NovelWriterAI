/**
 * Character Canon System
 * Parses character input and extracts canonical full names
 */

export interface CharacterCanon {
  fullName: string;
  shortName?: string;
  description?: string;
}

/**
 * Parse character input text into structured character canon
 * Supports formats:
 * - "Full Name – description"
 * - "Full Name - description"
 * - "Full Name: description"
 * - "Full Name (nickname) – description"
 */
export function parseCharacters(charactersText: string): CharacterCanon[] {
  if (!charactersText?.trim()) return [];

  const lines = charactersText.split('\n').filter(line => line.trim());
  const characters: CharacterCanon[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines or lines that look like headers
    if (!trimmed || trimmed.toLowerCase().startsWith('character')) continue;

    // Try to extract character name and description
    // Patterns: "Name – desc", "Name - desc", "Name: desc", "Name (nickname) – desc"
    const patterns = [
      /^([^–\-:]+?)\s*(?:\(([^)]+)\))?\s*[–\-:]\s*(.+)$/,  // Name (nickname) – description
      /^([^–\-:]+?)\s*[–\-:]\s*(.+)$/,                      // Name – description
      /^([A-Z][a-zA-Z\s]+(?:[A-Z][a-zA-Z]+)+)/,             // Just a name (multi-word with capitals)
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const fullName = match[1].trim();
        const nickname = match[2]?.trim();
        const description = match[3]?.trim() || match[2]?.trim();

        // Validate full name has at least 2 words (first + last name minimum)
        const nameParts = fullName.split(/\s+/);
        if (nameParts.length >= 2) {
          characters.push({
            fullName,
            shortName: nickname || nameParts[0], // Default to first name if no nickname
            description,
          });
          matched = true;
          break;
        }
      }
    }

    // If no pattern matched but line looks like a name, try to extract it
    if (!matched && /^[A-Z]/.test(trimmed)) {
      const words = trimmed.split(/\s+/);
      if (words.length >= 2) {
        // Take first 3-4 words as potential full name
        const potentialName = words.slice(0, Math.min(4, words.length)).join(' ');
        if (/^[A-Z][a-zA-Z\s]+$/.test(potentialName)) {
          characters.push({
            fullName: potentialName,
            shortName: words[0],
          });
        }
      }
    }
  }

  return characters;
}

/**
 * Format character canon for AI prompt
 */
export function formatCharacterCanonForAI(characters: CharacterCanon[]): string {
  if (!characters.length) return '';

  const lines = characters.map(char => {
    const parts = [`**${char.fullName}**`];
    if (char.shortName && char.shortName !== char.fullName.split(' ')[0]) {
      parts.push(`(nickname: "${char.shortName}")`);
    }
    if (char.description) {
      parts.push(`— ${char.description}`);
    }
    return parts.join(' ');
  });

  return `
🚨 CHARACTER CANON (IMMUTABLE) 🚨
The following character names are CANONICAL and MUST be used exactly as written:

${lines.join('\n')}

NAMING RULES (MANDATORY):
✅ First mention: Use FULL NAME exactly as shown above
✅ Subsequent mentions: Use short name/nickname if provided, otherwise first name only
❌ NEVER alter, shorten, or change surnames
❌ NEVER invent new surnames or middle names
❌ NEVER use common name substitutions

Example:
- First mention: "Kate Andrea Clauzure walked into the room."
- Later: "Kate smiled." (using short name)
- WRONG: "Kate Reyes" or "Kate A." or "K. Clauzure"
`;
}
