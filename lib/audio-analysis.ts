/**
 * Audio analysis utilities for music generation
 */

/**
 * Analyze the mood from a text prompt
 * @param prompt The text prompt to analyze
 * @returns The detected mood
 */
export function analyzeMood(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('sad') || lowerPrompt.includes('melancholic') || 
      lowerPrompt.includes('heartbreak') || lowerPrompt.includes('lonely')) {
    return 'sad';
  }
  
  if (lowerPrompt.includes('happy') || lowerPrompt.includes('upbeat') || 
      lowerPrompt.includes('energetic') || lowerPrompt.includes('cheerful')) {
    return 'upbeat';
  }
  
  if (lowerPrompt.includes('romantic') || lowerPrompt.includes('love') || 
      lowerPrompt.includes('emotional')) {
    return 'romantic';
  }
  
  if (lowerPrompt.includes('chill') || lowerPrompt.includes('relaxed') || 
      lowerPrompt.includes('calm')) {
    return 'chill';
  }
  
  // Default mood based on genre
  return 'default';
}

/**
 * Analyze the style from a text prompt
 * @param prompt The text prompt to analyze
 * @returns Array of detected styles
 */
export function analyzeStyle(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const styles: string[] = [];
  
  if (lowerPrompt.includes('reverb') || lowerPrompt.includes('atmospheric') || 
      lowerPrompt.includes('spacey')) {
    styles.push('reverb');
  }
  
  if (lowerPrompt.includes('acoustic') || lowerPrompt.includes('unplugged')) {
    styles.push('acoustic');
  }
  
  if (lowerPrompt.includes('electronic') || lowerPrompt.includes('synth')) {
    styles.push('electronic');
  }
  
  if (lowerPrompt.includes('orchestral') || lowerPrompt.includes('strings')) {
    styles.push('orchestral');
  }
  
  return styles;
}

/**
 * Determine the musical key based on prompt and genre
 * @param prompt The text prompt
 * @param genre The music genre
 * @returns The musical key
 */
export function determineKey(prompt: string, genre: string): string {
  // Define common keys
  const keys = [
    'C major', 'A minor', 'G major', 'E minor', 
    'D major', 'B minor', 'F major', 'D minor'
  ];
  
  // For sad songs, prefer minor keys
  if (analyzeMood(prompt) === 'sad') {
    return ['A minor', 'E minor', 'D minor', 'B minor'][Math.floor(Math.random() * 4)];
  }
  
  // For upbeat songs, prefer major keys
  if (analyzeMood(prompt) === 'upbeat') {
    return ['C major', 'G major', 'D major', 'F major'][Math.floor(Math.random() * 4)];
  }
  
  // Otherwise, select a random key
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Detect the tempo (BPM) from a text prompt
 * @param prompt The text prompt
 * @returns The detected tempo
 */
export function detectTempo(prompt: string): number {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for explicit BPM mention
  const bpmMatch = lowerPrompt.match(/(\d+)\s*bpm/);
  if (bpmMatch) {
    const bpm = parseInt(bpmMatch[1], 10);
    // Ensure BPM is within reasonable range
    return Math.min(Math.max(bpm, 60), 200);
  }
  
  // Estimate based on descriptive words
  if (lowerPrompt.includes('slow') || lowerPrompt.includes('ballad')) {
    return Math.floor(Math.random() * 20) + 60; // 60-80 BPM
  }
  
  if (lowerPrompt.includes('moderate') || lowerPrompt.includes('medium')) {
    return Math.floor(Math.random() * 20) + 90; // 90-110 BPM
  }
  
  if (lowerPrompt.includes('fast') || lowerPrompt.includes('energetic')) {
    return Math.floor(Math.random() * 20) + 120; // 120-140 BPM
  }
  
  if (lowerPrompt.includes('very fast') || lowerPrompt.includes('dance')) {
    return Math.floor(Math.random() * 40) + 140; // 140-180 BPM
  }
  
  // Default tempo based on genre
  switch (detectGenre(prompt)) {
    case 'hiphop':
      return Math.floor(Math.random() * 20) + 85; // 85-105 BPM
    case 'rock':
      return Math.floor(Math.random() * 20) + 110; // 110-130 BPM
    case 'electronic':
      return Math.floor(Math.random() * 40) + 120; // 120-160 BPM
    case 'classical':
      return Math.floor(Math.random() * 40) + 70; // 70-110 BPM
    default: // pop
      return Math.floor(Math.random() * 20) + 100; // 100-120 BPM
  }
}

/**
 * Detect the genre from a text prompt
 * @param prompt The text prompt
 * @returns The detected genre
 */
export function detectGenre(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('rock') || lowerPrompt.includes('guitar')) {
    return 'rock';
  }
  
  if (lowerPrompt.includes('hip hop') || lowerPrompt.includes('hip-hop') || 
      lowerPrompt.includes('rap') || lowerPrompt.includes('trap')) {
    return 'hiphop';
  }
  
  if (lowerPrompt.includes('electronic') || lowerPrompt.includes('edm') || 
      lowerPrompt.includes('techno') || lowerPrompt.includes('house')) {
    return 'electronic';
  }
  
  if (lowerPrompt.includes('classical') || lowerPrompt.includes('orchestra') || 
      lowerPrompt.includes('piano') || lowerPrompt.includes('strings')) {
    return 'classical';
  }
  
  // Default to pop
  return 'pop';
}
