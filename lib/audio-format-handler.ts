/**
 * Emergency audio format handler to resolve format incompatibility loops
 */

// Supported audio formats in order of preference
const SUPPORTED_FORMATS = ["mp3", "wav", "aac", "m4a", "ogg"]

// Guaranteed working fallback samples by genre
const FALLBACK_SAMPLES: Record<string, string> = {
  edm: "/samples/edm-remix-sample.mp3",
  house: "/samples/music-cheerful.mp3",
  techno: "/samples/music-professional.mp3",
  trance: "/samples/music-calm.mp3",
  dubstep: "/samples/music-excited.mp3",
  "drum-and-bass": "/samples/music-neutral.mp3",
  default: "/samples/edm-remix-sample.mp3",
}

/**
 * Force a specific audio format for generated content
 * @param url The original URL
 * @param targetFormat The desired format (defaults to mp3)
 * @returns Modified URL with forced format
 */
export function forceAudioFormat(url: string, targetFormat = "mp3"): string {
  if (!url) return ""

  // For API-generated URLs, try to modify the format parameter if present
  if (url.includes("format=")) {
    return url.replace(/format=[^&]+/, `format=${targetFormat}`)
  }

  // For file URLs, replace the extension
  const urlWithoutQuery = url.split("?")[0]
  const urlParts = urlWithoutQuery.split(".")
  const extension = urlParts.pop()

  // If we have a valid extension, replace it
  if (extension && SUPPORTED_FORMATS.includes(extension.toLowerCase())) {
    return `${urlParts.join(".")}.${targetFormat}${url.includes("?") ? url.substring(url.indexOf("?")) : ""}`
  }

  // If no extension found, just append the format
  return `${url}${url.includes("?") ? "&" : "?"}format=${targetFormat}`
}

/**
 * Get guaranteed working fallback URL for a genre
 * @param genre The music genre
 * @returns A guaranteed working fallback URL
 */
export function getGuaranteedFallback(genre = "default"): string {
  return FALLBACK_SAMPLES[genre.toLowerCase()] || FALLBACK_SAMPLES.default
}

/**
 * Emergency audio loader that tries multiple formats
 * @param baseUrl The base URL without format
 * @returns Promise resolving to a working audio URL
 */
export async function emergencyAudioLoader(baseUrl: string): Promise<string> {
  // If it's already a local sample, return it directly
  if (baseUrl.startsWith("/samples/")) {
    return baseUrl
  }

  // Try each format in sequence
  for (const format of SUPPORTED_FORMATS) {
    try {
      const formattedUrl = forceAudioFormat(baseUrl, format)
      const response = await fetch(formattedUrl, { method: "HEAD" })

      if (response.ok) {
        return formattedUrl
      }
    } catch (error) {
      console.warn(`Failed to load ${format} format:`, error)
      // Continue to next format
    }
  }

  // If all formats fail, return the default fallback
  return FALLBACK_SAMPLES.default
}

/**
 * Check if audio URL is actually accessible
 * @param url The audio URL to check
 * @returns Promise resolving to boolean indicating if URL is accessible
 */
export async function isAudioUrlAccessible(url: string): Promise<boolean> {
  try {
    // Try a HEAD request first (faster)
    const headResponse = await fetch(url, { method: "HEAD" })
    if (headResponse.ok) return true

    // If HEAD fails, try a small range GET request
    const rangeResponse = await fetch(url, {
      headers: { Range: "bytes=0-1024" },
    })

    return rangeResponse.ok
  } catch (error) {
    console.error("Error checking audio URL:", error)
    return false
  }
}

/**
 * Create an audio element and test if it can actually play
 * @param url The audio URL to test
 * @returns Promise resolving to boolean indicating if audio can play
 */
export function canAudioPlay(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio()

    // Set up event listeners
    const onCanPlay = () => {
      cleanup()
      resolve(true)
    }

    const onError = () => {
      cleanup()
      resolve(false)
    }

    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      cleanup()
      resolve(false)
    }, 5000)

    // Clean up function
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onCanPlay)
      audio.removeEventListener("error", onError)
      clearTimeout(timeout)
      audio.src = ""
      audio.load()
    }

    // Set up listeners
    audio.addEventListener("canplaythrough", onCanPlay)
    audio.addEventListener("error", onError)

    // Start loading
    audio.src = url
    audio.load()
  })
}
