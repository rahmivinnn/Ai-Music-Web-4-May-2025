"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Share2, Play, Pause, Volume2, VolumeX, Upload, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Card, CardContent } from "@/components/ui/card"
import { useDropzone } from "react-dropzone"

export default function RemixPage() {
  // State untuk audio
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const [gainNode, setGainNode] = useState<GainNode | null>(null)
  const [audioSource, setAudioSource] = useState<AudioBufferSourceNode | null>(null)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [currentBpm, setCurrentBpm] = useState(128)
  const [currentKey, setCurrentKey] = useState("c-minor")
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [effects, setEffects] = useState({
    bassBoost: 70,
    reverb: 40,
    delay: 20,
    filter: 50,
    wobble: 0,
    distortion: 0,
  })

  // Referensi untuk elemen audio
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  // Daftar track demo
  const tracks = [
    {
      id: "track1",
      title: "EDM Bass Drop",
      artist: "Composition Converter",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "track2",
      title: "Dubstep Wobble",
      artist: "Composition Converter",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "track3",
      title: "Techno Beat",
      artist: "Composition Converter",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
  ]

  // Preset efek
  const presets = [
    {
      id: "bass-boost",
      name: "Bass Boost",
      effects: {
        bassBoost: 90,
        reverb: 30,
        delay: 15,
        filter: 60,
        wobble: 0,
        distortion: 10,
      },
      bpm: 128,
      key: "c-minor",
    },
    {
      id: "dubstep",
      name: "Dubstep Wobble",
      effects: {
        bassBoost: 80,
        reverb: 20,
        delay: 15,
        filter: 30,
        wobble: 80,
        distortion: 60,
      },
      bpm: 140,
      key: "f-minor",
    },
    {
      id: "techno",
      name: "Techno Beat",
      effects: {
        bassBoost: 75,
        reverb: 30,
        delay: 25,
        filter: 60,
        wobble: 10,
        distortion: 20,
      },
      bpm: 130,
      key: "g-minor",
    },
    {
      id: "trance",
      name: "Trance Vibe",
      effects: {
        bassBoost: 65,
        reverb: 70,
        delay: 50,
        filter: 60,
        wobble: 0,
        distortion: 0,
      },
      bpm: 138,
      key: "a-minor",
    },
    {
      id: "house",
      name: "House Party",
      effects: {
        bassBoost: 70,
        reverb: 40,
        delay: 20,
        filter: 70,
        wobble: 0,
        distortion: 0,
      },
      bpm: 124,
      key: "c-minor",
    },
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

  // Mengatur volume saat berubah
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = isMuted ? 0 : volume / 100
    }

    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted, gainNode])

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

  // Dropzone untuk upload file
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg", ".flac", ".aac"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        setUploadedFile(file)

        // Revoke previous URL if exists
        if (uploadedFileUrl) {
          URL.revokeObjectURL(uploadedFileUrl)
        }

        const fileUrl = URL.createObjectURL(file)
        setUploadedFileUrl(fileUrl)

        // Load audio file into Web Audio API
        if (audioContext) {
          setIsLoading(true)

          fetch(fileUrl)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
            .then((decodedData) => {
              setAudioBuffer(decodedData)
              setIsLoading(false)

              toast({
                title: "File Uploaded",
                description: `${file.name} has been uploaded successfully`,
              })

              // Switch to uploaded track
              setCurrentTrack(-1) // -1 indicates custom uploaded track
            })
            .catch((error) => {
              console.error("Error loading audio:", error)
              setIsLoading(false)

              toast({
                title: "Error",
                description: "Failed to load audio file. Please try another file.",
                variant: "destructive",
              })
            })
        }
      }
    },
  })

  // Menangani pemutaran/pause
  const togglePlay = () => {
    if (currentTrack === -1 && audioBuffer && audioContext) {
      // Play uploaded file with Web Audio API
      if (isPlaying) {
        if (audioSource) {
          audioSource.stop()
          setAudioSource(null)
        }
        setIsPlaying(false)
      } else {
        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer

        // Apply effects here
        applyAudioEffects(source)

        source.start()
        setAudioSource(source)
        setIsPlaying(true)
      }
    } else if (audioRef.current) {
      // Play demo tracks with HTML Audio element
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
  }

  // Apply audio effects to source
  const applyAudioEffects = (source: AudioBufferSourceNode) => {
    if (!audioContext || !analyserNode || !gainNode) return source

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

    // Create reverb (simplified)
    const convolver = audioContext.createConvolver()
    createReverbImpulse(audioContext)
      .then((impulseBuffer) => {
        convolver.buffer = impulseBuffer
      })
      .catch((err) => console.error("Error creating reverb:", err))

    const reverbGain = audioContext.createGain()
    reverbGain.gain.value = effects.reverb / 100

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

    // Reverb path
    distortion.connect(convolver)
    convolver.connect(reverbGain)
    reverbGain.connect(analyserNode)

    return source
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

  // Create reverb impulse response
  const createReverbImpulse = async (context: AudioContext) => {
    const duration = 2.0
    const decay = 2.0
    const sampleRate = context.sampleRate
    const length = sampleRate * duration
    const impulse = context.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const n = i / length
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay)
      }
    }

    return impulse
  }

  // Menangani perubahan track
  const changeTrack = (index: number) => {
    // Stop current playback if any
    if (isPlaying) {
      if (currentTrack === -1 && audioSource) {
        audioSource.stop()
        setAudioSource(null)
      } else if (audioRef.current) {
        audioRef.current.pause()
      }
    }

    setCurrentTrack(index)
    setIsPlaying(false)

    // Start playback after a short delay
    setTimeout(() => {
      if (index === -1) {
        // Play uploaded file
        if (audioBuffer && audioContext) {
          const source = audioContext.createBufferSource()
          source.buffer = audioBuffer

          // Apply effects
          applyAudioEffects(source)

          source.start()
          setAudioSource(source)
          setIsPlaying(true)
        }
      } else if (audioRef.current) {
        // Play demo track
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error("Playback failed:", error)
            toast({
              title: "Playback Error",
              description: "Couldn't play the audio. Please try again.",
              variant: "destructive",
            })
          })
      }
    }, 100)
  }

  // Menangani toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  // Menangani perubahan volume
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
  }

  // Menangani perubahan BPM
  const handleBpmChange = (value: number[]) => {
    setCurrentBpm(value[0])
  }

  // Menangani perubahan efek
  const handleEffectChange = (effect: keyof typeof effects, value: number[]) => {
    setEffects((prev) => ({
      ...prev,
      [effect]: value[0],
    }))

    // If currently playing, update effect in real-time
    if (isPlaying && currentTrack === -1 && audioBuffer && audioContext) {
      // For real-time effect changes, we would need to rebuild the audio graph
      // This is simplified for this example
    }
  }

  // Menangani download
  const handleDownload = () => {
    if (currentTrack === -1 && uploadedFile) {
      // Download uploaded file
      const a = document.createElement("a")
      a.href = uploadedFileUrl || ""
      a.download = `Remixed-${uploadedFile.name}`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)

        toast({
          title: "Download Started",
          description: `${uploadedFile.name} is downloading...`,
        })
      }, 100)
    } else {
      // Download demo track
      const track = tracks[currentTrack]

      setIsLoading(true)

      const a = document.createElement("a")
      a.href = track.audio
      a.download = `${track.title}.mp3`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        setIsLoading(false)

        toast({
          title: "Download Started",
          description: `${track.title} is downloading...`,
        })
      }, 100)
    }
  }

  // Menangani share
  const handleShare = () => {
    let title, text

    if (currentTrack === -1 && uploadedFile) {
      title = `Remixed: ${uploadedFile.name}`
      text = `Check out my remixed track: ${uploadedFile.name}`
    } else {
      const track = tracks[currentTrack]
      title = track.title
      text = `Check out this awesome EDM track: ${track.title} by ${track.artist}`
    }

    // Coba gunakan Web Share API jika tersedia
    if (navigator.share) {
      navigator
        .share({
          title,
          text,
          url: window.location.href,
        })
        .then(() => {
          toast({
            title: "Shared Successfully",
            description: "Track has been shared!",
          })
        })
        .catch((error) => {
          console.error("Sharing failed:", error)
          copyToClipboard(text)
        })
    } else {
      copyToClipboard(text)
    }
  }

  // Helper untuk copy ke clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(`${text} - ${window.location.href}`)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Track link copied to clipboard!",
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

  // Menangani aplikasi preset
  const applyPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)

    if (preset) {
      setActivePreset(preset.name)
      setEffects(preset.effects)
      setCurrentBpm(preset.bpm)
      setCurrentKey(preset.key)

      toast({
        title: "Preset Applied",
        description: `${preset.name} effect has been applied to the track!`,
      })

      // If currently playing, update effects in real-time
      if (isPlaying && currentTrack === -1 && audioBuffer && audioContext) {
        // For real-time effect changes, we would need to rebuild the audio graph
        // This is simplified for this example
        if (audioSource) {
          audioSource.stop()
        }

        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer

        // Apply new effects
        applyAudioEffects(source)

        source.start()
        setAudioSource(source)
      }
    }
  }

  // Menangani remix generation
  const generateRemix = () => {
    setIsLoading(true)

    // Simulasi proses remix
    setTimeout(() => {
      setIsLoading(false)

      toast({
        title: "Remix Generated",
        description: "Your awesome EDM remix is ready!",
      })

      // Putar track yang sudah di-remix
      if (currentTrack === -1 && audioBuffer && audioContext) {
        if (audioSource) {
          audioSource.stop()
        }

        const source = audioContext.createBufferSource()
        source.buffer = audioBuffer

        // Apply effects
        applyAudioEffects(source)

        source.start()
        setAudioSource(source)
        setIsPlaying(true)
      } else if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((error) => console.error("Playback failed:", error))
      }
    }, 2000)
  }

  return (
    <div className="container py-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-2">Composition Converter Remix Studio</h1>
      <p className="text-zinc-400 mb-8">Adjust BPM, effects, and style to create the perfect remix.</p>

      {/* Main remix interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel - Track selection */}
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Select Track</h2>

          <div className="space-y-4">
            {tracks.map((track, index) => (
              <Card
                key={track.id}
                className={`cursor-pointer transition-all ${currentTrack === index ? "border-cyan-500 bg-zinc-800/70" : "border-zinc-800 bg-zinc-900/30"}`}
                onClick={() => changeTrack(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{track.title}</h3>
                      <p className="text-sm text-zinc-400">{track.artist}</p>
                    </div>
                    {currentTrack === index && isPlaying && (
                      <div className="flex space-x-1">
                        <span className="w-1 h-8 bg-cyan-500 animate-pulse rounded-full"></span>
                        <span className="w-1 h-8 bg-cyan-500 animate-pulse rounded-full animation-delay-200"></span>
                        <span className="w-1 h-8 bg-cyan-500 animate-pulse rounded-full animation-delay-500"></span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {uploadedFile && (
              <Card
                className={`cursor-pointer transition-all ${currentTrack === -1 ? "border-cyan-500 bg-zinc-800/70" : "border-zinc-800 bg-zinc-900/30"}`}
                onClick={() => changeTrack(-1)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{uploadedFile.name}</h3>
                      <p className="text-sm text-zinc-400">Uploaded Track</p>
                    </div>
                    {currentTrack === -1 && isPlaying && (
                      <div className="flex space-x-1">
                        <span className="w-1 h-8 bg-cyan-500 animate-pulse rounded-full"></span>
                        <span className="w-1 h-8 bg-cyan-500 animate-pulse rounded-full animation-delay-200"></span>
                        <span className="w-1 h-8 bg-cyan-500 animate-pulse rounded-full animation-delay-500"></span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Upload Your Track</h3>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-cyan-500 bg-cyan-500/10" : "border-zinc-700 hover:border-cyan-500/50"
              }`}
            >
              <input {...getInputProps()} />
              {isLoading ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mb-2" />
                  <p className="text-zinc-400">Processing audio...</p>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-cyan-500/10 rounded-full p-3 mb-3">
                    <Upload className="h-6 w-6 text-cyan-500" />
                  </div>
                  <p className="text-zinc-300 font-medium mb-1">{uploadedFile.name}</p>
                  <p className="text-zinc-500 text-sm">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-cyan-400 hover:text-cyan-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedFile(null)
                      if (uploadedFileUrl) {
                        URL.revokeObjectURL(uploadedFileUrl)
                        setUploadedFileUrl(null)
                      }
                      setAudioBuffer(null)
                      if (currentTrack === -1) {
                        setCurrentTrack(0)
                      }
                    }}
                  >
                    Upload a different file
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-zinc-800 rounded-full p-3 mb-3">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-zinc-300 font-medium mb-1">Drag & drop audio file here</p>
                  <p className="text-zinc-500 text-sm mb-3">or click to browse</p>
                  <p className="text-zinc-600 text-xs">Supports MP3, WAV, OGG, FLAC (max 50MB)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center and right panel - Remix controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio player */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Now Playing</h2>

            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">
                    {currentTrack === -1 && uploadedFile
                      ? uploadedFile.name
                      : currentTrack >= 0 && currentTrack < tracks.length
                        ? tracks[currentTrack].title
                        : "No Track Selected"}
                  </h3>
                  <p className="text-zinc-400">
                    {currentTrack === -1
                      ? "Uploaded Track"
                      : currentTrack >= 0 && currentTrack < tracks.length
                        ? tracks[currentTrack].artist
                        : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDownload}
                    disabled={
                      isLoading || (currentTrack === -1 && !uploadedFile) || (currentTrack === -1 && !uploadedFileUrl)
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                    disabled={currentTrack === -1 && !uploadedFile}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Visualizer */}
              <div className="h-24 bg-zinc-800 rounded-lg mb-4 overflow-hidden">
                <canvas ref={canvasRef} className="w-full h-full" width={1024} height={96} />
                {!isPlaying && (
                  <div className="flex items-end justify-around h-full p-2 -mt-24">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-cyan-500/40 rounded-full"
                        style={{
                          height: `${10 + Math.random() * 15}%`,
                          opacity: 0.4,
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audio controls */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-12 w-12 bg-cyan-600 hover:bg-cyan-700 border-none"
                  onClick={togglePlay}
                  disabled={(currentTrack === -1 && !audioBuffer) || (currentTrack >= 0 && !tracks[currentTrack])}
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

              {/* Hidden audio element for demo tracks */}
              {currentTrack >= 0 && currentTrack < tracks.length && (
                <audio
                  ref={audioRef}
                  src={tracks[currentTrack].audio}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => {
                    toast({
                      title: "Audio Error",
                      description: "Failed to load audio. Please try another track.",
                      variant: "destructive",
                    })
                    setIsPlaying(false)
                  }}
                />
              )}
            </div>
          </div>

          {/* Remix controls */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Remix Controls</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">BPM</label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[currentBpm]}
                    min={80}
                    max={180}
                    step={1}
                    className="flex-1 [&>span]:bg-cyan-500"
                    onValueChange={handleBpmChange}
                  />
                  <span className="text-sm font-medium w-12 text-right">{currentBpm}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Key</label>
                <Select value={currentKey} onValueChange={setCurrentKey}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-900">
                    <SelectValue placeholder="Select key" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-700 bg-zinc-900">
                    <SelectItem value="c-minor">C Minor</SelectItem>
                    <SelectItem value="g-minor">G Minor</SelectItem>
                    <SelectItem value="d-minor">D Minor</SelectItem>
                    <SelectItem value="a-minor">A Minor</SelectItem>
                    <SelectItem value="e-minor">E Minor</SelectItem>
                    <SelectItem value="f-minor">F Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">EDM Presets</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
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

            <div className="grid grid-cols-2 gap-4 mb-6">
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

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Filter</label>
                <Slider
                  value={[effects.filter]}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-cyan-500"
                  onValueChange={(value) => handleEffectChange("filter", value)}
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Wobble</label>
                <Slider
                  value={[effects.wobble]}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-cyan-500"
                  onValueChange={(value) => handleEffectChange("wobble", value)}
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Distortion</label>
                <Slider
                  value={[effects.distortion]}
                  min={0}
                  max={100}
                  step={1}
                  className="[&>span]:bg-cyan-500"
                  onValueChange={(value) => handleEffectChange("distortion", value)}
                />
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-lg py-6"
              onClick={generateRemix}
              disabled={isLoading || (currentTrack === -1 && !audioBuffer)}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating Remix...
                </>
              ) : (
                "GENERATE REMIX"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
