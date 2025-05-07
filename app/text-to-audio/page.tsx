"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Download, Share2, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent } from "@/components/ui/card"

export default function TextToAudioPage() {
  // State untuk text-to-audio
  const [text, setText] = useState("")
  const [voice, setVoice] = useState("male")
  const [effect, setEffect] = useState("clean")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const [gainNode, setGainNode] = useState<GainNode | null>(null)
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [currentBpm, setCurrentBpm] = useState(128)
  const [effects, setEffects] = useState({
    bassBoost: 70,
    reverb: 40,
    delay: 20,
    filter: 50,
    wobble: 0,
    distortion: 0,
    pitch: 50,
    speed: 50,
  })

  // Referensi untuk elemen audio dan canvas
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  // Daftar suara
  const voices = [
    { id: "male", name: "Male Voice" },
    { id: "female", name: "Female Voice" },
    { id: "robot", name: "Robot Voice" },
    { id: "deep", name: "Deep Voice" },
  ]

  // Preset efek
  const presets = [
    {
      id: "clean",
      name: "Clean",
      effects: {
        bassBoost: 50,
        reverb: 20,
        delay: 10,
        filter: 80,
        wobble: 0,
        distortion: 0,
        pitch: 50,
        speed: 50,
      },
      bpm: 128,
    },
    {
      id: "dubstep",
      name: "Dubstep",
      effects: {
        bassBoost: 80,
        reverb: 20,
        delay: 15,
        filter: 30,
        wobble: 80,
        distortion: 60,
        pitch: 45,
        speed: 50,
      },
      bpm: 140,
    },
    {
      id: "trance",
      name: "Trance",
      effects: {
        bassBoost: 65,
        reverb: 70,
        delay: 50,
        filter: 60,
        wobble: 0,
        distortion: 0,
        pitch: 55,
        speed: 55,
      },
      bpm: 138,
    },
    {
      id: "house",
      name: "House",
      effects: {
        bassBoost: 70,
        reverb: 40,
        delay: 20,
        filter: 70,
        wobble: 0,
        distortion: 0,
        pitch: 50,
        speed: 50,
      },
      bpm: 124,
    },
  ]

  // Contoh prompt
  const examplePrompts = [
    "Welcome to the ultimate EDM experience",
    "Drop the bass right now",
    "Feel the rhythm, feel the vibe",
    "Let the music take control",
    "This is Composition Converter in the house",
  ]

  // Inisialisasi Web Audio API
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const context = new AudioContext()
        const analyser = context.createAnalyser()
        analyser.fftSize = 256
        const gain = context.createGain()

        gain.connect(context.destination)
        analyser.connect(gain)

        setAudioContext(context)
        setAnalyserNode(analyser)
        setGainNode(gain)

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

  // Connect audio element to Web Audio API when generated
  useEffect(() => {
    if (audioRef.current && audioContext && analyserNode && gainNode && generatedAudio) {
      // Disconnect previous source if exists
      if (audioSource) {
        audioSource.disconnect()
      }

      // Create new source from audio element
      const source = audioContext.createMediaElementSource(audioRef.current)

      // Apply effects
      applyAudioEffects(source)

      setAudioSource(source)
    }

    return () => {
      if (audioSource) {
        audioSource.disconnect()
      }
    }
  }, [generatedAudio, audioContext, analyserNode, gainNode])

  // Visualisasi audio
  useEffect(() => {
    if (!analyserNode || !canvasRef.current || !isPlaying) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!ctx || !analyserNode) return

      analyserNode.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height

        // Gradient based on frequency
        const hue = (i / bufferLength) * 180 + 180 // Cyan to blue range
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyserNode, isPlaying])

  // Apply audio effects to source
  const applyAudioEffects = (source: MediaElementAudioSourceNode) => {
    if (!audioContext || !analyserNode || !gainNode) return

    // Create effect nodes
    const bassBoost = audioContext.createBiquadFilter()
    bassBoost.type = "lowshelf"
    bassBoost.frequency.value = 100
    bassBoost.gain.value = (effects.bassBoost - 50) * 0.5

    const filter = audioContext.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 20000 * (effects.filter / 100)
    filter.Q.value = 1

    const delay = audioContext.createDelay(5.0)
    delay.delayTime.value = (effects.delay / 100) * 0.5

    const delayGain = audioContext.createGain()
    delayGain.gain.value = effects.delay / 200

    const distortion = audioContext.createWaveShaper()
    if (effects.distortion > 0) {
      const curve = createDistortionCurve(effects.distortion * 5)
      distortion.curve = curve
    }

    // Connect nodes
    source.connect(bassBoost)
    bassBoost.connect(filter)
    filter.connect(distortion)

    // Main path
    distortion.connect(analyserNode)

    // Delay path
    distortion.connect(delay)
    delay.connect(delayGain)
    delayGain.connect(analyserNode)

    // Create wobble effect if enabled
    if (effects.wobble > 0) {
      const lfo = audioContext.createOscillator()
      lfo.type = "sine"
      lfo.frequency.value = (currentBpm / 240) * (0.5 + (effects.wobble / 100) * 2)

      const lfoGain = audioContext.createGain()
      lfoGain.gain.value = 500 + (effects.wobble / 100) * 7500

      lfo.connect(lfoGain)
      lfoGain.connect(filter.frequency)
      lfo.start()
    }
  }

  // Create distortion curve
  const createDistortionCurve = (amount: number) => {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
    }

    return curve
  }

  // Mengatur volume saat berubah
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = isMuted ? 0 : volume / 100
    }

    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted, gainNode])

  // Menangani contoh prompt
  const useExamplePrompt = useCallback(
    (prompt: string) => {
      setText(prompt)
    },
    [setText],
  )

  // Menangani perubahan volume
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  // Menangani perubahan efek
  const handleEffectChange = (effect: keyof typeof effects, value: number[]) => {
    setEffects((prev) => ({
      ...prev,
      [effect]: value[0],
    }))
  }

  // Menangani toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Menangani pemutaran/pause
  const togglePlay = () => {
    if (!audioRef.current || !generatedAudio) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Playback failed:", error)
        toast({
          title: "Playback Error",
          description: "Couldn't play the audio. Please try again.",
          variant: "destructive",
        })
      })
    }

    setIsPlaying(!isPlaying)
  }

  // Menangani aplikasi preset
  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)

    if (preset) {
      setActivePreset(preset.name)
      setEffects(preset.effects)
      setCurrentBpm(preset.bpm)

      toast({
        title: "Preset Applied",
        description: `${preset.name} effect has been applied!`,
      })
    }
  }

  // Menangani generasi audio
  const generateAudio = () => {
    if (!text.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter some text to convert to audio.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Simulasi proses generasi
    setTimeout(() => {
      // Pilih sample audio berdasarkan voice dan effect
      let audioSample

      switch (voice) {
        case "female":
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
          break
        case "robot":
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
          break
        case "deep":
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
          break
        default:
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      }

      setGeneratedAudio(audioSample)
      setIsGenerating(false)

      toast({
        title: "Audio Generated",
        description: "Your text has been converted to audio!",
      })

      // Auto-play setelah generate
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch((error) => console.error("Playback failed:", error))
        }
      }, 500)
    }, 2000)
  }

  // Menangani download
  const handleDownload = () => {
    if (!generatedAudio) return

    // Buat elemen anchor untuk download
    const a = document.createElement("a")
    a.href = generatedAudio
    a.download = `Composition-Converter-${voice}-${effect}.mp3`
    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: "Your audio is downloading...",
      })
    }, 100)
  }

  // Menangani share
  const handleShare = () => {
    if (!generatedAudio) return

    // Coba gunakan Web Share API jika tersedia
    if (navigator.share) {
      navigator
        .share({
          title: "Composition Converter Audio",
          text: `Check out this awesome EDM voice: "${text.substring(0, 30)}..."`,
          url: window.location.href,
        })
        .then(() => {
          toast({
            title: "Shared Successfully",
            description: "Audio has been shared!",
          })
        })
        .catch((error) => {
          console.error("Sharing failed:", error)
          copyToClipboard()
        })
    } else {
      copyToClipboard()
    }
  }

  // Helper untuk copy ke clipboard
  const copyToClipboard = () => {
    const shareText = `Check out this awesome EDM voice on Composition Converter: "${text.substring(0, 30)}..." - ${window.location.href}`

    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Audio link copied to clipboard!",
        })
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Could not copy link to clipboard.",
          variant: "destructive",
        })
      })
  }

  const handleExamplePromptClick = useCallback(
    (prompt: string) => {
      setText(prompt)
    },
    [setText],
  )

  return (
    <div className="container py-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-2">Describe Your Remix & Let Composition Converter Create!</h1>
      <p className="text-zinc-400 mb-8">Enter a prompt, set the BPM, and select a genre to generate your remix.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Text input */}
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Enter Your Text</h2>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your text here to convert to EDM vocals..."
            className="min-h-[200px] bg-zinc-800/50 border-zinc-700 mb-4"
          />

          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Voice Type</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="border-zinc-700 bg-zinc-900">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">BPM</label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[currentBpm]}
                  min={80}
                  max={180}
                  step={1}
                  className="flex-1 [&>span]:bg-cyan-500"
                  onValueChange={(value) => setCurrentBpm(value[0])}
                />
                <span className="text-sm font-medium w-12 text-right">{currentBpm}</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            onClick={generateAudio}
            disabled={isGenerating || !text.trim()}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating Audio...
              </>
            ) : (
              "Generate Audio"
            )}
          </Button>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Example Prompts</h3>
            <div className="space-y-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => handleExamplePromptClick(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Audio preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Audio Preview</h2>

            {generatedAudio ? (
              <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Generated Audio</h3>
                    <p className="text-zinc-400 text-sm">{text.length > 30 ? `${text.substring(0, 30)}...` : text}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Visualizer */}
                <div className="h-24 bg-zinc-800 rounded-lg mb-4 overflow-hidden">
                  <canvas ref={canvasRef} width={600} height={100} className="w-full h-full"></canvas>
                </div>

                {/* Audio controls */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-12 w-12 bg-cyan-600 hover:bg-cyan-700 border-none"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>

                  <div className="flex items-center gap-2 flex-1 mx-4">
                    <Button variant="ghost" size="icon" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="flex-1 [&>span]:bg-cyan-500"
                    />
                  </div>
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={generatedAudio}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => {
                    toast({
                      title: "Audio Error",
                      description: "Failed to load audio. Please try generating again.",
                      variant: "destructive",
                    })
                    setIsPlaying(false)
                  }}
                />
              </div>
            ) : (
              <Card className="border-dashed border-2 border-zinc-700">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-zinc-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Audio Generated Yet</h3>
                  <p className="text-zinc-400 mb-4">Enter your text and click "Generate Audio" to create EDM vocals</p>
                </CardContent>
              </Card>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Audio Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Pitch</label>
                  <Slider
                    value={[effects.pitch]}
                    min={0}
                    max={100}
                    step={1}
                    className="[&>span]:bg-cyan-500"
                    onValueChange={(value) => handleEffectChange("pitch", value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Speed</label>
                  <Slider
                    value={[effects.speed]}
                    min={0}
                    max={100}
                    step={1}
                    className="[&>span]:bg-cyan-500"
                    onValueChange={(value) => handleEffectChange("speed", value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">EDM Effects</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Bass Boost</label>
                <Slider
                  value={[effects.bassBoost]}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-cyan-500"
                  onValueChange={(value) => handleEffectChange("bassBoost", value)}
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Reverb</label>
                <Slider
                  value={[effects.reverb]}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-cyan-500"
                  onValueChange={(value) => handleEffectChange("reverb", value)}
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Delay</label>
                <Slider
                  value={[effects.delay]}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-cyan-500"
                  onValueChange={(value) => handleEffectChange("delay", value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  className={`border-zinc-700 hover:border-cyan-500 hover:bg-cyan-500/10 ${
                    activePreset === preset.name ? "border-cyan-500 bg-cyan-500/10" : ""
                  }`}
                  onClick={() => applyPreset(preset.id)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
