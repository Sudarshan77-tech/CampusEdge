/**
 * Normalizes a company name for deduplication, fuzzy matching, and searching.
 *
 * Steps:
 * 1. Convert to lowercase.
 * 2. Replace common symbols and punctuation (e.g., '.', ',', '&', '-', '/', '\', etc.) with spaces.
 * 3. Strip legal entity / corporate noise words (e.g. pvt, ltd, private limited, inc, llp, technologies, etc.).
 * 4. Collapse consecutive spaces and trim whitespace.
 */
export function normalizeCompanyName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let cleaned = name.toLowerCase();

  // Replace symbols/punctuation with spaces (keep alphanumeric)
  cleaned = cleaned.replace(/[^a-z0-9]/g, ' ');

  // Common corporate noise suffixes and words to strip
  // Match as distinct words (\b)
  const noiseWords = [
    'private limited',
    'pvt ltd',
    'private ltd',
    'pvt limited',
    'limited',
    'ltd',
    'private',
    'pvt',
    'incorporated',
    'inc',
    'corporation',
    'corp',
    'llp',
    'llc',
    'plc',
    'technologies',
    'technology',
    'tech',
    'solutions',
    'services',
    'software',
    'systems',
    'consulting',
    'group',
    'holdings',
    'co',
    'india',
  ];

  // Pass 1: strip multi-word phrases first, then single-word tokens
  for (const noise of noiseWords) {
    const pattern = new RegExp(`\\b${noise}\\b`, 'gi');
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Collapse multiple whitespaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // If aggressive stripping removed everything (e.g. "Tech Co"), fall back to basic alphanumeric lowercase
  if (!cleaned) {
    cleaned = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return cleaned;
}
