"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIAudioPlayer } from "@/components/ai-audio-player"
import { toast } from "@/components/ui/use-toast"
import { Upload, Music, Waveform, Loader2 } from "lucide-react"
import { validateAudioFile } from "@/lib/remix-utils"
import { remixAudio } from "@/app/actions/audio-actions"

// EDM subgenres for the dropdown
const edmSubgenres = [
  { value: "progressive_house", label: "Progressive House", artists: "Martin Garrix, Nicky Romero" },
  { value: "future_bass", label: "Future Bass", artists: "Illenium, Flume, San Holo" },
  { value: "bass_house", label: "Bass House", artists: "Tchami, Malaa, JOYRYDE" },
  { value: "tropical_house", label: "Tropical House", artists: "Kygo, Sam Feldt" },
  { value: "dubstep", label: "Dubstep", artists: "Skrillex, Excision" }
]

// Musical keys for the dropdown
const musicalKeys = [
  { value: "C Minor", label: "C Minor" },
  { value: "C Major", label: "C Major" },
  { value: "G Minor", label: "G Minor" },
  { value: "G Major", label: "G Major" },
  { value: "D Minor", label: "D Minor" },
  { value: "D Major", label: "D Major" },
  { value: "A Minor", label: "A Minor" },
  { value: "A Major", label: "A Major" },
  { value: "E Minor", label: "E Minor" },
  { value: "E Major", label: "E Major" },
  { value: "F Minor", label: "F Minor" },
  { value: "F Major", label: "F Major" }
]

export function EdmRemixStudio() {
  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Remix parameters
  const [prompt, setPrompt] = useState<string>("Remix this audio into a high-energy EDM track with professional effects: sidechain compression, heavy bass, tight kicks, risers, drops, synth layers, and vocal chops.")
  const [style, setStyle] = useState<string>("progressive_house")
  const [quality, setQuality] = useState<string>("studio")
  const [bpm, setBpm] = useState<number>(128)
  const [key, setKey] = useState<string>("C Minor")
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [remixResult, setRemixResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<string>("upload")
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFileError(null)
    
    // Validate the audio file
    const isValid = await validateAudioFile(selectedFile)
    if (!isValid) {
      setFileError("Invalid audio file. Please upload a WAV, MP3, or OGG file (500KB - 50MB).")
      return
    }
    
    setFile(selectedFile)
    toast({
      title: "File uploaded",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    })
  }
  
  // Handle remix generation
  const handleRemixGeneration = async () => {
    if (!file && !remixResult) {
      setFileError("Please upload an audio file first.")
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Call the remix function
      const result = await remixAudio({
        file: file,
        prompt: prompt,
        style: style,
        quality: quality,
        bpm: bpm,
        key: key
      })
      
      if (result.success) {
        setRemixResult(result)
        setActiveTab("result")
        toast({
          title: "Remix generated successfully",
          description: "Your EDM remix is ready to play!",
        })
      } else {
        toast({
          title: "Remix generation failed",
          description: result.error || "An error occurred during remix generation.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating remix:", error)
      toast({
        title: "Remix generation failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Reset the form
  const handleReset = () => {
    setFile(null)
    setFileError(null)
    setRemixResult(null)
    setActiveTab("upload")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">EDM Remix Studio</CardTitle>
        <CardDescription>
          Transform your audio into a professional EDM track with advanced sound design and mastering
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="upload">Upload & Configure</TabsTrigger>
            <TabsTrigger value="result" disabled={!remixResult}>Result</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="audio-file">Upload Audio File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="audio-file"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Browse
                </Button>
              </div>
              {fileError && <p className="text-sm text-red-500">{fileError}</p>}
              {file && (
                <p className="text-sm text-green-500">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            {/* Remix Parameters */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt">Remix Instructions</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe how you want your EDM remix to sound..."
                  className="h-24"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style">EDM Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger id="style">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {edmSubgenres.map((subgenre) => (
                        <SelectItem key={subgenre.value} value={subgenre.value}>
                          {subgenre.label} ({subgenre.artists})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Musical Key</Label>
                  <Select value={key} onValueChange={setKey}>
                    <SelectTrigger id="key">
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {musicalKeys.map((musicalKey) => (
                        <SelectItem key={musicalKey.value} value={musicalKey.value}>
                          {musicalKey.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bpm">Tempo (BPM): {bpm}</Label>
                  <Slider
                    id="bpm"
                    min={100}
                    max={160}
                    step={1}
                    value={[bpm]}
                    onValueChange={(value) => setBpm(value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quality">Output Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger id="quality">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (MP3 320kbps)</SelectItem>
                      <SelectItem value="studio">Studio (WAV 44.1kHz 16-bit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="result" className="space-y-6">
            {remixResult && (
              <div className="space-y-4">
                <div className="bg-zinc-900/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Your EDM Remix</h3>
                  <AIAudioPlayer
                    audioUrl={remixResult.audioUrl}
                    fallbackUrls={remixResult.fallbackUrls}
                    title={`EDM Remix (${remixResult.metadata?.subgenre || style})`}
                    showVisualizer={true}
                    autoPlay={false}
                    loop={false}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="bg-zinc-900/30 p-2 rounded">
                    <span className="block text-zinc-400">Genre</span>
                    <span>EDM ({remixResult.metadata?.subgenre || style})</span>
                  </div>
                  <div className="bg-zinc-900/30 p-2 rounded">
                    <span className="block text-zinc-400">BPM</span>
                    <span>{remixResult.metadata?.bpm || bpm}</span>
                  </div>
                  <div className="bg-zinc-900/30 p-2 rounded">
                    <span className="block text-zinc-400">Key</span>
                    <span>{remixResult.metadata?.key || key}</span>
                  </div>
                  <div className="bg-zinc-900/30 p-2 rounded">
                    <span className="block text-zinc-400">Format</span>
                    <span>{remixResult.metadata?.format || "MP3 320kbps"}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="secondary" onClick={() => setActiveTab(activeTab === "upload" ? "result" : "upload")} disabled={!remixResult && activeTab === "upload"}>
            {activeTab === "upload" ? "View Result" : "Edit Settings"}
          </Button>
        </div>
        
        <Button onClick={handleRemixGeneration} disabled={isProcessing} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : remixResult ? (
            <>
              <Waveform className="mr-2 h-4 w-4" />
              Regenerate Remix
            </>
          ) : (
            <>
              <Music className="mr-2 h-4 w-4" />
              Generate EDM Remix
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
