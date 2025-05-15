"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward } from "lucide-react"
import { AudioVisualizer } from "@/components/audio-visualizer"

interface AIAudioPlayerProps {
  audioUrl: string
  title?: string
  onDownload?: () => void
  showVisualizer?: boolean
  autoPlay?: boolean
  loop?: boolean
  className?: string
}

export function AIAudioPlayer({
  audioUrl,
  title,
  onDownload,
  showVisualizer = true,
  autoPlay = false,
  loop = false,
  className = "",
}: AIAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
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
          window.globalAudioContext = new AudioContext()
        }
        
        const context = window.globalAudioContext
        
        // Resume the context if it's suspended
        if (context.state === "suspended") {
          context.resume()
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
        
        return () => {
          // Disconnect nodes on cleanup
          analyser.disconnect()
          gain.disconnect()
        }
      } catch (error) {
        console.error("Error initializing Web Audio API:", error)
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
        
        // Add a compressor for better audio quality
        const compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -24
        compressor.knee.value = 30
        compressor.ratio.value = 12
        compressor.attack.value = 0.003
        compressor.release.value = 0.25
        
        // Connect the audio processing chain
        source.connect(gainNode)
        gainNode.connect(compressor)
        compressor.connect(analyserNode)
        analyserNode.connect(audioContext.destination)
        
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
  }, [audioRef.current, audioContext, analyserNode, gainNode, audioUrl])

  // Handle audio metadata loading
  useEffect(() => {
    if (!audioRef.current) return
    
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current?.duration || 0)
      setIsLoading(false)
      
      if (autoPlay) {
        audioRef.current?.play().catch(error => {
          console.error("Autoplay failed:", error)
        })
      }
    }
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current?.currentTime || 0)
    }
    
    const handleError = (e: ErrorEvent) => {
      console.error("Audio loading error:", e)
      setIsLoading(false)
    }
    
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('error', handleError as EventListener)
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('error', handleError as EventListener)
      }
    }
  }, [audioRef.current, autoPlay, audioUrl])

  // Reset player when audio URL changes
  useEffect(() => {
    setIsLoading(true)
    setCurrentTime(0)
    setIsPlaying(false)
    
    // Small timeout to ensure clean state
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.load()
      }
    }, 50)
  }, [audioUrl])

  const togglePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Resume audio context if it's suspended
      if (audioContext?.state === "suspended") {
        audioContext.resume().catch(err => {
          console.error("Failed to resume AudioContext:", err)
        })
      }
      
      // Add a small delay to ensure the context is resumed
      setTimeout(() => {
        audioRef.current?.play().then(() => {
          setIsPlaying(true)
        }).catch(error => {
          console.error("Playback failed:", error)
        })
      }, 100)
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
      
      {showVisualizer && (
        <div className="mb-4">
          <AudioVisualizer
            isPlaying={isPlaying}
            audioFile={{ url: audioUrl }}
            analyserNode={analyserNode}
            currentTime={currentTime}
            duration={duration}
          />
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
          className="cursor-pointer"
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
            className="bg-purple-600 hover:bg-purple-700 rounded-full h-10 w-10 flex items-center justify-center"
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
      
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        loop={loop}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />
    </div>
  )
}
