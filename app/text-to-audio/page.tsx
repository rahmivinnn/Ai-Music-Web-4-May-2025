"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Share2, Play, Pause, Volume2, VolumeX } from "lucide-react"
import { TextToAudioGenerator } from "@/components/text-to-audio-generator"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { AudioEffectsPanel } from "@/components/audio-effects-panel"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { EdmPresets } from "@/components/edm-presets"
import { generateAudio } from "@/app/actions/audio-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TextToAudioPage() {
  const [prompt, setPrompt] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioContext, setAudioContext] = useState(null)
  const [audioSource, setAudioSource] = useState(null)
  const [gainNode, setGainNode] = useState(null)
  const [analyserNode, setAnalyserNode] = useState(null)
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [generatedAudio, setGeneratedAudio] = useState(null)
  const [effects, setEffects] = useState({
    reverb: 30,
    delay: 15,
    distortion: 0,
    phaser: 0,
    filter: 50,
    wobble: 0,
    flanger: 0,
    bitcrush: 0,
    low: 50,
    mid: 50,
    high: 50,
    presence: 40,
  })
  const [isEffectsEnabled, setIsEffectsEnabled] = useState(true)
  const [effectsVisible, setEffectsVisible] = useState(true)
  const [currentBpm, setCurrentBpm] = useState(120)
  const [currentKey, setCurrentKey] = useState("C Minor")
  const [activePreset, setActivePreset] = useState(null)
  const [currentVoice, setCurrentVoice] = useState("alloy")
  const [currentModel, setCurrentModel] = useState("tts-1")
  const [currentStyle, setCurrentStyle] = useState("neutral")
  const [activeTab, setActiveTab] = useState("voice")

  const animationRef = useRef(null)
  const convolutionBuffer = useRef(null)
  const oscillatorRef = useRef(null)
  const lfoRef = useRef(null)
  const flangerOscRef = useRef(null)
  const phaserOscRef = useRef(null)

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Fix the AudioContext definition
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const context = new AudioContext({ latencyHint: "playback", sampleRate: 48000 })

        // Create master gain node
        const gain = context.createGain()
        gain.gain.value = volume / 100

        // Create analyzer for visualization
        const analyser = context.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8

        // Create limiter to prevent clipping
        const limiter = context.createDynamicsCompressor()
        limiter.threshold.value = -0.5
        limiter.knee.value = 0
        limiter.ratio.value = 20.0
        limiter.attack.value = 0.001
        limiter.release.value = 0.1

        // Connect limiter to output
        limiter.connect(gain)
        gain.connect(context.destination)
        analyser.connect(limiter)

        setAudioContext(context)
        setGainNode(gain)
        setAnalyserNode(analyser)

        return () => {
          if (context.state !== "closed") {
            context.close()
          }
        }
      } catch (error) {
        console.error("Error initializing Web Audio API:", error)
        toast({
          title: "Audio Error",
          description: "Failed to initialize audio system. Please try again.",
          variant: "destructive",
        })
      }
    }
  }, [])

  // Handle volume changes
  useEffect(() => {
    if (gainNode) {
      // Use exponential ramp for smoother volume changes
      gainNode.gain.setTargetAtTime(isMuted ? 0 : volume / 100, audioContext?.currentTime || 0, 0.01)
    }
  }, [volume, gainNode, isMuted, audioContext])

  // Update time display during playback
  useEffect(() => {
    if (isPlaying) {
      const updateTime = () => {
        if (audioSource && audioContext) {
          // Fix the elapsed time calculation
          const elapsed = audioContext.currentTime - (audioSource.startTime || 0)
          if (elapsed < duration) {
            setCurrentTime(elapsed)
            animationRef.current = requestAnimationFrame(updateTime)
          } else {
            setIsPlaying(false)
            setCurrentTime(0)
          }
        }
      }

      animationRef.current = requestAnimationFrame(updateTime)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [isPlaying, audioSource, audioContext, duration])

  // Load generated audio when it changes
  useEffect(() => {
    if (generatedAudio && audioContext) {
      fetch(generatedAudio.url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((decodedData) => {
          setAudioBuffer(decodedData)
          setDuration(decodedData.duration)
        })
        .catch((error) => {
          console.error("Error loading audio:", error)
          toast({
            title: "Error",
            description: "Failed to load audio file",
            variant: "destructive",
          })
        })
    }
  }, [generatedAudio, audioContext])

  const handleTextToAudio = async (prompt) => {
    setIsProcessing(true)
    setPrompt(prompt)

    try {
      const response = await generateAudio({
        prompt,
        voice: currentVoice,
        model: currentModel,
        style: currentStyle,
      })

      if (response.error) {
        throw new Error(response.error)
      }

      setGeneratedAudio({
        name: `Generated from: ${prompt.substring(0, 20)}...`,
        url: response.audioUrl,
      })

      toast({
        title: "Audio Generated",
        description: `Created audio from prompt: "${prompt.substring(0, 30)}..."`,
      })
    } catch (error) {
      console.error("Error generating audio:", error)
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate audio. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const togglePlay = async () => {
    if (!audioContext || !audioBuffer) return

    // Resume the audio context if it's suspended
    if (audioContext.state === "suspended") {
      await audioContext.resume()
    }

    if (!audioSource) {
      // Create a new audio source
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = false

      // Connect the source to the audio chain
      source.connect(analyserNode)
      analyserNode.connect(gainNode)

      source.start(0)
      source.startTime = audioContext.currentTime // Store start time

      source.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        setAudioSource(null)
      }

      setAudioSource(source)
      setIsPlaying(true)
    } else {
      // Stop and recreate the audio source
      audioSource.stop()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = false

      // Connect the source to the audio chain
      source.connect(analyserNode)
      analyserNode.connect(gainNode)

      source.start(0, currentTime) // Start from current time
      source.startTime = audioContext.currentTime - currentTime // Recalculate start time

      source.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        setAudioSource(null)
      }

      setAudioSource(source)
      setIsPlaying(true)
    }
  }

  const handleSeek = (value) => {
    if (audioSource) {
      audioSource.stop()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = false

      // Connect the source to the audio chain
      source.connect(analyserNode)
      analyserNode.connect(gainNode)

      source.start(0, value) // Start from seeked time
      source.startTime = audioContext.currentTime - value // Recalculate start time

      source.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        setAudioSource(null)
      }

      setAudioSource(source)
      setIsPlaying(true)
      setCurrentTime(value)
    } else {
      setCurrentTime(value)
    }
  }

  const handleVolumeChange = (value) => {
    setVolume(value[0])
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
  }

  const handleEffectChange = (effectName, value) => {
    setEffects((prevEffects) => ({
      ...prevEffects,
      [effectName]: value[0],
    }))
  }

  const handlePresetSelect = (preset) => {
    setActivePreset(preset.name)
    setEffects(preset.effects)
    setCurrentBpm(preset.bpm)
    setCurrentKey(preset.key)

    toast({
      title: `${preset.name} Preset Applied`,
      description: "Effects have been optimized for this genre",
    })
  }

  const handleBpmChange = (value) => {
    setCurrentBpm(value[0])
  }

  const handleKeyChange = (key) => {
    setCurrentKey(key)
  }

  const handleToggleEffectsPanel = () => {
    setEffectsVisible(!effectsVisible)
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const genreOptions = ["Classic", "Sad", "Rock", "Hiphop", "Electronic", "Ambient", "Jazz"]

  // Voice descriptions for the UI
  const voiceDescriptions = {
    alloy: "A versatile, balanced voice with a neutral tone",
    echo: "A deep, resonant male voice with a baritone quality",
    fable: "A warm, gentle voice with a soothing quality",
    onyx: "A deep, authoritative male voice with gravitas",
    nova: "A feminine voice with clarity and warmth",
    shimmer: "A bright, energetic feminine voice",
  }

  // Style descriptions for the UI
  const styleDescriptions = {
    neutral: "Standard conversational tone",
    cheerful: "Upbeat and positive delivery",
    sad: "Melancholic and somber tone",
    professional: "Clear, formal business presentation style",
    excited: "Enthusiastic and energetic delivery",
    calm: "Relaxed, soothing and peaceful tone",
  }

  return (
    <div className="container py-8">
      <Toaster />
      <h1 className="mb-2 text-3xl font-bold">Describe Your Remix & Let Composition converter Create!</h1>
      <p className="mb-8 text-zinc-400">Enter a prompt, set the BPM, and select a genre to generate your remix.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Text to Audio</h2>
          <TextToAudioGenerator onGenerate={handleTextToAudio} isProcessing={isProcessing} />

          {generatedAudio && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Generated Track</h3>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-zinc-300 truncate">{generatedAudio.name}</p>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-zinc-500">{formatTime(duration || 0)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-cyan-400 hover:text-cyan-300"
                    onClick={() => {
                      setIsProcessing(true)
                      setTimeout(() => {
                        handleTextToAudio(prompt)
                      }, 500)
                    }}
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Suggested Prompts</h3>
            <div className="space-y-2">
              {[
                "Upbeat electronic dance track with synth leads",
                "Lo-fi hip hop beat with piano samples",
                "Ambient soundscape with nature sounds",
                "Cinematic orchestral theme with dramatic drums",
                "Jazz piano solo with smooth bass",
                "Acoustic guitar folk melody",
              ].map((promptText, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => handleTextToAudio(promptText)}
                >
                  {promptText}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Audio Preview</h2>

            <AudioVisualizer
              isPlaying={isPlaying}
              audioFile={generatedAudio}
              analyserNode={analyserNode}
              currentTime={currentTime}
              duration={duration}
            />

            <div className="mt-6 flex justify-center items-center gap-4">
              <Button
                onClick={togglePlay}
                disabled={!audioBuffer}
                className="bg-cyan-600 hover:bg-cyan-700 rounded-full h-12 w-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <div className="w-24">
                  <Slider value={[volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`border-cyan-500 ${isEffectsEnabled ? "bg-cyan-500/20 text-cyan-300" : "text-zinc-400"}`}
                onClick={() => setIsEffectsEnabled(!isEffectsEnabled)}
                disabled={!audioBuffer}
              >
                Effects {isEffectsEnabled ? "On" : "Off"}
              </Button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Audio Effects</h2>
              <Button variant="outline" size="sm" onClick={handleToggleEffectsPanel}>
                {effectsVisible ? "Hide Effects" : "Show Effects"}
              </Button>
            </div>

            {effectsVisible && (
              <AudioEffectsPanel
                effects={effects}
                onEffectChange={handleEffectChange}
                disabled={!audioBuffer || !isEffectsEnabled}
              />
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">EDM Presets</h3>
              <EdmPresets onPresetSelect={handlePresetSelect} disabled={!audioBuffer} />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Generation Settings</h3>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="voice">Voice & Style</TabsTrigger>
                  <TabsTrigger value="music">Music Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="voice" className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">Voice</label>
                    <Select value={currentVoice} onValueChange={setCurrentVoice}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select Voice" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900">
                        <SelectItem value="alloy">Alloy (Balanced)</SelectItem>
                        <SelectItem value="echo">Echo (Baritone)</SelectItem>
                        <SelectItem value="fable">Fable (Warm)</SelectItem>
                        <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                        <SelectItem value="nova">Nova (Feminine)</SelectItem>
                        <SelectItem value="shimmer">Shimmer (Bright)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-zinc-500">{voiceDescriptions[currentVoice]}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">Voice Style</label>
                    <Select value={currentStyle} onValueChange={setCurrentStyle}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select Style" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900">
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="cheerful">Cheerful</SelectItem>
                        <SelectItem value="sad">Sad</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="excited">Excited</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-zinc-500">{styleDescriptions[currentStyle]}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">Model Quality</label>
                    <Select value={currentModel} onValueChange={setCurrentModel}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select Model" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900">
                        <SelectItem value="tts-1">Standard Quality</SelectItem>
                        <SelectItem value="tts-1-hd">HD Quality</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-zinc-500">
                      {currentModel === "tts-1-hd"
                        ? "Higher quality audio with improved clarity and naturalness"
                        : "Standard quality, suitable for most use cases"}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="music" className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">Genre</label>
                    <Select defaultValue={genreOptions[0]}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select Genre" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900">
                        {genreOptions.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">BPM</label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[currentBpm]}
                        min={60}
                        max={200}
                        step={1}
                        onValueChange={(value) => setCurrentBpm(value[0])}
                        className="flex-1 [&>span]:bg-cyan-500"
                      />
                      <span className="text-sm font-medium w-12 text-right">{currentBpm}</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-zinc-400">Key</label>
                    <Select value={currentKey} onValueChange={handleKeyChange}>
                      <SelectTrigger className="border-zinc-700 bg-zinc-900">
                        <SelectValue placeholder="Select Key" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900">
                        <SelectItem value="C Major">C Major</SelectItem>
                        <SelectItem value="C Minor">C Minor</SelectItem>
                        <SelectItem value="D Major">D Major</SelectItem>
                        <SelectItem value="D Minor">D Minor</SelectItem>
                        <SelectItem value="E Major">E Major</SelectItem>
                        <SelectItem value="E Minor">E Minor</SelectItem>
                        <SelectItem value="F Major">F Major</SelectItem>
                        <SelectItem value="F Minor">F Minor</SelectItem>
                        <SelectItem value="G Major">G Major</SelectItem>
                        <SelectItem value="G Minor">G Minor</SelectItem>
                        <SelectItem value="A Major">A Major</SelectItem>
                        <SelectItem value="A Minor">A Minor</SelectItem>
                        <SelectItem value="B Major">B Major</SelectItem>
                        <SelectItem value="B Minor">B Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-950/30"
                disabled={!audioBuffer}
              >
                Save to Library
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  disabled={!audioBuffer}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button className="bg-cyan-600 hover:bg-cyan-700" disabled={!audioBuffer}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
