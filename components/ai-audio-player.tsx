"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward, AlertCircle } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { toast } from "@/components/ui/use-toast"

interface AIAudioPlayerProps {
  audioUrl: string
  fallbackUrls?: string[]
  title?: string
  onDownload?: () => void
  showVisualizer?: boolean
  autoPlay?: boolean
  loop?: boolean
  className?: string
  premiumAudio?: boolean
  audioMetadata?: {
    genre?: string
    subgenre?: string
    preset?: string
    bpm?: number
    key?: string
    duration?: number
    peakDb?: number
    format?: string
    quality?: string
    soundElements?: string[]
    referenceArtists?: string[]
  }
}

export function AIAudioPlayer({
  audioUrl,
  fallbackUrls = [],
  title,
  onDownload,
  showVisualizer = true,
  autoPlay = false,
  loop = false,
  className = "",
  premiumAudio = false,
  audioMetadata = {},
}: AIAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [actualAudioUrl, setActualAudioUrl] = useState(audioUrl)

  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const [gainNode, setGainNode] = useState<GainNode | null>(null)

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Use a single AudioContext instance
        if (!window.globalAudioContext) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext
          if (!AudioContext) {
            console.warn("AudioContext not supported in this browser")
            return
          }
          window.globalAudioContext = new AudioContext()
        }

        const context = window.globalAudioContext

        // Resume the context if it's suspended
        if (context.state === "suspended") {
          context.resume().catch(err => {
            console.error("Failed to resume AudioContext:", err)
          })
        }

        // Create analyzer and gain nodes
        const analyser = context.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.8

        const gain = context.createGain()
        gain.gain.value = volume / 100

        setAudioContext(context)
        setAnalyserNode(analyser)
        setGainNode(gain)
        setHasInteracted(true)

        return () => {
          // Disconnect nodes on cleanup
          analyser.disconnect()
          gain.disconnect()
        }
      } catch (error) {
        console.error("Error initializing Web Audio API:", error)
        // Don't set error state here, as we'll fall back to standard HTML5 audio
      }
    }
  }, [])

  // Connect audio element to Web Audio API
  useEffect(() => {
    if (!audioRef.current || !audioContext || !analyserNode || !gainNode) return

    try {
      // Check if the audio element is already connected
      if (!audioRef.current._connected) {
        const source = audioContext.createMediaElementSource(audioRef.current)

        // Create a more sophisticated audio processing chain for premium audio
        if (premiumAudio) {
          // Bass boost for EDM tracks
          const bassBoost = audioContext.createBiquadFilter()
          bassBoost.type = "lowshelf"
          bassBoost.frequency.value = 100
          bassBoost.gain.value = 3.0 // +3dB boost to bass

          // High shelf for crisp highs
          const trebleBoost = audioContext.createBiquadFilter()
          trebleBoost.type = "highshelf"
          trebleBoost.frequency.value = 10000
          trebleBoost.gain.value = 1.5 // +1.5dB boost to highs

          // Stereo widener (simplified implementation)
          const stereoWidener = audioContext.createGain()

          // Advanced compressor for EDM mastering
          const compressor = audioContext.createDynamicsCompressor()
          compressor.threshold.value = -18 // Higher threshold for EDM
          compressor.knee.value = 4 // Harder knee for punchier sound
          compressor.ratio.value = 5 // Moderate compression ratio
          compressor.attack.value = 0.001 // Fast attack for transients
          compressor.release.value = 0.1 // Quick release for pumping effect

          // Limiter for preventing clipping
          const limiter = audioContext.createDynamicsCompressor()
          limiter.threshold.value = -1.5 // Just below 0dB
          limiter.knee.value = 0.0 // Hard knee for true limiting
          limiter.ratio.value = 20.0 // Very high ratio for limiting
          limiter.attack.value = 0.001 // Very fast attack
          limiter.release.value = 0.050 // Fast release

          // Connect the premium audio processing chain
          source.connect(bassBoost)
          bassBoost.connect(trebleBoost)
          trebleBoost.connect(stereoWidener)
          stereoWidener.connect(gainNode)
          gainNode.connect(compressor)
          compressor.connect(limiter)
          limiter.connect(analyserNode)
          analyserNode.connect(audioContext.destination)
        } else {
          // Standard audio processing chain
          // Add a compressor for better audio quality
          const compressor = audioContext.createDynamicsCompressor()
          compressor.threshold.value = -24
          compressor.knee.value = 30
          compressor.ratio.value = 12
          compressor.attack.value = 0.003
          compressor.release.value = 0.25

          // Connect the standard audio processing chain
          source.connect(gainNode)
          gainNode.connect(compressor)
          compressor.connect(analyserNode)
          analyserNode.connect(audioContext.destination)
        }

        // Mark as connected to prevent reconnection
        audioRef.current._connected = true

        // Set initial volume
        gainNode.gain.value = volume / 100
      }
    } catch (error) {
      console.error("Error connecting audio to analyzer:", error)

      // Fallback to standard HTML5 audio
      if (audioRef.current) {
        audioRef.current.volume = volume / 100
      }
    }
  }, [audioRef.current, audioContext, analyserNode, gainNode, actualAudioUrl, premiumAudio])

  // Check if audio can be played and set up alternative if needed
  useEffect(() => {
    if (!audioUrl) return

    const checkAudio = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // First try to fetch the audio file with a HEAD request
        const response = await fetch(audioUrl, { method: 'HEAD' })

        if (response.ok) {
          setActualAudioUrl(audioUrl)
        } else {
          // If HEAD request fails, try fallback URLs if available
          if (fallbackUrls && fallbackUrls.length > 0) {
            console.warn(`Audio URL ${audioUrl} returned ${response.status}. Trying fallback URLs...`)

            // Try each fallback URL until one works
            let fallbackWorked = false

            for (const fallbackUrl of fallbackUrls) {
              try {
                const fallbackResponse = await fetch(fallbackUrl, { method: 'HEAD' })
                if (fallbackResponse.ok) {
                  console.log(`Using fallback URL: ${fallbackUrl}`)
                  setActualAudioUrl(fallbackUrl)
                  fallbackWorked = true
                  break
                }
              } catch (fallbackErr) {
                console.warn(`Fallback URL ${fallbackUrl} failed:`, fallbackErr)
              }
            }

            if (!fallbackWorked) {
              // If all fallbacks fail, try alternative format of original URL
              console.warn("All fallback URLs failed. Trying alternative format...")

              // Try alternative format (e.g., if MP3 fails, try OGG)
              const altUrl = audioUrl.endsWith('.mp3')
                ? audioUrl.replace('.mp3', '.ogg')
                : audioUrl.endsWith('.ogg')
                  ? audioUrl.replace('.ogg', '.mp3')
                  : `${audioUrl}.mp3`

              setActualAudioUrl(altUrl)
            }
          } else {
            // No fallbacks available, try alternative format
            console.warn(`Audio URL ${audioUrl} returned ${response.status}. Trying alternative format...`)

            // Try alternative format (e.g., if MP3 fails, try OGG)
            const altUrl = audioUrl.endsWith('.mp3')
              ? audioUrl.replace('.mp3', '.ogg')
              : audioUrl.endsWith('.ogg')
                ? audioUrl.replace('.ogg', '.mp3')
                : `${audioUrl}.mp3`

            setActualAudioUrl(altUrl)
          }
        }
      } catch (err) {
        console.error("Error checking audio:", err)

        // Try fallback URLs if available
        if (fallbackUrls && fallbackUrls.length > 0) {
          setActualAudioUrl(fallbackUrls[0])
        } else {
          // Still use the original URL, the audio element will handle the error
          setActualAudioUrl(audioUrl)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAudio()
  }, [audioUrl, fallbackUrls])

  // Handle audio metadata loading
  useEffect(() => {
    if (!audioRef.current) return

    const handleLoadedMetadata = () => {
      setDuration(audioRef.current?.duration || 0)
      setIsLoading(false)

      if (autoPlay && hasInteracted) {
        playAudio()
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current?.currentTime || 0)
    }

    const handleError = (e: Event) => {
      console.error("Audio loading error:", e)
      setIsLoading(false)
      setError("Error loading audio. Please try again.")
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)

      if (loop) {
        setTimeout(() => playAudio(), 10)
      }
    }

    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('error', handleError)
    audioRef.current.addEventListener('ended', handleEnded)

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('error', handleError)
        audioRef.current.removeEventListener('ended', handleEnded)
      }
    }
  }, [audioRef.current, autoPlay, loop, hasInteracted])

  // Reset player when audio URL changes
  useEffect(() => {
    if (!audioRef.current || actualAudioUrl === audioRef.current.src) return

    setIsLoading(true)
    setCurrentTime(0)
    setIsPlaying(false)
    setError(null)

    // Update the audio source
    audioRef.current.src = actualAudioUrl
    audioRef.current.load()
  }, [actualAudioUrl])

  // Play audio with proper initialization
  const playAudio = () => {
    if (!audioRef.current) return

    // Initialize audio context on first play
    if (!hasInteracted) {
      setHasInteracted(true)
    }

    // Resume audio context if suspended
    if (audioContext?.state === "suspended") {
      audioContext.resume().catch(err => {
        console.error("Failed to resume AudioContext:", err)
      })
    }

    // Play the audio
    audioRef.current.play().then(() => {
      setIsPlaying(true)
    }).catch(error => {
      console.error("Playback failed:", error)

      if (error.name === "NotAllowedError") {
        toast({
          title: "Autoplay Blocked",
          description: "Your browser blocked autoplay. Please click the play button again.",
          variant: "warning",
        })
      } else {
        setError("Error playing audio. Please try again.")
      }
    })
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      playAudio()
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)

    // Apply volume change
    if (gainNode && audioContext) {
      // Apply an exponential curve for more natural volume control
      const gainValue = newVolume === 0 ? 0 : Math.pow(newVolume / 100, 1.5)
      const time = audioContext.currentTime
      gainNode.gain.setTargetAtTime(gainValue, time, 0.01)
    } else if (audioRef.current) {
      // Fallback to standard HTML5 Audio volume
      audioRef.current.volume = newVolume / 100
    }

    // Update mute state
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    const newMuteState = !isMuted
    setIsMuted(newMuteState)

    if (gainNode && audioContext) {
      // Use Web Audio API for smoother transition
      const time = audioContext.currentTime
      if (newMuteState) {
        gainNode._previousGain = gainNode.gain.value
        gainNode.gain.setTargetAtTime(0, time, 0.01)
      } else {
        const gainValue = gainNode._previousGain || volume / 100
        gainNode.gain.setTargetAtTime(gainValue, time, 0.01)
      }
    } else if (audioRef.current) {
      // Fallback to standard HTML5 Audio
      audioRef.current.volume = newMuteState ? 0 : volume / 100
    }
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return

    const seekTime = (value[0] / 100) * duration
    audioRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const handleSkipBackward = () => {
    if (!audioRef.current) return

    const newTime = Math.max(0, currentTime - 10)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSkipForward = () => {
    if (!audioRef.current) return

    const newTime = Math.min(duration, currentTime + 10)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else if (audioUrl) {
      // Create a download link
      const a = document.createElement("a")
      a.href = audioUrl
      a.download = title ? `${title.replace(/\s+/g, "-").toLowerCase()}.mp3` : "audio.mp3"
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
      }, 100)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`bg-zinc-900/50 rounded-lg p-4 ${className}`}>
      {title && (
        <div className="mb-2 text-sm font-medium text-zinc-200">{title}</div>
      )}

      {showVisualizer && !error && (
        <div className="mb-4">
          <AudioVisualizer
            isPlaying={isPlaying}
            audioFile={{ url: actualAudioUrl }}
            analyserNode={analyserNode}
            currentTime={currentTime}
            duration={duration}
          />
        </div>
      )}

      {/* Premium Audio Metadata Display */}
      {premiumAudio && audioMetadata && Object.keys(audioMetadata).length > 0 && (
        <div className="mb-4 p-2 bg-zinc-800/50 rounded border border-zinc-700/50 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {audioMetadata.preset && (
              <div className="col-span-2 mb-1">
                <span className="font-semibold text-cyan-400">{audioMetadata.preset}</span>
                {audioMetadata.subgenre && (
                  <span className="text-zinc-400"> • {audioMetadata.subgenre}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="text-zinc-500">BPM:</span>
              <span className="text-zinc-300">{audioMetadata.bpm || "—"}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Key:</span>
              <span className="text-zinc-300">{audioMetadata.key || "—"}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Format:</span>
              <span className="text-zinc-300">{audioMetadata.format || "—"}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-zinc-500">Quality:</span>
              <span className="text-zinc-300 capitalize">{audioMetadata.quality || "—"}</span>
            </div>

            {audioMetadata.soundElements && audioMetadata.soundElements.length > 0 && (
              <div className="col-span-2 mt-1">
                <span className="text-zinc-500">Elements: </span>
                <span className="text-zinc-300">{audioMetadata.soundElements.join(", ")}</span>
              </div>
            )}

            {audioMetadata.referenceArtists && audioMetadata.referenceArtists.length > 0 && (
              <div className="col-span-2 mt-1">
                <span className="text-zinc-500">Style: </span>
                <span className="text-zinc-300">{audioMetadata.referenceArtists.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-2">
        <Slider
          value={[progressPercent]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={handleSeek}
          disabled={isLoading || duration === 0}
          className={`cursor-pointer ${premiumAudio ? "bg-cyan-950/30" : ""}`}
        />
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkipBackward}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            className={`${premiumAudio ? "bg-cyan-600 hover:bg-cyan-700" : "bg-purple-600 hover:bg-purple-700"} rounded-full h-10 w-10 flex items-center justify-center`}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkipForward}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <div className="w-20">
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              disabled={isLoading}
              className={premiumAudio ? "bg-cyan-950/30" : ""}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={isLoading}
            className="text-zinc-400 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-2 text-xs"
            size="sm"
          >
            Reload Page
          </Button>
        </div>
      ) : (
        <audio
          ref={audioRef}
          src={actualAudioUrl}
          preload="metadata"
          loop={loop}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      )}
    </div>
  )
}
