"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Music, Upload, Wand2, RefreshCw, AlertTriangle } from "lucide-react"
import { AudioPlayer } from "./audio-player"
import { ErrorFallback } from "./error-fallback"
import { canAudioPlay } from "@/lib/audio-format-handler"

export function RemixForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [remixedUrl, setRemixedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Handle file upload with validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const fileType = file.type
    if (fileType !== "audio/mpeg" && fileType !== "audio/wav") {
      toast({
        title: "Invalid file type",
        description: "Please upload an MP3 or WAV file only.",
        variant: "destructive",
      })
      return
    }

    setUploadedFile(file)
    setIsUploading(true)
    setUploadProgress(0)
    setAudioError(null)

    // Create a preview URL for the uploaded file
    const url = URL.createObjectURL(file)

    // Test if the audio can actually play
    const canPlay = await canAudioPlay(url)

    if (!canPlay) {
      setIsUploading(false)
      setAudioError("The uploaded audio file appears to be corrupted or in an unsupported format.")
      toast({
        title: "Audio file issue",
        description: "The uploaded file cannot be played. Please try a different file.",
        variant: "destructive",
      })
      URL.revokeObjectURL(url)
      return
    }

    setPreviewUrl(url)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // Handle remix generation with robust error handling
  const handleGenerateRemix = async () => {
    if (!uploadedFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload an audio file first.",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a remix prompt.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)
    setError(null)
    setRemixedUrl(null)

    try {
      // Simulate API call to /api/remix
      // In a real implementation, you would use fetch or axios to make the API call
      // const formData = new FormData()
      // formData.append("file", uploadedFile)
      // formData.append("prompt", prompt)
      // const response = await fetch("/api/remix", { method: "POST", body: formData })

      // Simulate processing progress
      const processingInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(processingInterval)
            return 100
          }
          return prev + 5
        })
      }, 300)

      // Simulate API response after "processing" completes
      setTimeout(() => {
        clearInterval(processingInterval)
        setProcessingProgress(100)
        setIsProcessing(false)

        // Use a guaranteed working sample audio file as the remixed result
        // This avoids potential demuxer errors by using a known good file
        setRemixedUrl("/samples/edm-remix-sample.mp3")

        toast({
          title: "Remix generated",
          description: "Your remix has been generated successfully!",
        })
      }, 6000)
    } catch (err) {
      setIsProcessing(false)
      setError(`Failed to generate remix: ${err instanceof Error ? err.message : "Unknown error"}`)
      toast({
        title: "Remix generation failed",
        description: "There was an error generating your remix.",
        variant: "destructive",
      })
    }
  }

  // Handle audio error
  const handleAudioError = useCallback(
    (err: Error) => {
      console.error("Audio player error:", err)
      setAudioError(err.message)

      toast({
        title: "Audio playback issue",
        description: "There was a problem playing the audio. A fallback has been used.",
        variant: "warning",
      })
    },
    [toast],
  )

  // Handle retry
  const handleRetry = () => {
    setError(null)
    handleGenerateRemix()
  }

  // Handle reset
  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setUploadedFile(null)
    setPreviewUrl(null)
    setRemixedUrl(null)
    setPrompt("")
    setError(null)
    setAudioError(null)
    setIsUploading(false)
    setIsProcessing(false)
    setUploadProgress(0)
    setProcessingProgress(0)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Music className="h-6 w-6 text-cyan-500" />
          <CardTitle>AI Remix Generator</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">1. Upload Audio File</h3>
            {uploadedFile && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div
              className={`border-2 border-dashed ${
                audioError
                  ? "border-red-400 bg-red-50 dark:bg-red-900/10"
                  : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              } rounded-lg p-6 text-center cursor-pointer transition-colors`}
              onClick={handleUploadClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                onChange={handleFileChange}
              />
              {audioError ? (
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600 dark:text-red-400">{audioError}</p>
                  <p className="text-xs text-red-500 mt-1">Please try uploading a different file</p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">MP3 or WAV files only</p>
                </>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {previewUrl && !isUploading && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Preview Original Audio</h4>
                <AudioPlayer
                  audioUrl={previewUrl}
                  title="Original Audio"
                  showWaveform
                  onError={handleAudioError}
                  fallbackUrl="/samples/edm-remix-sample.mp3"
                />
              </div>
            )}
          </div>
        </div>

        {/* Remix Prompt Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">2. Enter Remix Prompt</h3>
          <Textarea
            placeholder="Describe how you want to remix the audio (e.g., 'Make this EDM with ambient echo')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
            disabled={isProcessing || !uploadedFile}
          />
        </div>

        {/* Processing Section */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing remix...</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-2" />
          </div>
        )}

        {/* Result Section */}
        {remixedUrl && !isProcessing && !error && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Your Remixed Track</h3>
            <AudioPlayer
              audioUrl={remixedUrl}
              title="Remixed Audio"
              showWaveform
              showDownload
              onError={handleAudioError}
              fallbackUrl="/samples/edm-remix-sample.mp3"
            />
          </div>
        )}

        {/* Error Section */}
        {error && <ErrorFallback error={error} resetErrorBoundary={handleRetry} />}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleReset} disabled={isProcessing || (!uploadedFile && !remixedUrl)}>
          Start Over
        </Button>

        <Button
          onClick={handleGenerateRemix}
          disabled={isProcessing || !uploadedFile || !prompt.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Remix
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
