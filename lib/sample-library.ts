/**
 * Sample library utilities for music generation
 */

/**
 * Select a high-quality sample based on genre and mood
 * @param genre The music genre
 * @param mood The detected mood
 * @param sampleLibrary The sample library to select from
 * @returns URL to the selected sample
 */
export function selectHighQualitySample(
  genre: string, 
  mood: string, 
  sampleLibrary: Record<string, Record<string, string>>
): string {
  // Normalize genre to match our sample categories
  let normalizedGenre = genre.toLowerCase();
  if (normalizedGenre === 'pop' || normalizedGenre === 'popular') {
    normalizedGenre = 'pop';
  } else if (normalizedGenre === 'hip-hop' || normalizedGenre === 'rap' || normalizedGenre === 'trap') {
    normalizedGenre = 'hiphop';
  } else if (normalizedGenre === 'classic' || normalizedGenre === 'orchestra' || normalizedGenre === 'orchestral') {
    normalizedGenre = 'classical';
  } else if (normalizedGenre === 'edm' || normalizedGenre === 'dance' || normalizedGenre === 'techno' || normalizedGenre === 'house') {
    normalizedGenre = 'electronic';
  }
  
  // Get samples for the genre
  const genreSamples = sampleLibrary[normalizedGenre] || sampleLibrary.pop;
  
  // Get sample for the mood, or default if not found
  return genreSamples[mood] || genreSamples.default;
}

/**
 * Get a list of all available samples
 * @param sampleLibrary The sample library
 * @returns Array of all sample URLs
 */
export function getAllSamples(sampleLibrary: Record<string, Record<string, string>>): string[] {
  const samples: string[] = [];
  
  // Iterate through all genres and moods
  Object.values(sampleLibrary).forEach(genreSamples => {
    Object.values(genreSamples).forEach(sample => {
      if (!samples.includes(sample)) {
        samples.push(sample);
      }
    });
  });
  
  return samples;
}

/**
 * Preload audio samples for faster playback
 * @param samples Array of sample URLs to preload
 */
export function preloadSamples(samples: string[]): void {
  if (typeof window === 'undefined') return;
  
  samples.forEach(url => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    
    // Remove the element after preloading to avoid memory leaks
    audio.oncanplaythrough = () => {
      audio.oncanplaythrough = null;
      // Keep the audio object in cache but remove from DOM
      setTimeout(() => audio.remove(), 1000);
    };
    
    // Handle errors silently
    audio.onerror = () => {
      console.warn(`Failed to preload audio: ${url}`);
      audio.remove();
    };
  });
}

/**
 * Get a list of recommended samples based on user preferences
 * @param genre Preferred genre
 * @param mood Preferred mood
 * @param sampleLibrary The sample library
 * @returns Array of recommended sample URLs
 */
export function getRecommendedSamples(
  genre: string,
  mood: string,
  sampleLibrary: Record<string, Record<string, string>>
): string[] {
  const recommendations: string[] = [];
  
  // Get the primary recommendation
  const primarySample = selectHighQualitySample(genre, mood, sampleLibrary);
  recommendations.push(primarySample);
  
  // Get samples from the same genre with different moods
  const normalizedGenre = getNormalizedGenre(genre);
  const genreSamples = sampleLibrary[normalizedGenre] || sampleLibrary.pop;
  
  Object.entries(genreSamples).forEach(([sampleMood, sampleUrl]) => {
    if (sampleMood !== mood && !recommendations.includes(sampleUrl)) {
      recommendations.push(sampleUrl);
    }
  });
  
  // Get samples from different genres with the same mood
  Object.entries(sampleLibrary).forEach(([sampleGenre, moodSamples]) => {
    if (sampleGenre !== normalizedGenre && moodSamples[mood]) {
      const sampleUrl = moodSamples[mood];
      if (!recommendations.includes(sampleUrl)) {
        recommendations.push(sampleUrl);
      }
    }
  });
  
  return recommendations;
}

/**
 * Normalize genre name to match our sample categories
 * @param genre The genre to normalize
 * @returns Normalized genre name
 */
function getNormalizedGenre(genre: string): string {
  const normalizedGenre = genre.toLowerCase();
  if (normalizedGenre === 'pop' || normalizedGenre === 'popular') {
    return 'pop';
  } else if (normalizedGenre === 'hip-hop' || normalizedGenre === 'rap' || normalizedGenre === 'trap') {
    return 'hiphop';
  } else if (normalizedGenre === 'classic' || normalizedGenre === 'orchestra' || normalizedGenre === 'orchestral') {
    return 'classical';
  } else if (normalizedGenre === 'edm' || normalizedGenre === 'dance' || normalizedGenre === 'techno' || normalizedGenre === 'house') {
    return 'electronic';
  }
  return normalizedGenre;
}
