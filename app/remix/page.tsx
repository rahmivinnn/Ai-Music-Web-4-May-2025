"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Share2, Play, Pause, Volume2, VolumeX, Settings, Repeat } from "lucide-react"
import { AudioUploader } from "@/components/audio-uploader"
import { AudioVisualizer } from "@/components/audio-visualizer"
import { AudioEffectsPanel } from "@/components/audio-effects-panel"
import { MixerControls } from "@/components/mixer-controls"
import { SampleLibrary } from "@/components/sample-library"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import EDMVoiceMixer from "@/components/edm-voice-mixer"
import { EdmPresets } from "@/components/edm-presets"

export default function RemixPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioContext, setAudioContext] = useState(null)
  const [audioSource, setAudioSource] = useState(null)
  const [gainNode, setGainNode] = useState(null)
  const [analyserNode, setAnalyserNode] = useState(null)
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
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

  // Audio effect nodes
  const [effectNodes, setEffectNodes] = useState({
    reverbNode: null,
    delayNode: null,
    distortionNode: null,
    filterNode: null,
    wobbleNode: null,
    flangerNode: null,
    bitCrusherNode: null,
    eqLow: null,
    eqMid: null,
    eqHigh: null,
    compressorNode: null,
    limiterNode: null,
  })

  const [isEffectsEnabled, setIsEffectsEnabled] = useState(true)
  const [activePreset, setActivePreset] = useState(null)
  const [effectsVisible, setEffectsVisible] = useState(true)
  const [currentBpm, setCurrentBpm] = useState(120)
  const [currentKey, setCurrentKey] = useState("C Minor")
  const [generatedRemix, setGeneratedRemix] = useState(null)

  const audioRef = useRef(null)
  const animationRef = useRef(null)
  const convolutionBuffer = useRef(null)
  const oscillatorRef = useRef(null)
  const lfoRef = useRef(null)
  const flangerOscRef = useRef(null)
  const phaserOscRef = useRef(null)
  const sidechainRef = useRef(null)

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

        // Create effect nodes
        const filter = context.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = 22000
        filter.Q.value = 1

        const delay = context.createDelay(5.0)
        delay.delayTime.value = 0.15

        const distortion = context.createWaveShaper()

        // Create compressor for better dynamics control
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -24
        compressor.knee.value = 12
        compressor.ratio.value = 4
        compressor.attack.value = 0.005
        compressor.release.value = 0.25

        // Create EQ nodes
        const eqLow = context.createBiquadFilter()
        eqLow.type = "lowshelf"
        eqLow.frequency.value = 200
        eqLow.gain.value = 0

        const eqMid = context.createBiquadFilter()
        eqMid.type = "peaking"
        eqMid.frequency.value = 1500
        eqMid.Q.value = 1
        eqMid.gain.value = 0

        const eqHigh = context.createBiquadFilter()
        eqHigh.type = "highshelf"
        eqHigh.frequency.value = 5000
        eqHigh.gain.value = 0

        // Create a simple impulse response directly with the local context variable
        const createReverbImpulse = (ctx) => {
          try {
            const duration = 3 // Longer reverb for EDM
            const decay = 2
            const sampleRate = ctx.sampleRate
            const length = sampleRate * duration
            const impulse = ctx.createBuffer(2, length, sampleRate)

            for (let channel = 0; channel < 2; channel++) {
              const channelData = impulse.getChannelData(channel)
              for (let i = 0; i < length; i++) {
                const n = i / length
                // Simple exponential decay with slight randomization for natural sound
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay)
              }
            }

            // Apply a low-pass filter to the impulse response to avoid harshness
            const tempBuffer = ctx.createBuffer(2, length, sampleRate)
            const offlineCtx = new OfflineAudioContext(2, length, sampleRate)

            const bufferSource = offlineCtx.createBufferSource()
            bufferSource.buffer = impulse

            const lowpass = offlineCtx.createBiquadFilter()
            lowpass.type = "lowpass"
            lowpass.frequency.value = 5000 // Cut high frequencies for smoother reverb

            bufferSource.connect(lowpass)
            lowpass.connect(offlineCtx.destination)
            bufferSource.start()

            offlineCtx
              .startRendering()
              .then((renderedBuffer) => {
                convolutionBuffer.current = renderedBuffer
                console.log("Created smooth reverb impulse response")
              })
              .catch((err) => {
                console.error("Error rendering reverb:", err)
                convolutionBuffer.current = impulse // Fallback to unfiltered impulse
              })
          } catch (error) {
            console.error("Error creating reverb impulse:", error)
            // Set convolutionBuffer to null so we can handle this case later
            convolutionBuffer.current = null
          }
        }

        // Create the impulse response with the local context
        createReverbImpulse(context)

        setAudioContext(context)
        setGainNode(gain)
        setAnalyserNode(analyser)

        setEffectNodes({
          filterNode: filter,
          delayNode: delay,
          distortionNode: distortion,
          eqLow: eqLow,
          eqMid: eqMid,
          eqHigh: eqHigh,
          compressorNode: compressor,
          limiterNode: limiter,
        })

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

  // Load audio file when it changes
  useEffect(() => {
    if (audioFile && audioContext) {
      loadAudio(audioFile)
    }
  }, [audioFile, audioContext])

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

  // Apply effects when they change
  useEffect(() => {
    if (!audioContext || !effectNodes) return

    const { filterNode, delayNode, distortionNode, eqLow, eqMid, eqHigh, compressorNode } = effectNodes

    // Apply EQ settings with smoother transitions
    if (eqLow) {
      const lowGain = (effects.low - 50) * 0.4 // -20dB to +20dB
      eqLow.gain.setTargetAtTime(lowGain, audioContext.currentTime, 0.1)
    }

    if (eqMid) {
      const midGain = (effects.mid - 50) * 0.3 // -15dB to +15dB
      eqMid.gain.setTargetAtTime(midGain, audioContext.currentTime, 0.1)
    }

    if (eqHigh) {
      // Reduce high gain slightly to avoid harshness
      const highGain = (effects.high - 50) * 0.3 // -15dB to +15dB
      eqHigh.gain.setTargetAtTime(highGain, audioContext.currentTime, 0.1)
    }

    if (filterNode) {
      // Map 0-100 to 50-22000 (logarithmic)
      const frequency = Math.pow(10, (effects.filter / 100) * 2.64 + 1.7) // 50Hz to 22kHz
      filterNode.frequency.exponentialRampToValueAtTime(frequency, audioContext.currentTime + 0.1)

      // Make the filter more resonant for EDM effects
      const resonance = effects.filter > 50 ? 5 + (effects.filter - 50) / 10 : 1
      filterNode.Q.setTargetAtTime(resonance, audioContext.currentTime, 0.1)
    }

    if (delayNode) {
      // Map 0-100 to 0-1 second
      const delayTime = (effects.delay / 100) * 0.75
      // Use linear ramp for delay time to avoid artifacts
      delayNode.delayTime.linearRampToValueAtTime(delayTime, audioContext.currentTime + 0.1)
    }

    if (distortionNode) {
      // Create distortion curve based on intensity
      const amount = (effects.distortion / 100) * 100 // Increased for more dramatic effect
      if (amount > 0) {
        const curve = createDistortionCurve(amount)
        distortionNode.curve = curve

        // Add a small amount of gain reduction as distortion increases to avoid clipping
        if (compressorNode) {
          const threshold = -24 - effects.distortion / 10
          compressorNode.threshold.setTargetAtTime(threshold, audioContext.currentTime, 0.1)
        }
      } else {
        distortionNode.curve = null // No distortion
      }
    }

    // Update wobble effect (LFO on filter)
    if (effects.wobble > 0 && isPlaying) {
      if (!lfoRef.current && audioContext) {
        try {
          const lfo = audioContext.createOscillator()
          lfo.type = "sine"

          // Wobble speed based on BPM for better musical sync
          const wobbleSpeed = (currentBpm / 240) * (0.5 + (effects.wobble / 100) * 2)
          lfo.frequency.value = wobbleSpeed // 0.25Hz to 8Hz based on BPM

          const lfoGain = audioContext.createGain()
          // Reduce the wobble intensity slightly for better blending
          lfoGain.gain.value = 400 + (effects.wobble / 100) * 6000

          lfo.connect(lfoGain)

          if (filterNode) {
            lfoGain.connect(filterNode.frequency)
          }

          lfo.start()
          lfoRef.current = { oscillator: lfo, gain: lfoGain }
        } catch (error) {
          console.error("Error creating wobble effect:", error)
        }
      } else if (lfoRef.current) {
        // Update existing LFO
        try {
          const wobbleSpeed = (currentBpm / 240) * (0.5 + (effects.wobble / 100) * 2)
          lfoRef.current.oscillator.frequency.setTargetAtTime(wobbleSpeed, audioContext.currentTime, 0.1)
          lfoRef.current.gain.gain.setTargetAtTime(400 + (effects.wobble / 100) * 6000, audioContext.currentTime, 0.1)
        } catch (error) {
          console.error("Error updating wobble effect:", error)
        }
      }
    } else if (lfoRef.current) {
      // Stop LFO if wobble is disabled
      try {
        lfoRef.current.oscillator.stop()
        lfoRef.current = null
      } catch (error) {
        console.error("Error stopping wobble effect:", error)
      }
    }

    // Update phaser effect
    if (effects.phaser > 0 && isPlaying) {
      if (!phaserOscRef.current && audioContext) {
        try {
          // Create a series of all-pass filters for phaser effect
          const allPassFilters = []
          for (let i = 0; i < 6; i++) {
            const filter = audioContext.createBiquadFilter()
            filter.type = "allpass"
            filter.frequency.value = 1000 + i * 500
            filter.Q.value = 5
            allPassFilters.push(filter)
          }

          // Connect filters in series
          for (let i = 0; i < allPassFilters.length - 1; i++) {
            allPassFilters[i].connect(allPassFilters[i + 1])
          }

          // Create LFO to modulate filter frequencies
          const phaserLFO = audioContext.createOscillator()
          phaserLFO.type = "sine"
          phaserLFO.frequency.value = 0.2 + (effects.phaser / 100) * 0.8 // 0.2Hz to 1Hz

          const phaserLFOGain = audioContext.createGain()
          phaserLFOGain.gain.value = 1500 * (effects.phaser / 100)

          phaserLFO.connect(phaserLFOGain)

          // Connect LFO to all filter frequencies
          for (let i = 0; i < allPassFilters.length; i++) {
            phaserLFOGain.connect(allPassFilters[i].frequency)
          }

          phaserLFO.start()

          phaserOscRef.current = {
            oscillator: phaserLFO,
            gain: phaserLFOGain,
            filters: allPassFilters,
          }
        } catch (error) {
          console.error("Error creating phaser effect:", error)
        }
      } else if (phaserOscRef.current) {
        // Update existing phaser
        try {
          phaserOscRef.current.oscillator.frequency.setTargetAtTime(
            0.2 + (effects.phaser / 100) * 0.8,
            audioContext.currentTime,
            0.1,
          )
          phaserOscRef.current.gain.gain.setTargetAtTime(1500 * (effects.phaser / 100), audioContext.currentTime, 0.1)
        } catch (error) {
          console.error("Error updating phaser effect:", error)
        }
      }
    } else if (phaserOscRef.current) {
      // Stop phaser if disabled
      try {
        phaserOscRef.current.oscillator.stop()
        phaserOscRef.current = null
      } catch (error) {
        console.error("Error stopping phaser effect:", error)
      }
    }

    // Update flanger effect
    if (effects.flanger > 0 && isPlaying) {
      if (!flangerOscRef.current && audioContext) {
        try {
          const flangerDelay = audioContext.createDelay()
          flangerDelay.delayTime.value = 0.005 // 5ms base delay

          // Create LFO for flanger
          const flangerLFO = audioContext.createOscillator()
          flangerLFO.type = "sine"
          flangerLFO.frequency.value = 0.5 + (effects.flanger / 100) * 2 // 0.5-2.5Hz

          const flangerLFOGain = audioContext.createGain()
          flangerLFOGain.gain.value = 0.002 + (effects.flanger / 100) * 0.003 // Modulation depth

          flangerLFO.connect(flangerLFOGain)
          flangerLFOGain.connect(flangerDelay.delayTime)

          // Create feedback path
          const flangerFeedback = audioContext.createGain()
          flangerFeedback.gain.value = 0.3 + (effects.flanger / 100) * 0.5

          flangerDelay.connect(flangerFeedback)
          flangerFeedback.connect(flangerDelay)

          flangerLFO.start()

          flangerOscRef.current = {
            oscillator: flangerLFO,
            gain: flangerLFOGain,
            delay: flangerDelay,
            feedback: flangerFeedback,
          }
        } catch (error) {
          console.error("Error creating flanger effect:", error)
        }
      } else if (flangerOscRef.current) {
        // Update existing flanger
        try {
          flangerOscRef.current.oscillator.frequency.setTargetAtTime(
            0.5 + (effects.flanger / 100) * 2,
            audioContext.currentTime,
            0.1,
          )
          flangerOscRef.current.gain.gain.setTargetAtTime(
            0.002 + (effects.flanger / 100) * 0.003,
            audioContext.currentTime,
            0.1,
          )
          flangerOscRef.current.feedback.gain.setTargetAtTime(
            0.3 + (effects.flanger / 100) * 0.5,
            audioContext.currentTime,
            0.1,
          )
        } catch (error) {
          console.error("Error updating flanger effect:", error)
        }
      }
    } else if (flangerOscRef.current) {
      // Stop flanger if disabled
      try {
        flangerOscRef.current.oscillator.stop()
        flangerOscRef.current = null
      } catch (error) {
        console.error("Error stopping flanger effect:", error)
      }
    }
  }, [effects, audioContext, effectNodes, isPlaying, currentBpm])

  // Clean up oscillators when component unmounts or playback stops
  useEffect(() => {
    if (!isPlaying) {
      if (lfoRef.current) {
        try {
          lfoRef.current.oscillator.stop()
          lfoRef.current = null
        } catch (error) {
          console.error("Error stopping LFO:", error)
        }
      }

      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop()
          oscillatorRef.current = null
        } catch (error) {
          console.error("Error stopping oscillator:", error)
        }
      }

      if (flangerOscRef.current) {
        try {
          flangerOscRef.current.oscillator.stop()
          flangerOscRef.current = null
        } catch (error) {
          console.error("Error stopping flanger oscillator:", error)
        }
      }

      if (phaserOscRef.current) {
        try {
          phaserOscRef.current.oscillator.stop()
          phaserOscRef.current = null
        } catch (error) {
          console.error("Error stopping phaser oscillator:", error)
        }
      }

      if (sidechainRef.current) {
        try {
          sidechainRef.current.oscillator.stop()
          sidechainRef.current = null
        } catch (error) {
          console.error("Error stopping sidechain oscillator:", error)
        }
      }
    }
  }, [isPlaying])

  const createDistortionCurve = (amount) => {
    const samples = 44100
    const curve = new Float32Array(samples)
    const deg = Math.PI / 180

    // Different distortion curves for different amounts
    if (amount > 80) {
      // Extreme distortion for hardstyle kicks
      for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1
        // Hard clipping with slight asymmetry for more character
        // Add a small amount of soft clipping to avoid harsh digital distortion
        curve[i] = Math.max(Math.min(x * 3, 0.8), -0.7) * (0.95 + 0.05 * Math.tanh(x * 3))
      }
    } else if (amount > 70) {
      // Hard clipping for dubstep-like distortion
      for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1
        // Mix of hard clipping and waveshaping for warmer sound
        curve[i] = Math.max(Math.min((x * amount) / 20, 0.8), -0.8) * (0.9 + 0.1 * Math.tanh(x * 2))
      }
    } else if (amount > 40) {
      // Soft clipping for warm distortion
      for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1
        // Tanh provides a nice warm saturation
        curve[i] = Math.tanh((x * amount) / 25)
      }
    } else {
      // Subtle overdrive
      for (let i = 0; i < samples; ++i) {
        const x = (i * 2) / samples - 1
        // Subtle tube-like saturation
        curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
      }
    }

    return curve
  }

  const loadAudio = async (file) => {
    if (!audioContext) return

    try {
      setIsProcessing(true)

      // Create object URL for the file
      const url = URL.createObjectURL(file)
      setAudioUrl(url)

      // Fetch and decode the audio data
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const decodedData = await audioContext.decodeAudioData(arrayBuffer)

      setAudioBuffer(decodedData)
      setDuration(decodedData.duration)
      setIsProcessing(false)

      toast({
        title: "Success",
        description: "Audio loaded successfully",
      })
    } catch (error) {
      console.error("Error loading audio:", error)
      setIsProcessing(false)
      toast({
        title: "Error",
        description: "Failed to load audio file",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (file) => {
    setAudioFile(file)
  }

  const createBitCrusher = (context, bufferSize = 4096) => {
    if (!context) return null

    try {
      const scriptNode = context.createScriptProcessor(bufferSize, 1, 1)
      let bit = 4 // bit depth (1-16)
      let normFreq = 0.1 // normalized frequency (0-1)

      scriptNode.onaudioprocess = (audioProcessingEvent) => {
        const inputBuffer = audioProcessingEvent.inputBuffer
        const outputBuffer = audioProcessingEvent.outputBuffer

        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
          const inputData = inputBuffer.getChannelData(channel)
          const outputData = outputBuffer.getChannelData(channel)

          // Bit reduction
          const step = Math.pow(0.5, bit)

          // Downsampling
          let lastValue = 0
          for (let i = 0; i < inputBuffer.length; i++) {
            // Downsample (hold sample value for several samples)
            if (Math.random() < normFreq) {
              lastValue = step * Math.floor(inputData[i] / step)
            }
            outputData[i] = lastValue
          }
        }
      }

      // Add methods to control the bit crusher
      scriptNode.setBitDepth = (newBit) => {
        bit = Math.min(Math.max(newBit, 1), 16)
      }

      scriptNode.setDownsampleRate = (newFreq) => {
        normFreq = Math.min(Math.max(newFreq, 0), 1)
      }

      return scriptNode
    } catch (error) {
      console.error("Error creating bit crusher:", error)
      return null
    }
  }

  const setupAudioChain = (source) => {
    if (!audioContext || !effectNodes) return source

    const { filterNode, delayNode, distortionNode, eqLow, eqMid, eqHigh } = effectNodes

    // If effects are disabled, connect directly to analyzer
    if (!isEffectsEnabled) {
      source.connect(analyserNode)
      return source
    }

    try {
      // Create a gain node for the dry/wet mix - better balanced for vocals
      const wetGain = audioContext.createGain()
      wetGain.gain.value = 0.65 // 65% wet for better balance with vocals

      const dryGain = audioContext.createGain()
      dryGain.gain.value = 0.35 // 35% dry to preserve original clarity

      // Connect the source to both paths
      source.connect(dryGain)

      // Connect through EQ first
      source.connect(eqLow)
      eqLow.connect(eqMid)
      eqMid.connect(eqHigh)
      eqHigh.connect(filterNode)

      // Create a feedback path for delay
      const feedbackGain = audioContext.createGain()
      feedbackGain.gain.value = effects.delay > 50 ? 0.5 : 0.25 // Reduced feedback for better clarity

      // Connect the effects chain
      filterNode.connect(distortionNode)

      // Enhanced delay with feedback
      distortionNode.connect(delayNode)
      delayNode.connect(feedbackGain)
      feedbackGain.connect(delayNode)

      // Create a bit crusher effect if bitcrush is enabled
      if (effects.bitcrush > 0) {
        const bitCrusher = createBitCrusher(audioContext)
        if (bitCrusher) {
          // More moderate bit crushing for better audio quality
          const bitDepth = 16 - Math.floor((effects.bitcrush / 100) * 12) // Map 0-100 to 16-4 bit depth
          const downsampleRate = effects.bitcrush / 250 // Reduced rate for better quality

          bitCrusher.setBitDepth(bitDepth)
          bitCrusher.setDownsampleRate(downsampleRate)

          delayNode.connect(bitCrusher)
          bitCrusher.connect(wetGain)
        } else {
          delayNode.connect(wetGain)
        }
      } else {
        delayNode.connect(wetGain)
      }

      // Special processing for Drum & Bass - enhance transients
      if (activePreset === "Drum & Bass" && audioContext) {
        try {
          const transientShaper = audioContext.createDynamicsCompressor()
          transientShaper.threshold.value = -24
          transientShaper.knee.value = 0
          transientShaper.ratio.value = 10 // Reduced from 12 for better balance
          transientShaper.attack.value = 0.001 // Very fast attack
          transientShaper.release.value = 0.1 // Fast release

          delayNode.connect(transientShaper)
          transientShaper.connect(wetGain)
        } catch (error) {
          console.error("Error creating transient shaper:", error)
          delayNode.connect(wetGain)
        }
      }
      // Special processing for Trap - add sidechain effect
      else if (activePreset === "Trap" && audioContext) {
        try {
          const sidechain = audioContext.createGain()
          sidechain.gain.value = 1

          // Create LFO for sidechain effect
          const sidechainLFO = audioContext.createOscillator()
          sidechainLFO.type = "sine"
          sidechainLFO.frequency.value = currentBpm / 60 // Match to BPM

          const sidechainDepth = audioContext.createGain()
          sidechainDepth.gain.value = 0.4 // Reduced from 0.5 for better balance

          sidechainLFO.connect(sidechainDepth)
          sidechainDepth.connect(sidechain.gain)

          delayNode.connect(sidechain)
          sidechain.connect(wetGain)

          sidechainLFO.start()

          // Store for cleanup
          if (!oscillatorRef.current) {
            oscillatorRef.current = sidechainLFO
          }
        } catch (error) {
          console.error("Error creating sidechain effect:", error)
          delayNode.connect(wetGain)
        }
      } else {
        delayNode.connect(wetGain)
      }

      // Apply reverb if enabled
      if (effects.reverb > 0) {
        if (convolutionBuffer.current) {
          // Use convolution reverb if we have an impulse response
          const convolver = audioContext.createConvolver()
          convolver.buffer = convolutionBuffer.current

          // Create a gain node to control reverb amount
          const reverbGain = audioContext.createGain()
          reverbGain.gain.value = effects.reverb / 120 // Reduced for better clarity

          // Add a parallel path for reverb
          distortionNode.connect(convolver)
          convolver.connect(reverbGain)
          reverbGain.connect(wetGain)
        } else {
          // Fallback to a simple feedback delay network as reverb
          console.log("Using fallback reverb")
          const reverbDelay = audioContext.createDelay(1.0)
          reverbDelay.delayTime.value = 0.1

          const reverbGain = audioContext.createGain()
          reverbGain.gain.value = effects.reverb / 250 // Lower gain to prevent feedback

          distortionNode.connect(reverbDelay)
          reverbDelay.connect(reverbGain)
          reverbGain.connect(reverbDelay) // Feedback
          reverbGain.connect(wetGain)
        }
      }

      // Add flanger effect if enabled
      if (effects.flanger > 0 && flangerOscRef.current) {
        try {
          distortionNode.connect(flangerOscRef.current.delay)
          flangerOscRef.current.delay.connect(wetGain)
        } catch (error) {
          console.error("Error connecting flanger effect:", error)
        }
      }

      // Add phaser effect if enabled
      if (effects.phaser > 0 && phaserOscRef.current) {
        try {
          distortionNode.connect(phaserOscRef.current.filters[0])
          phaserOscRef.current.filters[phaserOscRef.current.filters.length - 1].connect(wetGain)
        } catch (error) {
          console.error("Error connecting phaser effect:", error)
        }
      }

      // Add a limiter to prevent clipping
      const limiter = audioContext.createDynamicsCompressor()
      limiter.threshold.value = -1.0
      limiter.knee.value = 0.0
      limiter.ratio.value = 20.0
      limiter.attack.value = 0.001
      limiter.release.value = 0.1

      // Connect both paths to the limiter
      dryGain.connect(limiter)
      wetGain.connect(limiter)

      // Connect limiter to analyzer
      limiter.connect(analyserNode)

      return source
    } catch (error) {
      console.error("Error setting up audio chain:", error)
      // Fallback to direct connection if there's an error
      source.connect(analyserNode)
      return source
    }
  }

  const togglePlay = async () => {
    if (!audioContext || !audioBuffer) return

    try {
      // Resume the audio context if it's suspended
      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      if (isPlaying) {
        // Stop playback
        if (audioSource) {
          audioSource.stop()
          setAudioSource(null)
        }
        setIsPlaying(false)

        // Clean up oscillators
        if (lfoRef.current) {
          lfoRef.current.oscillator.stop()
          lfoRef.current = null
        }
        if (oscillatorRef.current) {
          oscillatorRef.current.stop()
          oscillatorRef.current = null
        }
        if (flangerOscRef.current) {
          flangerOscRef.current.oscillator.stop()
          flangerOscRef.current = null
        }
        if (phaserOscRef.current) {
          phaserOscRef.current.oscillator.stop()
          phaserOscRef.current = null
        }

        return
      }

      // Start playback
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = false

      // Apply effects chain
      setupAudioChain(source)

      // Store the start time properly
      source.startTime = audioContext.currentTime - currentTime
      source.start(0, currentTime)

      setAudioSource(source)
      setIsPlaying(true)

      // Show a toast when effects are applied
      if (isEffectsEnabled && activePreset) {
        toast({
          title: `${activePreset} Preset Active`,
          description: "Effects are being applied to your audio",
        })
      }
    } catch (error) {
      console.error("Error toggling playback:", error)
      toast({
        title: "Playback Error",
        description: "There was an error playing the audio. Please try again.",
        variant: "destructive",
      })
      setIsPlaying(false)
    }
  }

  const stopAudio = () => {
    if (audioSource) {
      audioSource.stop()
      setIsPlaying(false)
      setCurrentTime(0)
      setAudioSource(null)
    }
  }

  const handleSeek = (value) => {
    if (audioSource) {
      audioSource.stop()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = false

      // Connect the source to the audio processing chain
      setupAudioChain(source)

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

  const handleToggleEffectsEnable = () => {
    setIsEffectsEnabled(!isEffectsEnabled)

    if (isPlaying && audioSource) {
      // Restart playback with new effects setting
      audioSource.stop()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.loop = false

      // Connect the source to the audio processing chain
      setupAudioChain(source)

      source.start(0, currentTime) // Start from current time
      source.startTime = audioContext.currentTime - currentTime // Recalculate start time

      source.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        setAudioSource(null)
      }

      setAudioSource(source)
    }

    toast({
      title: isEffectsEnabled ? "Effects Disabled" : "Effects Enabled",
      description: isEffectsEnabled ? "Playing original audio" : "Playing with EDM effects",
    })
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  // Fungsi untuk mengunduh audio
  const handleDownload = () => {
    if (!audioBuffer || !audioContext) {
      toast({
        title: "Error",
        description: "No audio to download",
        variant: "destructive",
      })
      return
    }

    try {
      // Jika ada audioUrl, gunakan cara langsung yang lebih sederhana
      if (audioUrl) {
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = audioUrl
        a.download = audioFile ? audioFile.name : "remix-" + new Date().getTime() + ".mp3"
        document.body.appendChild(a)
        a.click()

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(audioUrl)
        }, 100)

        toast({
          title: "Success",
          description: "Audio downloaded successfully",
        })
        return
      }

      // Jika tidak ada audioUrl, gunakan metode offline rendering
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      )

      // Buat source dari buffer
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer

      // Terapkan efek jika diaktifkan
      if (isEffectsEnabled) {
        // Implementasi sederhana dari efek
        const gain = offlineCtx.createGain()
        gain.gain.value = 1.0

        if (effects.reverb > 0) {
          const convolver = offlineCtx.createConvolver()
          // Buat impulse response sederhana
          const impulseLength = offlineCtx.sampleRate * 2 // 2 detik
          const impulse = offlineCtx.createBuffer(2, impulseLength, offlineCtx.sampleRate)

          for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const channelData = impulse.getChannelData(channel)
            for (let i = 0; i < impulseLength; i++) {
              channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2)
            }
          }

          convolver.buffer = impulse
          source.connect(convolver)
          convolver.connect(gain)
        } else {
          source.connect(gain)
        }

        gain.connect(offlineCtx.destination)
      } else {
        source.connect(offlineCtx.destination)
      }

      // Mulai render
      source.start()

      offlineCtx
        .startRendering()
        .then((renderedBuffer) => {
          // Konversi buffer ke WAV
          const wav = audioBufferToWav(renderedBuffer)

          // Buat blob dan download
          const blob = new Blob([wav], { type: "audio/wav" })
          const url = URL.createObjectURL(blob)

          const a = document.createElement("a")
          a.style.display = "none"
          a.href = url
          a.download = audioFile
            ? audioFile.name.replace(/\.[^/.]+$/, "") + ".wav"
            : "remix-" + new Date().getTime() + ".wav"
          document.body.appendChild(a)
          a.click()

          // Cleanup
          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 100)

          toast({
            title: "Success",
            description: "Audio downloaded successfully",
          })
        })
        .catch((err) => {
          console.error("Rendering failed: ", err)
          toast({
            title: "Error",
            description: "Failed to process audio for download",
            variant: "destructive",
          })
        })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: "Failed to download audio",
        variant: "destructive",
      })
    }
  }

  // Tambahkan fungsi handleShare
  const handleShare = async () => {
    if (!audioFile) {
      toast({
        title: "Error",
        description: "No audio to share",
        variant: "destructive",
      })
      return
    }

    try {
      // Cek apakah Web Share API tersedia
      if (navigator.share) {
        // Buat file untuk dibagikan
        const fileToShare = audioUrl
          ? new File([await (await fetch(audioUrl)).blob()], audioFile.name || "remix.mp3", { type: "audio/mpeg" })
          : audioFile

        await navigator.share({
          title: "Check out my EDM remix!",
          text: "I created this remix using Web Music AI Platform",
          files: [fileToShare],
        })

        toast({
          title: "Success",
          description: "Audio shared successfully",
        })
      } else {
        // Fallback jika Web Share API tidak tersedia
        // Salin link ke clipboard (dalam kasus nyata, ini akan menjadi URL yang dapat dibagikan)
        const shareText = "Check out my EDM remix created with Web Music AI Platform!"
        await navigator.clipboard.writeText(shareText)

        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard",
        })
      }
    } catch (error) {
      console.error("Share error:", error)

      // Fallback jika sharing gagal
      try {
        const shareText = "Check out my EDM remix created with Web Music AI Platform!"
        await navigator.clipboard.writeText(shareText)

        toast({
          title: "Link Copied",
          description: "Share link copied to clipboard",
        })
      } catch (clipboardError) {
        toast({
          title: "Error",
          description: "Failed to share audio",
          variant: "destructive",
        })
      }
    }
  }

  // Fungsi untuk mengkonversi AudioBuffer ke WAV
  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2
    const result = new Uint8Array(44 + length)

    // RIFF identifier
    writeString(result, 0, "RIFF")
    // File length
    result[4] = (length + 36) & 0xff
    result[5] = ((length + 36) >> 8) & 0xff
    result[6] = ((length + 36) >> 16) & 0xff
    result[7] = ((length + 36) >> 24) & 0xff
    // WAVE identifier
    writeString(result, 8, "WAVE")
    // Format chunk identifier
    writeString(result, 12, "fmt ")
    // Format chunk length
    result[16] = 16
    result[17] = 0
    result[18] = 0
    result[19] = 0
    // Sample format (raw)
    result[20] = 1
    result[21] = 0
    // Channel count
    result[22] = numOfChan
    result[23] = 0
    // Sample rate
    result[24] = buffer.sampleRate & 0xff
    result[25] = (buffer.sampleRate >> 8) & 0xff
    result[26] = (buffer.sampleRate >> 16) & 0xff
    result[27] = (buffer.sampleRate >> 24) & 0xff
    // Byte rate (sample rate * block align)
    const byteRate = buffer.sampleRate * numOfChan * 2
    result[28] = byteRate & 0xff
    result[29] = (byteRate >> 8) & 0xff
    result[30] = (byteRate >> 16) & 0xff
    result[31] = (byteRate >> 24) & 0xff
    // Block align (channel count * bytes per sample)
    result[32] = numOfChan * 2
    result[33] = 0
    // Bits per sample
    result[34] = 16
    result[35] = 0
    // Data chunk identifier
    writeString(result, 36, "data")
    // Data chunk length
    result[40] = length & 0xff
    result[41] = (length >> 8) & 0xff
    result[42] = (length >> 16) & 0xff
    result[43] = (length >> 24) & 0xff

    // Write the PCM samples
    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
        const int = sample < 0 ? sample * 0x8000 : sample * 0x7fff

        // Write 16-bit sample
        result[offset++] = int & 0xff
        result[offset++] = (int >> 8) & 0xff
      }
    }

    return result
  }

  // Helper untuk menulis string ke Uint8Array
  function writeString(array, offset, string) {
    for (let i = 0; i < string.length; i++) {
      array[offset + i] = string.charCodeAt(i)
    }
  }

  // Fungsi untuk menghasilkan remix
  const generateRemix = () => {
    if (!audioBuffer) {
      toast({
        title: "Error",
        description: "Please upload an audio file first",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Simulasi proses generasi remix
    setTimeout(() => {
      // Dalam implementasi nyata, ini akan memanggil API atau melakukan pemrosesan audio

      // Untuk demo, kita gunakan audio yang sama dengan efek yang diterapkan
      setGeneratedRemix({
        name: "Generated Remix",
        url: audioUrl,
        duration: duration,
      })

      setIsProcessing(false)

      toast({
        title: "Success",
        description: "Remix generated successfully!",
      })
    }, 3000)
  }

  return (
    <div className="container py-8">
      <Toaster />
      <h1 className="mb-2 text-3xl font-bold">Composition Converter Remix Studio</h1>
      <p className="mb-8 text-zinc-400">Adjust BPM, effects, and style to create the perfect remix.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <AudioUploader onFileUpload={handleFileUpload} isProcessing={isProcessing} />
        </div>
        <div>
          <SampleLibrary
            onSampleSelect={(sample) => {
              // Implementasi nyata akan memuat sample
              const dummyFile = new File([new ArrayBuffer(1000)], sample.name, { type: "audio/mp3" })
              handleFileUpload(dummyFile)

              toast({
                title: "Sample Added",
                description: `${sample.name} added to your project`,
              })
            }}
          />
        </div>
      </div>

      {audioFile && (
        <div className="mt-6 mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
          <AudioVisualizer
            isPlaying={isPlaying}
            audioFile={audioFile}
            analyserNode={analyserNode}
            currentTime={currentTime}
            duration={duration}
          />

          <div className="mt-4 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={togglePlay} disabled={isProcessing}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              <div>
                <p className="text-sm font-medium">{audioFile.name}</p>
                <p className="text-xs text-zinc-500">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Slider
            value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
            onValueChange={(value) => handleSeek((value[0] / 100) * duration)}
            className="[&>span]:bg-cyan-500"
          />
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleMuteToggle}>
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
          <Slider value={[volume]} onValueChange={handleVolumeChange} className="w-[200px] [&>span]:bg-cyan-500" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className={`border-cyan-500 ${isEffectsEnabled ? "bg-cyan-500/20 text-cyan-300" : "text-zinc-400"}`}
            onClick={handleToggleEffectsEnable}
          >
            <Repeat className="h-4 w-4 mr-2" />
            {isEffectsEnabled ? "Effects On" : "Effects Off"}
          </Button>
          <Button variant="outline" onClick={handleToggleEffectsPanel}>
            <Settings className="mr-2 h-4 w-4" />
            {effectsVisible ? "Hide Effects" : "Show Effects"}
          </Button>
        </div>
      </div>

      {effectsVisible && (
        <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
          <AudioEffectsPanel
            effects={effects}
            onEffectChange={handleEffectChange}
            disabled={!audioBuffer || !isEffectsEnabled}
          />
        </div>
      )}

      {/* EDM Voice Mixer */}
      <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
        <EDMVoiceMixer />
      </div>

      <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
        <MixerControls
          disabled={!audioBuffer}
          onMixerChange={(track, value) => {
            toast({
              title: "Mixer Updated",
              description: `${track} volume set to ${value}%`,
            })
          }}
        />
      </div>

      <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
        <h2 className="mb-6 text-xl font-bold">EDM Presets</h2>
        <EdmPresets onPresetSelect={handlePresetSelect} disabled={!audioBuffer} />
      </div>

      <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
        <h2 className="mb-6 text-xl font-bold">Remix Settings</h2>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm text-zinc-400">Target BPM</label>
            <span className="text-sm font-medium">{currentBpm} BPM</span>
          </div>
          <Slider
            value={[currentBpm]}
            min={60}
            max={300}
            step={1}
            onValueChange={handleBpmChange}
            className="[&>span]:bg-cyan-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-zinc-400">Key</label>
          <Select value={currentKey} onValueChange={handleKeyChange}>
            <SelectTrigger className="border-zinc-700 bg-zinc-900">
              <SelectValue placeholder="Select Key" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="C Minor">C Minor</SelectItem>
              <SelectItem value="D Minor">D Minor</SelectItem>
              <SelectItem value="E Minor">E Minor</SelectItem>
              <SelectItem value="F Minor">F Minor</SelectItem>
              <SelectItem value="G Minor">G Minor</SelectItem>
              <SelectItem value="A Minor">A Minor</SelectItem>
              <SelectItem value="B Minor">B Minor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full cyan-button py-6 text-lg"
        onClick={generateRemix}
        disabled={!audioBuffer || isProcessing}
      >
        {isProcessing ? (
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
            Generating Remix...
          </>
        ) : (
          "Generate Remix"
        )}
      </Button>

      {/* Tampilkan hasil remix yang dihasilkan */}
      {generatedRemix && (
        <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="mb-4 text-xl font-bold">Generated Remix</h2>

          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-zinc-300 mb-2">{generatedRemix.name}</p>

            <audio controls className="w-full mb-4" src={generatedRemix.url} />

            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              onClick={() => {
                // Gunakan fungsi download yang sama
                handleDownload()
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Remix
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Music(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}
