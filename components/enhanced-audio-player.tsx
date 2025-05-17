"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, Download, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"

interface EnhancedAudioPlayerProps {
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

export function EnhancedAudioPlayer({
  audioUrl,
  fallbackUrl,
  title = "Generated Audio",
  subtitle = "AI Remix",
  imageUrl,
  onPlaybackComplete,
  onError,
  showWaveform = true,
  autoplay = false,
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState([75])
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const waveformAnimationRef = useRef<number | null>(null)

  // Initialize audio context and nodes
  useEffect(() => {
    setupAudioContext()

    return () => {
      // Clean up resources
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      if (waveformAnimationRef.current) {
        cancelAnimationFrame(waveformAnimationRef.current)
      }
    }
  }, [])

  // Load audio when URL changes
  useEffect(() => {
    if (audioUrl) {
      loadAudio(audioUrl)
    }
  }, [audioUrl])

  // Update volume when slider changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume[0] / 100
    }
  }, [volume])

  const setupAudioContext = () => {
    try {
      // Create audio context if it doesn't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // Create gain node if it doesn't exist
      if (!gainRef.current) {
        gainRef.current = audioContextRef.current.createGain()
        gainRef.current.gain.value = volume[0] / 100
      }

      // Create analyser node if it doesn't exist
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        gainRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      }
    } catch (error) {
      console.error("Error setting up audio context:", error)
      setError(`Error setting up audio: ${error instanceof Error ? error.message : String(error)}`)
      if (onError) onError(new Error("Failed to set up audio context"))
    }
  }

  const connectAudioSource = (audioElement: HTMLAudioElement) => {
    try {
      if (audioContextRef.current) {
        // Disconnect previous source if it exists
        if (sourceRef.current) {
          sourceRef.current.disconnect()
        }

        // Create new source and connect it
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement)
        sourceRef.current.connect(gainRef.current!)

        // Start visualizing if waveform is enabled
        if (showWaveform && canvasRef.current) {
          drawWaveform()
        }
      }
    } catch (error) {
      console.error("Error connecting audio source:", error)
      setError(`Error connecting audio: ${error instanceof Error ? error.message : String(error)}`)
      if (onError) onError(new Error("Failed to connect audio source"))
    }
  }

  const loadAudio = (url: string) => {
    setIsLoading(true)
    setLoadingProgress(0)
    setError(null)
    setUsedFallback(false)

    // Create a new audio element
    const audio = new Audio()

    // Set up event listeners
    audio.addEventListener("canplaythrough", () => {
      setIsLoading(false)
      setLoadingProgress(100)
      audioRef.current = audio

      // Connect to audio context
      try {
        connectAudioSource(audio)

        // Autoplay if enabled
        if (autoplay) {
          handlePlayPause()
        }
      } catch (error) {
        console.error("Error connecting audio:", error)
        setError(`Error connecting audio: ${error instanceof Error ? error.message : String(error)}`)
        if (onError) onError(new Error("Failed to connect audio"))
      }
    })

    audio.addEventListener("progress", () => {
      if (audio.duration > 0) {
        const loadedPercentage =
          audio.buffered.length > 0
            ? Math.round((audio.buffered.end(audio.buffered.length - 1) / audio.duration) * 100)
            : 0
        setLoadingProgress(loadedPercentage)
      }
    })

    audio.addEventListener("timeupdate", () => {
      if (audio.duration > 0) {
        setCurrentTime(audio.currentTime)
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener("durationchange", () => {
      setDuration(audio.duration)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setProgress(100)
      setCurrentTime(audio.duration)
      if (onPlaybackComplete) onPlaybackComplete()
    })

    audio.addEventListener("error", (e) => {
      console.error("Audio error:", e, audio.error)

      // Only try fallback if we haven't already and a fallback URL is provided
      if (!usedFallback && fallbackUrl) {
        console.log("Trying fallback URL:", fallbackUrl)
        setUsedFallback(true)

        toast({
          title: "Using fallback audio",
          description: "The original audio couldn't be loaded. Using a fallback sample instead.",
          variant: "warning",
        })

        loadAudio(fallbackUrl)
      } else {
        setIsLoading(false)
        setError(`Audio error: ${audio.error?.message || "Unknown error"}`)
        if (onError) onError(new Error(`Audio error: ${audio.error?.message || "Unknown error"}`))
      }
    })

    // Start loading the audio
    audio.crossOrigin = "anonymous"
    audio.src = url
    audio.load()
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (waveformAnimationRef.current) {
        cancelAnimationFrame(waveformAnimationRef.current)
        waveformAnimationRef.current = null
      }
    } else {
      // Resume audio context if it was suspended
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume()
      }

      // Reset audio to beginning if it's ended
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0
      }

      // Play audio
      const playPromise = audioRef.current.play()

      // Handle play promise
      playPromise
        .then(() => {
          setIsPlaying(true)
          if (showWaveform && canvasRef.current) {
            drawWaveform()
          }
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
          setError(`Error playing audio: ${error.message}`)
          if (onError) onError(new Error(`Error playing audio: ${error.message}`))
        })
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (!audioRef.current) return

    const newTime = (value[0] / 100) * (audioRef.current.duration || 0)
    audioRef.current.currentTime = newTime
    setProgress(value[0])
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!analyserRef.current || !ctx) return

      waveformAnimationRef.current = requestAnimationFrame(draw)

      analyserRef.current.getByteFrequencyData(dataArray)

      ctx.fillStyle = "rgb(20, 20, 30)"
      ctx.fillRect(0, 0, width, height)

      const barWidth = (width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
        gradient.addColorStop(0, "rgb(0, 215, 255)")
        gradient.addColorStop(1, "rgb(0, 90, 255)")

        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  const handleRetry = () => {
    if (audioUrl) {
      loadAudio(audioUrl)
    }
  }

  const handleDownload = async () => {
    if (!audioRef.current?.src) return

    try {
      const response = await fetch(audioRef.current.src)
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
        title: "Download Failed",
        description: "There was a problem downloading the audio.",
        variant: "destructive",
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
                  <p className="text-gray-300 text-sm">{subtitle}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-cyan-400 hover:bg-gray-800"
                    onClick={handleDownload}
                    disabled={isLoading || !!error}
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
              ) : error ? (
                <div className="bg-red-900/30 border border-red-700 rounded-md p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-200">{error}</p>
                      <Button
                        onClick={handleRetry}
                        size="sm"
                        variant="outline"
                        className="mt-2 text-red-200 border-red-700 hover:bg-red-900/50"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Retry
                      </Button>
                    </div>
                  </div>
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

          {showWaveform && !error && !isLoading && (
            <div className="w-full h-24 bg-gray-950 rounded-md overflow-hidden">
              <canvas ref={canvasRef} width={800} height={100} className="w-full h-full" />
            </div>
          )}
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} preload="metadata" style={{ display: "none" }} />
      </CardContent>
    </Card>
  )
}
