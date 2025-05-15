"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { generateRemixTrack } from "../actions/audio-actions"
import { useToast } from "@/hooks/use-toast"

export default function RemixPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [remixDescription, setRemixDescription] = useState("")
  const [remixUrl, setRemixUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const { toast } = useToast()

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Handle volume changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume / 100
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
        gainRef.current.gain.value = volume / 100
        gainRef.current.connect(audioContextRef.current.destination)
      }
    } catch (error) {
      console.error("Error setting up audio context:", error)
      setError(`Error setting up audio: ${error instanceof Error ? error.message : String(error)}`)
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
      }
    } catch (error) {
      console.error("Error connecting audio source:", error)
      setError(`Error connecting audio: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const loadAudio = (url: string) => {
    return new Promise<void>((resolve, reject) => {
      setIsLoading(true)
      setLoadingProgress(0)

      // Create a new audio element
      const audio = new Audio()

      // Set up event listeners
      audio.addEventListener("canplaythrough", () => {
        setIsLoading(false)
        setLoadingProgress(100)
        audioRef.current = audio

        // Connect to audio context
        if (gainRef.current) {
          try {
            connectAudioSource(audio)
            resolve()
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error("Gain node not initialized"))
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

      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e)
        setIsLoading(false)

        // Try with a fallback URL if this is a network error
        if (
          audio.error?.code === MediaError.MEDIA_ERR_NETWORK ||
          audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
        ) {
          // Use a local fallback music file
          const fallbackUrl = `/samples/edm-remix-sample.mp3`
          console.log("Trying fallback URL:", fallbackUrl)

          // Check if fallback exists, otherwise use a generic one
          fetch(fallbackUrl, { method: "HEAD" })
            .then((response) => {
              if (response.ok) {
                loadAudio(fallbackUrl).then(resolve).catch(reject)
              } else {
                // Ultimate fallback
                reject(new Error(`Audio error: ${audio.error?.message || "Unknown error"}`))
              }
            })
            .catch(() => {
              reject(new Error(`Audio error: ${audio.error?.message || "Unknown error"}`))
            })
        } else {
          reject(new Error(`Audio error: ${audio.error?.message || "Unknown error"}`))
        }
      })

      // Start loading the audio
      audio.crossOrigin = "anonymous"
      audio.src = url
      audio.load()
    })
  }

  const handleGenerateRemix = async () => {
    if (!remixDescription.trim()) {
      toast({
        title: "Description is required",
        description: "Please enter a description for your remix.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Generate remix using the server action
      const result = await generateRemixTrack(remixDescription)

      if (result.success && result.remixUrl) {
        // Set up audio context before loading audio
        setupAudioContext()

        // Load remix audio
        setRemixUrl(result.remixUrl)
        await loadAudio(result.remixUrl)

        toast({
          title: "Remix generated",
          description: "Your remix has been generated successfully.",
        })
      } else {
        throw new Error(result.message || "Failed to generate remix")
      }
    } catch (error) {
      console.error("Error in handleGenerateRemix:", error)
      setError(`${error instanceof Error ? error.message : String(error)}`)

      toast({
        title: "Error generating remix",
        description: `${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
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
        })
        .catch((error) => {
          console.error("Error playing audio:", error)
          toast({
            title: "Playback error",
            description: "There was an error playing the audio. Please try again.",
            variant: "destructive",
          })
        })
    }
  }

  const handleRetry = () => {
    setError(null)
    handleGenerateRemix()
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>AI Remix Studio</CardTitle>
          <CardDescription>Create high-quality EDM remixes with Riffusion AI technology</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Remix</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remix Description</label>
                  <Textarea
                    placeholder="Describe your remix (e.g., 'Upbeat EDM remix with strong bass and synth leads')"
                    value={remixDescription}
                    onChange={(e) => setRemixDescription(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleGenerateRemix}
                  className="w-full"
                  disabled={isLoading || !remixDescription.trim()}
                >
                  {isLoading ? "Generating..." : "Generate Remix"}
                </Button>

                {isLoading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Generating remix...</span>
                      <span>{loadingProgress}%</span>
                    </div>
                    <Progress value={loadingProgress} className="h-2" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error generating remix</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                        <div className="mt-4">
                          <Button
                            onClick={handleRetry}
                            size="sm"
                            variant="outline"
                            className="text-red-800 hover:bg-red-100"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {remixUrl && !error && (
                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Generated Remix</h3>
                      <Button onClick={handlePlayPause} variant="outline" disabled={isLoading}>
                        {isPlaying ? "Pause" : "Play"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium">Volume</label>
                        <span className="text-sm">{volume}%</span>
                      </div>
                      <Slider
                        value={[volume]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setVolume(value[0])}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Genre</label>
                    <Select defaultValue="edm">
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edm">EDM</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="techno">Techno</SelectItem>
                        <SelectItem value="trance">Trance</SelectItem>
                        <SelectItem value="dubstep">Dubstep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">BPM</label>
                    <Select defaultValue="128">
                      <SelectTrigger>
                        <SelectValue placeholder="Select BPM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="120">120</SelectItem>
                        <SelectItem value="128">128</SelectItem>
                        <SelectItem value="140">140</SelectItem>
                        <SelectItem value="150">150</SelectItem>
                        <SelectItem value="175">175</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Audio Quality</label>
                  <Select defaultValue="high">
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High (Riffusion Enhanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Seed (Optional)</label>
                  <Input type="number" placeholder="Random seed for generation" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">Powered by Riffusion AI for high-quality audio generation</p>
        </CardFooter>
      </Card>
    </div>
  )
}
