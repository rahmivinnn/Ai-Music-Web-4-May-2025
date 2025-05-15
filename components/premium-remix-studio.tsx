"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIAudioPlayer } from "@/components/ai-audio-player"
import { toast } from "@/components/ui/use-toast"
import { Upload, Download, Waveform, Loader2, Music, Sliders, Sparkles } from "lucide-react"
import { premiumEdmPresets } from "@/lib/premium-audio-processor"
import { remixAudio } from "@/app/actions/audio-actions"
import { CompositionConverter } from "@/components/composition-converter"

export function PremiumRemixStudio() {
  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Remix parameters
  const [selectedPreset, setSelectedPreset] = useState<string>("bass_boost")
  const [bpm, setBpm] = useState<number>(128)
  const [key, setKey] = useState<string>("C Minor")
  const [quality, setQuality] = useState<string>("studio")
  const [customPrompt, setCustomPrompt] = useState<string>("")

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [remixResult, setRemixResult] = useState<any>(null)

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

    // Check file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setFileError("File size exceeds 50MB limit.")
      return
    }

    setFile(selectedFile)
    toast({
      title: "File uploaded",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    })
  }

  // Process the audio file
  const processAudio = async () => {
    if (!file && !customPrompt) {
      toast({
        title: "Missing input",
        description: "Please upload an audio file or enter a custom prompt.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Get the preset parameters
      const preset = premiumEdmPresets[selectedPreset]

      // Call the remix function
      const result = await remixAudio({
        file: file,
        prompt: customPrompt || `Apply ${preset.name} preset with professional mastering`,
        style: preset.category.toLowerCase(),
        quality: quality,
        bpm: bpm,
        key: key,
        preset: selectedPreset
      })

      if (result.success) {
        setRemixResult(result)
        toast({
          title: "Remix created successfully",
          description: `Applied ${preset.name} preset with professional mastering`,
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

    // Update BPM and key based on preset
    const presetData = premiumEdmPresets[preset]
    if (presetData) {
      setBpm(presetData.bpmRange[0])
      setKey(presetData.keyCompatibility[0])
    }
  }

  // Handle download
  const handleDownload = () => {
    if (!remixResult || !remixResult.audioUrl) return

    // Create a download link
    const a = document.createElement("a")
    a.href = remixResult.audioUrl
    a.download = `premium-remix-${selectedPreset}-${Date.now()}.mp3`
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
    }, 100)

    toast({
      title: "Download started",
      description: "Your premium remixed audio is downloading...",
    })
  }

  // State to toggle between upload and presets views
  const [activeView, setActiveView] = useState<'upload' | 'presets'>('upload')

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeView === 'upload' ? 'default' : 'outline'}
          className={activeView === 'upload' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
          onClick={() => setActiveView('upload')}
        >
          Upload & Remix
        </Button>
        <Button
          variant={activeView === 'presets' ? 'default' : 'outline'}
          className={activeView === 'presets' ? 'bg-cyan-600 hover:bg-cyan-700' : ''}
          onClick={() => setActiveView('presets')}
        >
          Preset Library
        </Button>
      </div>

      {activeView === 'upload' && (
        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-cyan-400" />
                Upload Audio
              </CardTitle>
              <CardDescription>
                Upload your audio file to apply premium EDM remix processing
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Remix Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-cyan-400" />
                Remix Controls
              </CardTitle>
              <CardDescription>
                Customize your remix parameters for professional results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                        <SelectItem value="F Minor">F Minor</SelectItem>
                        <SelectItem value="E Minor">E Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Quality</label>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Studio (WAV)</SelectItem>
                        <SelectItem value="high">High (320kbps MP3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-zinc-400">Preset</label>
                    <Select value={selectedPreset} onValueChange={handlePresetChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preset" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(premiumEdmPresets).map(([key, preset]) => (
                          <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Custom Prompt (Optional)</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe additional processing details (e.g., 'Add more bass, make it sound like a club remix with vocal chops')"
                    className="w-full h-20 bg-zinc-900 border border-zinc-700 rounded-md p-2 text-sm"
                  />
                </div>

                <Button
                  onClick={processAudio}
                  disabled={isProcessing}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Premium Remix
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Section */}
          {remixResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waveform className="h-5 w-5 text-cyan-400" />
                  Premium Remix Result
                </CardTitle>
                <CardDescription>
                  Your professionally mastered EDM remix is ready
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AIAudioPlayer
                  audioUrl={remixResult.audioUrl}
                  fallbackUrls={remixResult.fallbackUrls}
                  title={`Premium ${premiumEdmPresets[selectedPreset]?.name} Remix`}
                  showVisualizer={true}
                  autoPlay={false}
                  premiumAudio={true}
                  audioMetadata={remixResult.metadata}
                />

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleDownload}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Remix
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeView === 'presets' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-cyan-400" />
              Premium EDM Presets
            </CardTitle>
            <CardDescription>
              Try our professional EDM presets with built-in samples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompositionConverter
              initialPreset="bass_boost"
              showUpload={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
