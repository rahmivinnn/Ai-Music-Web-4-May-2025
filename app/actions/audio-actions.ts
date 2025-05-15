"use server"

import { generateBackgroundMusic, generateRemix, generateSpeechWithMusic } from "@/lib/riffusion-service"

// Riffusion API key
const RIFFUSION_API_KEY = "sk-ebfcc1a7d768b55f533eb6194e07f29b8c257373a7bdfcf634f937a0a5bba274"

// Mapping for sample fallback based on voice and style
const SAMPLE_MAPPING = {
  male: {
    neutral: "/samples/male-neutral-sample.mp3",
    cheerful: "/samples/male-cheerful-sample.mp3",
    sad: "/samples/male-sad-sample.mp3",
    professional: "/samples/male-professional-sample.mp3",
    excited: "/samples/male-excited-sample.mp3",
    calm: "/samples/male-calm-sample.mp3",
  },
  female: {
    neutral: "/samples/female-neutral-sample.mp3",
    cheerful: "/samples/female-cheerful-sample.mp3",
    sad: "/samples/female-sad-sample.mp3",
    professional: "/samples/female-professional-sample.mp3",
    excited: "/samples/female-excited-sample.mp3",
    calm: "/samples/female-calm-sample.mp3",
  },
  robot: {
    neutral: "/samples/neutral-neutral-sample.mp3",
    cheerful: "/samples/neutral-cheerful-sample.mp3",
    sad: "/samples/neutral-sad-sample.mp3",
    professional: "/samples/neutral-professional-sample.mp3",
    excited: "/samples/neutral-excited-sample.mp3",
    calm: "/samples/neutral-calm-sample.mp3",
  },
  deep: {
    neutral: "/samples/deep-neutral-sample.mp3",
    cheerful: "/samples/deep-cheerful-sample.mp3",
    sad: "/samples/deep-sad-sample.mp3",
    professional: "/samples/deep-professional-sample.mp3",
    excited: "/samples/deep-excited-sample.mp3",
    calm: "/samples/deep-calm-sample.mp3",
  },
  neutral: {
    neutral: "/samples/neutral-neutral-sample.mp3",
    cheerful: "/samples/neutral-cheerful-sample.mp3",
    sad: "/samples/neutral-sad-sample.mp3",
    professional: "/samples/neutral-professional-sample.mp3",
    excited: "/samples/neutral-excited-sample.mp3",
    calm: "/samples/neutral-calm-sample.mp3",
  },
  warm: {
    neutral: "/samples/warm-neutral-sample.mp3",
    cheerful: "/samples/warm-cheerful-sample.mp3",
    sad: "/samples/warm-sad-sample.mp3",
    professional: "/samples/warm-professional-sample.mp3",
    excited: "/samples/warm-excited-sample.mp3",
    calm: "/samples/warm-calm-sample.mp3",
  },
}

// Music fallback samples
const MUSIC_FALLBACK = {
  neutral: "/samples/music-neutral.mp3",
  cheerful: "/samples/music-cheerful.mp3",
  sad: "/samples/music-sad.mp3",
  professional: "/samples/music-professional.mp3",
  excited: "/samples/music-excited.mp3",
  calm: "/samples/music-calm.mp3",
}

/**
 * Generate audio using Riffusion API
 */
export async function generateAudio({ prompt, voice = "neutral", style = "neutral" }) {
  try {
    console.log(`[Server] Generating audio with Riffusion: "${prompt}", voice: ${voice}, style: ${style}`)

    // Get fallback sample paths
    const fallbackVoiceSample = SAMPLE_MAPPING[voice]?.[style] || "/samples/sample-neutral.mp3"
    const fallbackMusicSample = MUSIC_FALLBACK[style] || "/samples/music-neutral.mp3"

    try {
      // Generate speech and music using Riffusion
      const { speechUrl, musicUrl } = await generateSpeechWithMusic(prompt, voice, style)

      return {
        audioUrl: speechUrl,
        musicUrl: musicUrl,
        fallbackUrl: fallbackVoiceSample,
        fallbackMusicUrl: fallbackMusicSample,
        success: true,
        prompt,
        voice,
        style,
        isRiffusion: true,
      }
    } catch (error) {
      console.error("Error in Riffusion API:", error)

      // Return fallback samples if API fails
      return {
        audioUrl: null,
        musicUrl: null,
        fallbackUrl: fallbackVoiceSample,
        fallbackMusicUrl: fallbackMusicSample,
        success: false,
        error: error.message || "Failed to generate audio with Riffusion API",
        useFallback: true,
      }
    }
  } catch (error) {
    console.error("Error in audio generation:", error)
    return {
      audioUrl: null,
      musicUrl: null,
      fallbackUrl: "/samples/sample-neutral.mp3",
      fallbackMusicUrl: "/samples/music-neutral.mp3",
      success: false,
      error: error.message || "Failed to generate audio",
      useFallback: true,
    }
  }
}

/**
 * Generate music using Riffusion API
 */
export async function generateMusic({ prompt, genre, bpm, duration = 30 }) {
  console.log(`[Server] Music generation requested with Riffusion: "${prompt}", genre: ${genre}, bpm: ${bpm}`)

  // Fallback samples in case API fails
  const fallbackSamples = {
    electronic: "/samples/music-neutral.mp3",
    house: "/samples/music-cheerful.mp3",
    dubstep: "/samples/music-excited.mp3",
    trance: "/samples/music-calm.mp3",
    hiphop: "/samples/music-professional.mp3",
    rock: "/samples/music-sad.mp3",
    ambient: "/samples/music-calm.mp3",
    jazz: "/samples/music-professional.mp3",
  }

  // Fallback URL based on genre
  const fallbackUrl = fallbackSamples[genre] || "/samples/music-neutral.mp3"

  try {
    // Enhance prompt with genre and BPM information for better results
    const enhancedPrompt = `${genre} music with ${bpm} BPM, ${prompt}, high quality audio`

    // Generate music using Riffusion
    const musicUrl = await generateRemix(enhancedPrompt)

    return {
      audioUrl: musicUrl,
      fallbackUrl,
      success: true,
      genre,
      bpm,
      isRiffusion: true,
    }
  } catch (error) {
    console.error("Error in Riffusion music generation:", error)

    // Fall back to local samples if Riffusion API fails
    console.log(`Falling back to local sample for genre: ${genre}`)

    return {
      audioUrl: null,
      fallbackUrl,
      success: false,
      error: error.message || "Failed to generate music with Riffusion",
      useFallback: true,
    }
  }
}

/**
 * Generate audio with background music
 */
export async function generateAudioWithBackgroundMusic(text: string, voice: string, emotion: string) {
  try {
    console.log(`Generating audio with text: ${text}, voice: ${voice}, emotion: ${emotion}`)

    // Get fallback sample paths
    const fallbackVoiceSample = SAMPLE_MAPPING[voice]?.[emotion] || "/samples/sample-neutral.mp3"
    const fallbackMusicSample = MUSIC_FALLBACK[emotion] || "/samples/music-neutral.mp3"

    try {
      // Generate speech and music using Riffusion
      const { speechUrl, musicUrl } = await generateSpeechWithMusic(text, voice, emotion)

      return {
        voiceAudioUrl: speechUrl,
        musicUrl: musicUrl,
        fallbackVoiceUrl: fallbackVoiceSample,
        fallbackMusicUrl: fallbackMusicSample,
        success: true,
        message: "Audio generated successfully with Riffusion",
      }
    } catch (error) {
      console.error("Error in Riffusion API:", error)

      // Return fallback samples if API fails
      return {
        voiceAudioUrl: null,
        musicUrl: null,
        fallbackVoiceUrl: fallbackVoiceSample,
        fallbackMusicUrl: fallbackMusicSample,
        success: false,
        message: `Error generating audio: ${error instanceof Error ? error.message : String(error)}`,
        useFallback: true,
      }
    }
  } catch (error) {
    console.error("Error generating audio:", error)
    return {
      voiceAudioUrl: null,
      musicUrl: null,
      fallbackVoiceUrl: "/samples/sample-neutral.mp3",
      fallbackMusicUrl: "/samples/music-neutral.mp3",
      success: false,
      message: `Error generating audio: ${error instanceof Error ? error.message : String(error)}`,
      useFallback: true,
    }
  }
}

/**
 * Generate music for a specific mood
 */
export async function generateMusicForMood(mood: string) {
  try {
    console.log(`Generating music for mood: ${mood}`)

    // Generate music using Riffusion
    const musicUrl = await generateBackgroundMusic(mood)

    return {
      musicUrl,
      fallbackUrl: MUSIC_FALLBACK[mood] || "/samples/music-neutral.mp3",
      success: true,
      message: "Music generated successfully with Riffusion",
    }
  } catch (error) {
    console.error("Error generating music:", error)
    return {
      musicUrl: null,
      fallbackUrl: MUSIC_FALLBACK[mood] || "/samples/music-neutral.mp3",
      success: false,
      message: `Error generating music: ${error instanceof Error ? error.message : String(error)}`,
      useFallback: true,
    }
  }
}

/**
 * Generate a remix track
 */
export async function generateRemixTrack(description: string) {
  try {
    console.log(`Generating remix for: ${description}`)

    // Generate remix using Riffusion
    const remixUrl = await generateRemix(description)

    return {
      remixUrl,
      fallbackUrl: "/samples/edm-remix-sample.mp3",
      success: true,
      message: "Remix generated successfully with Riffusion",
    }
  } catch (error) {
    console.error("Error generating remix:", error)
    return {
      remixUrl: null,
      fallbackUrl: "/samples/edm-remix-sample.mp3",
      success: false,
      message: `Error generating remix: ${error instanceof Error ? error.message : String(error)}`,
      useFallback: true,
    }
  }
}
