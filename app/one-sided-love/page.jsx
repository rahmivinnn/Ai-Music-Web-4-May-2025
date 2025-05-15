"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Download, Volume2, VolumeX } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { generateOneSidedLoveSong } from "../one-sided-love-song"
import { AudioVisualizer } from "@/components/audio-visualizer"

export default function OneSidedLovePage() {
  const [song, setSong] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const [audioContext, setAudioContext] = useState(null)
  const [analyserNode, setAnalyserNode] = useState(null)

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const context = new AudioContext()
        const analyser = context.createAnalyser()
        analyser.fftSize = 256

        setAudioContext(context)
        setAnalyserNode(analyser)

        return () => {
          if (context.state !== "closed") {
            context.close()
          }
        }
      } catch (error) {
        console.error("Error initializing Web Audio API:", error)
      }
    }
  }, [])

  // Generate the song when the page loads
  useEffect(() => {
    // Add a small delay before generating to ensure UI is rendered first
    const timer = setTimeout(() => {
      generateSong()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Update audio time with optimized performance
  useEffect(() => {
    if (!audioRef.current) return

    // Use timeupdate event instead of requestAnimationFrame for better performance
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime)
    }

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [audioRef.current])

  // Connect audio element to Web Audio API
  useEffect(() => {
    if (audioRef.current && audioContext && analyserNode && song) {
      try {
        const source = audioContext.createMediaElementSource(audioRef.current)
        source.connect(analyserNode)
        analyserNode.connect(audioContext.destination)
      } catch (error) {
        // This error might occur if the source is already connected
        console.error("Error connecting audio to analyzer:", error)
      }
    }
  }, [audioRef.current, audioContext, analyserNode, song])

  const generateSong = async () => {
    setIsLoading(true)

    try {
      // Start preloading a sample audio to improve perceived performance
      const audioPreload = new Audio("https://cdn.pixabay.com/audio/2022/01/18/audio_d0f6d2e0d7.mp3")
      audioPreload.preload = "auto"

      // Generate the song with optimized function
      const songData = await generateOneSidedLoveSong()

      if (songData.success) {
        setSong(songData)

        // Set duration once audio is loaded
        if (audioRef.current) {
          // Use a promise to handle audio loading
          const setAudioDuration = () => {
            return new Promise((resolve) => {
              if (audioRef.current.readyState >= 2) {
                // Audio metadata is already loaded
                setDuration(audioRef.current.duration)
                resolve()
              } else {
                // Wait for metadata to load
                audioRef.current.onloadedmetadata = () => {
                  setDuration(audioRef.current.duration)
                  resolve()
                }

                // Add a timeout in case metadata loading takes too long
                setTimeout(resolve, 2000)
              }
            })
          }

          await setAudioDuration()
        }

        // Show success message
        if (songData.fallback) {
          toast({
            title: "Song Generated (Fallback)",
            description: "Using a sample track due to generation issues",
          })
        } else {
          toast({
            title: "Song Generated",
            description: `"${songData.title}" has been created successfully!`,
          })
        }
      } else {
        // Handle generation failure
        toast({
          title: "Generation Failed",
          description: songData.error || "Failed to generate song",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in song generation:", error)

      // Provide a fallback song in case of error
      const fallbackSong = {
        title: "Waiting For Your Love (Fallback)",
        lyrics: "This is a fallback song due to an error in generation...",
        audioUrl: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0f6d2e0d7.mp3",
        details: {
          genre: "pop",
          mood: "sad but catchy",
          bpm: 95,
          key: "A minor",
        },
        success: true,
        fallback: true,
      }

      setSong(fallbackSong)

      toast({
        title: "Using Fallback Song",
        description: "Something went wrong, but we've loaded a sample song for you",
        variant: "warning",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      // Resume audio context if it's suspended (browser autoplay policy)
      if (audioContext?.state === "suspended") {
        audioContext.resume()
      }

      audioRef.current.play().catch(error => {
        console.error("Playback failed:", error)
        toast({
          title: "Playback Error",
          description: "Could not play the audio. Please try again.",
          variant: "destructive",
        })
      })
    }

    setIsPlaying(!isPlaying)
  }

  const handleVolumeChange = (value) => {
    setVolume(value[0])

    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100
    }

    if (value[0] === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = volume / 100
    } else {
      audioRef.current.volume = 0
    }

    setIsMuted(!isMuted)
  }

  const handleDownload = () => {
    if (!song) return

    // Create a download link
    const a = document.createElement("a")
    a.href = song.audioUrl
    a.download = `${song.title.replace(/\s+/g, "-").toLowerCase()}.mp3`
    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
      toast({
        title: "Download Started",
        description: "Your song is downloading...",
      })
    }, 100)
  }

  const formatLyrics = (lyrics) => {
    if (!lyrics) return ""

    return lyrics.split("\n").map((line, index) => (
      <div key={index} className={line.includes("Chorus:") || line.includes("Verse") || line.includes("Bridge:") || line.includes("Outro:")
        ? "font-bold text-cyan-400 mt-4"
        : "text-zinc-300"}>
        {line}
      </div>
    ))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">One-Sided Love Song Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{song ? song.title : "Generating song..."}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSong}
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Regenerate"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {song && (
                <>
                  <div className="mb-6">
                    <AudioVisualizer
                      isPlaying={isPlaying}
                      audioFile={song ? { url: song.audioUrl } : null}
                      analyserNode={analyserNode}
                      currentTime={currentTime}
                      duration={duration}
                    />
                  </div>

                  <div className="flex justify-center items-center gap-4 mb-6">
                    <Button
                      onClick={togglePlayPause}
                      className="bg-purple-600 hover:bg-purple-700 rounded-full h-12 w-12 flex items-center justify-center"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={toggleMute}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <div className="w-24">
                        <Slider
                          value={[volume]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={handleVolumeChange}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDownload}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">Genre</p>
                      <p className="font-medium text-white capitalize">{song.details.genre}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Mood</p>
                      <p className="font-medium text-white">{song.details.mood}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">BPM</p>
                      <p className="font-medium text-white">{song.details.bpm}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Key</p>
                      <p className="font-medium text-white">{song.details.key}</p>
                    </div>
                  </div>
                </>
              )}

              {!song && (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-zinc-400">Generating your one-sided love song...</p>
                    <p className="text-zinc-500 text-sm mt-2">This may take a moment</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-zinc-800 bg-zinc-900/50 h-full">
            <CardHeader>
              <CardTitle>Lyrics</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] overflow-y-auto">
              {song ? (
                <div className="space-y-1 text-sm">
                  {formatLyrics(song.lyrics)}
                </div>
              ) : (
                <div className="text-zinc-500 italic">
                  Lyrics will appear here once the song is generated...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden audio element */}
      {song && (
        <audio
          ref={audioRef}
          src={song.audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          preload="metadata"
        />
      )}

      <Toaster />
    </div>
  )
}
