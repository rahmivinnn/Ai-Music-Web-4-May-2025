/**
 * Remix utilities for processing audio into EDM tracks
 */

// Define the remix parameters interface
export interface RemixParams {
  file: File | string;
  prompt: string;
  style: string;
  quality: string;
  bpm: number;
  key: string;
}

// Define the remix result interface
export interface RemixResult {
  success: boolean;
  audioUrl?: string;
  fallbackUrls?: string[];
  message?: string;
  error?: string;
  metadata?: {
    genre: string;
    bpm: number;
    key: string;
    duration: number;
    peakDb: number;
    format: string;
    quality: string;
  };
}

// EDM style presets for different sub-genres
export const edmPresets = {
  'future_bass': {
    description: 'Melodic with heavy bass drops and emotional chord progressions',
    artists: ['Illenium', 'Flume', 'San Holo'],
    elements: ['wide supersaws', 'vocal chops', 'sidechained bass', 'trap-influenced beats']
  },
  'progressive_house': {
    description: 'Melodic builds with euphoric drops and clean production',
    artists: ['Martin Garrix', 'Nicky Romero', 'Avicii'],
    elements: ['four-on-floor kicks', 'layered synths', 'melodic leads', 'anthem-like structure']
  },
  'bass_house': {
    description: 'Heavy bass with tech house influences and gritty sound design',
    artists: ['Tchami', 'Malaa', 'JOYRYDE'],
    elements: ['wobble bass', 'tech house percussion', 'vocal samples', 'distorted synths']
  },
  'tropical_house': {
    description: 'Laid-back with tropical percussion and melodic elements',
    artists: ['Kygo', 'Sam Feldt', 'Thomas Jack'],
    elements: ['marimba', 'steel drums', 'organic percussion', 'relaxed tempo', 'acoustic elements']
  },
  'dubstep': {
    description: 'Heavy bass drops with aggressive sound design',
    artists: ['Skrillex', 'Excision', 'Zomboy'],
    elements: ['heavy wobble bass', 'half-time drums', 'metallic sound design', 'aggressive drops']
  }
};

// Generate a detailed prompt based on user input and style
export function generateDetailedPrompt(
  basePrompt: string,
  style: string,
  bpm: number,
  key: string
): string {
  // Get the appropriate EDM sub-genre preset
  const preset = edmPresets[style.toLowerCase().replace(' ', '_')] || edmPresets.progressive_house;
  
  // Build a detailed prompt with technical specifications
  const detailedPrompt = `
Remix this audio into a professional ${style} EDM track with the following specifications:
- BPM: ${bpm}
- Key: ${key}
- Style reference: Similar to artists like ${preset.artists.join(', ')}
- Sound elements: Include ${preset.elements.join(', ')}

Technical requirements:
- Apply sidechain compression to the bass and synths for that pumping effect
- Create a proper intro, build-up, drop, breakdown, and outro structure
- Add professional-grade effects: reverb, delay, and automated filters
- Include risers and downlifters for transitions
- Process vocals with modern techniques: formant shifting, pitch correction, and rhythmic chops
- Master with multiband compression, subtle saturation, and limiting to -1dB peak
- Ensure stereo width while maintaining mono compatibility
- Apply subtle modulation to keep the sound dynamic and interesting

Additional notes:
${basePrompt}

The final result should sound professional, radio-ready, and suitable for club play and streaming platforms.
`;

  return detailedPrompt;
}

// Validate the audio file format and quality
export function validateAudioFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    // Check file type
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
      resolve(false);
      return;
    }
    
    // Check file size (min 500KB, max 50MB)
    if (file.size < 500 * 1024 || file.size > 50 * 1024 * 1024) {
      resolve(false);
      return;
    }
    
    // Create audio element to check if it's playable
    const audio = new Audio();
    audio.oncanplaythrough = () => {
      resolve(true);
      audio.remove();
    };
    
    audio.onerror = () => {
      resolve(false);
      audio.remove();
    };
    
    audio.src = URL.createObjectURL(file);
    audio.load();
    
    // Set a timeout in case the audio never loads
    setTimeout(() => {
      resolve(false);
      audio.remove();
    }, 5000);
  });
}

// Get EDM-specific fallback tracks if the remix fails
export function getEdmFallbackTracks(style: string, bpm: number): string[] {
  // Base fallbacks that work for most EDM styles
  const baseFallbacks = [
    "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
    "https://assets.mixkit.co/music/preview/mixkit-c-major-house-657.mp3",
    "https://assets.mixkit.co/music/preview/mixkit-house-party-hard-beat-11.mp3"
  ];
  
  // Style-specific fallbacks
  const styleFallbacks: Record<string, string[]> = {
    'future_bass': [
      "https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-51.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-driving-ambition-32.mp3"
    ],
    'progressive_house': [
      "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-house-party-hard-beat-11.mp3"
    ],
    'bass_house': [
      "https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-621.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3"
    ],
    'tropical_house': [
      "https://assets.mixkit.co/music/preview/mixkit-beach-party-183.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-summer-fun-13.mp3"
    ],
    'dubstep': [
      "https://assets.mixkit.co/music/preview/mixkit-hip-hop-02-621.mp3",
      "https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3"
    ]
  };
  
  // Get style-specific fallbacks or default to progressive house
  const styleKey = style.toLowerCase().replace(' ', '_');
  const specificFallbacks = styleFallbacks[styleKey] || styleFallbacks.progressive_house;
  
  // Combine and return all fallbacks
  return [...specificFallbacks, ...baseFallbacks];
}
