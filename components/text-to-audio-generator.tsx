"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Loader2, Download, Play, Pause, Share2, Volume2, VolumeX } from "lucide-react"
import { fetchAudioFromFlask } from "@/app/actions/text-to-audio-actions"
import { toast } from "@/components/ui/use-toast"

export function TextToAudioGenerator() {
  const [text, setText] = useState("")
  const [voice, setVoice] = useState("female")
  const [effect, setEffect] = useState("none")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<{
    url: string
    text: string
    voice: string
    effect: string
  } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Efek untuk menangani perubahan volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Efek untuk menangani event audio
  useEffect(() => {
    const audioElement = audioRef.current

    if (audioElement) {
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleEnded = () => setIsPlaying(false)
      const handleError = (e: ErrorEvent) => {
        console.error("Audio playback error:", e)
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        })
        setIsPlaying(false)
      }

      audioElement.addEventListener("play", handlePlay)
      audioElement.addEventListener("pause", handlePause)
      audioElement.addEventListener("ended", handleEnded)
      audioElement.addEventListener("error", handleError as EventListener)

      return () => {
        audioElement.removeEventListener("play", handlePlay)
        audioElement.removeEventListener("pause", handlePause)
        audioElement.removeEventListener("ended", handleEnded)
        audioElement.removeEventListener("error", handleError as EventListener)
      }
    }
  }, [])

  // Fungsi untuk menghasilkan audio
  const generateAudio = async () => {
    if (!text.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to generate audio.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Panggil fungsi fetchAudioFromFlask dari server action
      const result = await fetchAudioFromFlask(text, voice, effect)

      if (!result.success) {
        throw new Error(result.error || "Failed to generate audio")
      }

      // Simpan URL audio yang dihasilkan
      setGeneratedAudio({
        url: result.audioUrl,
        text,
        voice,
        effect,
      })

      audioUrlRef.current = result.audioUrl

      toast({
        title: "Audio Generated",
        description: "Your audio has been successfully generated.",
      })
    } catch (error) {
      console.error("Error generating audio:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate audio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Fungsi untuk memutar/pause audio
  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Audio playback failed:", error)
        toast({
          title: "Playback Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        })
      })
    }
  }

  // Fungsi untuk mengubah volume
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  // Fungsi untuk mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Fungsi untuk mengunduh audio
  const downloadAudio = async () => {
    if (!generatedAudio?.url) return

    try {
      // Fetch audio file
      const response = await fetch(generatedAudio.url)
      if (!response.ok) throw new Error("Failed to fetch audio file")

      const blob = await response.blob()

      // Buat URL objek untuk blob
      const url = URL.createObjectURL(blob)

      // Buat elemen anchor untuk download
      const downloadLink = document.createElement("a")
      downloadLink.href = url
      downloadLink.download = `generated-audio-${voice}-${effect}.mp3`
      document.body.appendChild(downloadLink)
      downloadLink.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(url)
      }, 100)

      toast({
        title: "Download Started",
        description: "Your audio file is being downloaded.",
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Failed",
        description: "Failed to download audio file. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fungsi untuk berbagi audio
  const shareAudio = async () => {
    if (!generatedAudio?.url) return

    try {
      // Cek apakah Web Share API tersedia
      if (navigator.share) {
        // Fetch audio file
        const response = await fetch(generatedAudio.url)
        if (!response.ok) throw new Error("Failed to fetch audio file")

        const blob = await response.blob()
        const file = new File([blob], `generated-audio-${voice}-${effect}.mp3`, { type: "audio/mpeg" })

        await navigator.share({
          title: "Generated Audio",
          text: `Audio generated from text: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
          files: [file],
        })

        toast({
          title: "Shared Successfully",
          description: "Your audio has been shared.",
        })
      } else {
        // Fallback jika Web Share API tidak tersedia
        await navigator.clipboard.writeText(
          `Audio generated from text: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
        )

        toast({
          title: "Share Not Available",
          description:
            "Direct sharing is not available on this device. A description has been copied to your clipboard.",
        })
      }
    } catch (error) {
      console.error("Share error:", error)

      // Fallback jika sharing gagal
      try {
        await navigator.clipboard.writeText(
          `Audio generated from text: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
        )

        toast({
          title: "Share Failed",
          description: "Direct sharing failed, but a description has been copied to your clipboard.",
        })
      } catch (clipboardError) {
        toast({
          title: "Share Failed",
          description: "Failed to share audio.",
          variant: "destructive",
        })
      }
    }
  }

  // Efek EDM yang tersedia
  const edmEffects = [
    { id: "none", name: "No Effect" },
    { id: "clean", name: "Clean" },
    { id: "bass-boost", name: "Bass Boost" },
    { id: "reverb", name: "Reverb" },
    { id: "delay", name: "Delay" },
    { id: "filter-sweep", name: "Filter Sweep" },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Text to Audio Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="text">Text Input</TabsTrigger>
              <TabsTrigger value="settings">Voice Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <div className="space-y-4">
                <Textarea
                  id="text-input"
                  placeholder="Enter the text you want to convert to speech..."
                  className="min-h-[200px] resize-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="voice-select">Voice Type</Label>
                    <Select id="voice-select" value={voice} onValueChange={setVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="deep">Deep</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="effect-select">EDM Effect</Label>
                    <Select id="effect-select" value={effect} onValueChange={setEffect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select effect" />
                      </SelectTrigger>
                      <SelectContent>
                        {edmEffects.map((effectOption) => (
                          <SelectItem key={effectOption.id} value={effectOption.id}>
                            {effectOption.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Volume</Label>
                    <span className="text-sm text-gray-500">{volume}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sample Rate</Label>
                  <Select defaultValue="44100">
                    <SelectTrigger>
                      <SelectValue placeholder="Select sample rate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22050">22.05 kHz (Low)</SelectItem>
                      <SelectItem value="44100">44.1 kHz (Standard)</SelectItem>
                      <SelectItem value="48000">48 kHz (High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Audio Format</Label>
                  <Select defaultValue="mp3">
                    <SelectTrigger>
                      <SelectValue placeholder="Select audio format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3</SelectItem>
                      <SelectItem value="wav">WAV</SelectItem>
                      <SelectItem value="ogg">OGG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="w-full flex justify-between items-center">
            <Button
              id="generate-audio-btn"
              onClick={generateAudio}
              disabled={isGenerating || !text.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Audio"
              )}
            </Button>

            {generatedAudio && (
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={togglePlayback}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button id="download-audio-btn" variant="outline" size="icon" onClick={downloadAudio}>
                  <Download className="h-4 w-4" />
                </Button>

                <Button id="share-audio-btn" variant="outline" size="icon" onClick={shareAudio}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {generatedAudio && (
            <div className="w-full pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Generated Audio:</p>
              <audio id="generated-audio" ref={audioRef} src={generatedAudio.url} className="w-full" controls />
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
