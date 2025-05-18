// Audio-related type definitions

/**
 * Props for the EnhancedAudioPlayer component
 */
export interface AudioPlayerProps {
  /** URL of the audio file to play */
  audioUrl: string

  /** Optional fallback URL if the primary URL fails to load */
  fallbackUrl?: string

  /** Title to display for the audio track */
  title?: string

  /** Subtitle or description for the audio track */
  subtitle?: string

  /** URL of an image to display with the audio player */
  imageUrl?: string

  /** Callback function triggered when playback completes */
  onPlaybackComplete?: () => void

  /** Callback function triggered when an error occurs */
  onError?: (error: Error) => void

  /** Whether to show the audio waveform visualization */
  showWaveform?: boolean

  /** Whether to automatically play the audio when loaded */
  autoplay?: boolean

  /** Type of visualizer to use: 'bars', 'waveform', or 'circle' */
  visualizer?: "bars" | "waveform" | "circle"
}

/**
 * Audio processing options
 */
export interface AudioProcessingOptions {
  /** Gain/volume level from 0 to 1 */
  gain?: number

  /** Reverb level from 0 to 1 */
  reverb?: number

  /** Delay time in seconds */
  delay?: number

  /** Delay feedback amount from 0 to 1 */
  delayFeedback?: number

  /** Low-pass filter cutoff frequency in Hz */
  lowpass?: number

  /** High-pass filter cutoff frequency in Hz */
  highpass?: number
}

/**
 * Audio generation parameters
 */
export interface AudioGenerationParams {
  /** Text prompt for generation */
  prompt: string

  /** Voice type to use */
  voice?: "male" | "female" | "neutral" | "warm" | "deep"

  /** Emotional tone for the voice */
  tone?: "neutral" | "cheerful" | "sad" | "professional" | "excited" | "calm"

  /** Music genre to generate */
  genre?: "none" | "edm" | "ambient" | "rock" | "jazz" | "classical"

  /** Processing options for the generated audio */
  processing?: AudioProcessingOptions
}
