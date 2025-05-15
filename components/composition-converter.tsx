"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { AIAudioPlayer } from "@/components/ai-audio-player"
import { toast } from "@/components/ui/use-toast"
import { Upload, Download, Waveform, Loader2, Music } from "lucide-react"
import { premiumEdmPresets } from "@/lib/premium-audio-processor"
import { remixAudio } from "@/app/actions/audio-actions"

interface CompositionConverterProps {
  initialPreset?: string;
  showUpload?: boolean;
  showControls?: boolean;
  showPresets?: boolean;
  className?: string;
}

export function CompositionConverter({
  initialPreset = "bass_boost",
  showUpload = true,
  showControls = true,
  showPresets = true,
  className = "",
}: CompositionConverterProps) {
  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Remix parameters
  const [selectedPreset, setSelectedPreset] = useState<string>(initialPreset)
  const [bpm, setBpm] = useState<number>(128)
  const [key, setKey] = useState<string>("C Minor")
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [remixResult, setRemixResult] = useState<any>(null)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  
  // Predefined tracks
  const predefinedTracks = [
    { id: "edm_bass_drop", name: "EDM Bass Drop", preset: "bass_boost" },
    { id: "dubstep_wobble", name: "Dubstep Wobble", preset: "dubstep_wobble" },
    { id: "techno_beat", name: "Techno Beat", preset: "techno_beat" },
    { id: "trance_vibe", name: "Trance Vibe", preset: "trance_vibe" },
    { id: "house_party", name: "House Party", preset: "house_party" }
  ]
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFileError(null)
    
    // Validate the audio file
    if (!selectedFile.type.startsWith('audio/')) {
      setFileError("Please upload an audio file (MP3, WAV, OGG, FLAC).")
      return
    }
    
    setFile(selectedFile)
    toast({
      title: "File uploaded",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    })
    
    // Auto-process the file with the selected preset
    processAudio(selectedFile, selectedPreset)
  }
  
  // Handle track selection
  const handleTrackSelection = (trackId: string) => {
    const track = predefinedTracks.find(t => t.id === trackId)
    if (!track) return
    
    setSelectedTrack(trackId)
    setSelectedPreset(track.preset)
    
    // Process the predefined track
    processTrack(track)
  }
  
  // Process a predefined track
  const processTrack = async (track: any) => {
    setIsProcessing(true)
    
    try {
      // Get the preset parameters
      const preset = premiumEdmPresets[track.preset]
      
      // Call the remix function with the track ID
      const result = await remixAudio({
        trackId: track.id,
        prompt: `Apply ${preset.name} preset with professional mastering`,
        style: preset.category.toLowerCase(),
        quality: "studio",
        bpm: preset.bpmRange[0],
        key: preset.keyCompatibility[0]
      })
      
      if (result.success) {
        setRemixResult(result)
        toast({
          title: "Track processed successfully",
          description: `Applied ${preset.name} preset to ${track.name}`,
        })
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An error occurred during processing.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing track:", error)
      toast({
        title: "Processing failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Process an uploaded audio file
  const processAudio = async (audioFile: File, presetKey: string) => {
    setIsProcessing(true)
    
    try {
      // Get the preset parameters
      const preset = premiumEdmPresets[presetKey]
      
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append('file', audioFile)
      
      // Call the remix function
      const result = await remixAudio({
        file: audioFile,
        prompt: `Apply ${preset.name} preset with professional mastering`,
        style: preset.category.toLowerCase(),
        quality: "studio",
        bpm: bpm,
        key: key
      })
      
      if (result.success) {
        setRemixResult(result)
        toast({
          title: "Audio processed successfully",
          description: `Applied ${preset.name} preset to your audio`,
        })
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An error occurred during processing.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing audio:", error)
      toast({
        title: "Processing failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Handle preset change
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    
    // If we have a file, reprocess it with the new preset
    if (file) {
      processAudio(file, preset)
    } else if (selectedTrack) {
      const track = predefinedTracks.find(t => t.id === selectedTrack)
      if (track) {
        processTrack({...track, preset})
      }
    }
  }
  
  // Handle download
  const handleDownload = () => {
    if (!remixResult || !remixResult.audioUrl) return
    
    // Create a download link
    const a = document.createElement("a")
    a.href = remixResult.audioUrl
    a.download = `remix-${selectedPreset}-${Date.now()}.mp3`
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
    }, 100)
    
    toast({
      title: "Download started",
      description: "Your remixed audio is downloading...",
    })
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Track Selection */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Select Track</h3>
        <div className="grid grid-cols-1 gap-2">
          {predefinedTracks.map((track) => (
            <Card 
              key={track.id}
              className={`cursor-pointer transition-colors ${
                selectedTrack === track.id ? "bg-cyan-900/30 border-cyan-500" : "bg-zinc-900/50 hover:bg-zinc-800/50"
              }`}
              onClick={() => handleTrackSelection(track.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center">
                  <Music className="h-5 w-5 mr-2 text-cyan-400" />
                  <div>
                    <div className="font-medium">{track.name}</div>
                    <div className="text-xs text-zinc-400">Composition Converter</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Upload Section */}
      {showUpload && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Upload Your Track</h3>
          <div className="border border-dashed border-zinc-700 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <Upload className="h-10 w-10 text-zinc-500 mb-2" />
              <p className="text-sm text-zinc-400 mb-2">Drag & drop audio file here</p>
              <p className="text-xs text-zinc-500 mb-4">or click to browse</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <p className="text-xs text-zinc-500 mt-2">Supports MP3, WAV, OGG, FLAC (max 50MB)</p>
            </div>
            {fileError && <p className="text-sm text-red-500 mt-2">{fileError}</p>}
            {file && (
              <p className="text-sm text-green-500 mt-2">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Remix Controls */}
      {showControls && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Remix Controls</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">BPM</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[bpm]}
                  min={80}
                  max={180}
                  step={1}
                  onValueChange={(value) => setBpm(value[0])}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-8 text-center">{bpm}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Key</label>
              <Select value={key} onValueChange={setKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C Minor">C Minor</SelectItem>
                  <SelectItem value="C Major">C Major</SelectItem>
                  <SelectItem value="G Minor">G Minor</SelectItem>
                  <SelectItem value="G Major">G Major</SelectItem>
                  <SelectItem value="D Minor">D Minor</SelectItem>
                  <SelectItem value="A Minor">A Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      
      {/* EDM Presets */}
      {showPresets && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">EDM Presets</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(premiumEdmPresets).map(([key, preset]) => (
              <Button
                key={key}
                variant={selectedPreset === key ? "default" : "outline"}
                className={selectedPreset === key ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                onClick={() => handlePresetChange(key)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Now Playing */}
      {remixResult && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Now Playing</h3>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="mb-2 flex justify-between items-center">
              <div>
                <div className="font-medium">
                  {selectedTrack 
                    ? predefinedTracks.find(t => t.id === selectedTrack)?.name 
                    : file?.name || "Processed Audio"}
                </div>
                <div className="text-xs text-zinc-400">Composition Converter</div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <AIAudioPlayer
              audioUrl={remixResult.audioUrl}
              fallbackUrls={remixResult.fallbackUrls}
              showVisualizer={true}
              autoPlay={false}
            />
          </div>
        </div>
      )}
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-2" />
            <p className="text-sm text-zinc-400">Processing your audio...</p>
            <p className="text-xs text-zinc-500 mt-1">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  )
}
