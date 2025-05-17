"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

interface RemixAudioPlayerProps {
  audioUrl: string
  fallbackUrl?: string
  title?: string
  subtitle?: string
  imageUrl?: string
  onPlaybackComplete?: () => void
  onError?: (error: Error) => void
  showWaveform?: boolean
  autoplay?: boolean
}

export function RemixAudioPlayer({
  audioUrl,
  fallbackUrl,
  title = "Generated Remix",
  subtitle = "AI Remix",
  imageUrl,
  onPlaybackComplete,
  onError,
  showWaveform = true,
  autoplay = false,
}: RemixAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState([75])
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [audioSource, setAudioSource] = useState<string>(audioUrl)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio context and nodes
  useEffect(() => {
    // Create a simple audio element for initial testing
    const audioElement = new Audio()
    audioElementRef.current = audioElement

    return () => {
      // Clean up resources
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current.src = ""
        audioElementRef.current.remove()
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Load audio when URL changes or on retry
  useEffect(() => {
    if (audioUrl) {
      setAudioSource(audioUrl)
      loadAudioWithSimplePlayer(audioUrl)
    }
  }, [audioUrl, retryCount])

  // Update volume when slider changes
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume[0] / 100
    }
  }, [volume])

  const loadAudioWithSimplePlayer = (url: string) => {
    setIsLoading(true)
    setLoadingProgress(0)
    setError(null)

    if (!usedFallback) {
      console.log("Loading audio from:", url)
    }

    // Clean up previous audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.removeAttribute("src")
      audioElementRef.current.load()
    }

    // Create a new audio element
    const audio = new Audio()
    audio.crossOrigin = "anonymous"

    // Set up event listeners
    audio.addEventListener("canplaythrough", () => {
      setIsLoading(false)
      setLoadingProgress(100)
      audioElementRef.current = audio

      // Autoplay if enabled
      if (autoplay) {
        handlePlayPause()
      }
    })

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration)
    })

    audio.addEventListener("timeupdate", () => {
      if (audio.duration > 0) {
        setCurrentTime(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setProgress(100)
      setCurrentTime(audio.duration)
      if (onPlaybackComplete) onPlaybackComplete()
    })

    audio.addEventListener("error", (e) => {
      console.error("Audio error:", e, audio.error)

      // Try fallback if we haven't already and a fallback URL is provided
      if (!usedFallback && fallbackUrl) {
        console.log("Error loading audio, trying fallback URL:", fallbackUrl)
        setUsedFallback(true)
        setAudioSource(fallbackUrl)

        toast({
          title: "Using local audio sample",
          description: "The generated audio couldn't be loaded. Using a local sample instead.",
          variant: "default",
        })

        loadAudioWithSimplePlayer(fallbackUrl)
      } else {
        setIsLoading(false)
        // Don't show error message to user, just log it
        console.error(`Audio error: ${audio.error?.message || "Unknown error"}`)

        // If we're already using fallback and still getting errors, try the embedded sample
        if (usedFallback) {
          const embeddedSample = "/samples/edm-remix-sample.mp3"
          console.log("Fallback also failed, using embedded sample:", embeddedSample)
          setAudioSource(embeddedSample)
          loadAudioWithSimplePlayer(embeddedSample)
        }
      }
    })

    // Start loading the audio
    audio.preload = "auto"
    audio.src = url
    audio.load()
  }

  const handlePlayPause = () => {
    if (!audioElementRef.current) return

    if (isPlaying) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    } else {
      // Play audio with error handling
      const playPromise = audioElementRef.current.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch((error) => {
            console.error("Error playing audio:", error)

            // Handle autoplay policy restrictions
            if (error.name === "NotAllowedError") {
              toast({
                title: "Playback blocked",
                description: "Please interact with the page first to enable audio playback.",
                variant: "default",
              })
            } else {
              // Try fallback for other errors
              if (!usedFallback && fallbackUrl) {
                setUsedFallback(true)
                setAudioSource(fallbackUrl)
                loadAudioWithSimplePlayer(fallbackUrl)

                // Try playing again after loading fallback
                setTimeout(() => {
                  if (audioElementRef.current) {
                    audioElementRef.current
                      .play()
                      .then(() => setIsPlaying(true))
                      .catch(console.error)
                  }
                }, 1000)
              }
            }
          })
      }
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (!audioElementRef.current) return

    const newTime = (value[0] / 100) * (audioElementRef.current.duration || 0)
    audioElementRef.current.currentTime = newTime
    setProgress(value[0])
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setUsedFallback(false)
    setError(null)

    if (audioUrl) {
      setAudioSource(audioUrl)
      loadAudioWithSimplePlayer(audioUrl)
    }
  }

  const handleDownload = async () => {
    try {
      // Always download from the current audio source
      const response = await fetch(audioSource)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.mp3`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      toast({
        title: "Download Started",
        description: "Your audio is downloading...",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Available",
        description: "Right-click on the player and select 'Save Audio As...'",
        variant: "default",
      })
    }
  }

  // Fallback image handling
  const [imgError, setImgError] = useState(false)
  const handleImageError = () => setImgError(true)

  return (
    <Card className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none shadow-xl">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
              <img
                src={
                  imgError
                    ? "/placeholder.svg?height=80&width=80&query=music visualization"
                    : imageUrl || "/placeholder.svg?height=80&width=80&query=edm music"
                }
                alt={title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>

            <div className="flex-grow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                <div>
                  <h3 className="font-bold text-lg">{title}</h3>
                  <p className="text-gray-300 text-sm">
                    {subtitle} {usedFallback && "(Using local sample)"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-cyan-400 hover:bg-gray-800"
                    onClick={handleDownload}
                    disabled={isLoading}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Loading audio...</span>
                    <span>{loadingProgress}%</span>
                  </div>
                  <Progress value={loadingProgress} className="h-2" />
                </div>
              ) : (
                <div className="space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-10">{formatTime(currentTime)}</span>
                    <Slider
                      value={[progress]}
                      min={0}
                      max={100}
                      step={0.1}
                      onValueChange={(value) => handleProgressChange(value)}
                      className="flex-grow"
                    />
                    <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:text-cyan-400 hover:bg-gray-800"
                        onClick={handlePlayPause}
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>

                      {usedFallback && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={handleRetry}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Try Original
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-24">
                      <Volume2 className="h-4 w-4 text-gray-400" />
                      <Slider
                        value={volume}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={setVolume}
                        className="flex-grow"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hidden audio element for direct playback */}
          <audio controls src={audioSource} className="hidden" preload="auto" crossOrigin="anonymous" />
        </div>
      </CardContent>
    </Card>
  )
}
