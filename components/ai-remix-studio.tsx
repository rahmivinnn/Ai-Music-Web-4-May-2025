"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RemixAudioPlayer } from "./remix-audio-player"
import { toast } from "@/hooks/use-toast"
import { Music, Wand2 } from "lucide-react"
import { generateRemixTrack } from "@/app/actions/audio-actions"

interface RemixResult {
  remixUrl: string | null
  imageUrl: string | null
  fallbackUrl: string
  success: boolean
  message: string
  useFallback?: boolean
  genre?: string
  bpm?: number
  quality?: string
  timestamp?: string
}

export function AIRemixStudio() {
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("edm")
  const [bpm, setBpm] = useState([128])
  const [quality, setQuality] = useState("high")
  const [isGenerating, setIsGenerating] = useState(false)
  const [remixResult, setRemixResult] = useState<RemixResult | null>(null)
  const [activeTab, setActiveTab] = useState("create")
  const descriptionRef = useRef<HTMLInputElement>(null)

  const handleGenerateRemix = async () => {
    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for your remix.",
        variant: "destructive",
      })
      descriptionRef.current?.focus()
      return
    }

    setIsGenerating(true)
    toast({
      title: "Generating Remix",
      description: "Please wait while we create your custom remix...",
    })

    try {
      const result = await generateRemixTrack(description, genre, bpm[0], quality)

      setRemixResult(result)
      setActiveTab("preview")

      if (result.success) {
        toast({
          title: "Remix Generated",
          description: "Your custom remix is ready to play!",
        })
      } else if (result.useFallback) {
        toast({
          title: "Using Sample Audio",
          description: result.message || "We're using a sample track while we fix some issues.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error generating remix:", error)
      toast({
        title: "Generation Error",
        description: "There was a problem generating your remix. Please try again.",
        variant: "destructive",
      })

      // Set a fallback result
      setRemixResult({
        remixUrl: null,
        imageUrl: null,
        fallbackUrl: `/samples/${genre}-remix-sample.mp3` || "/samples/edm-remix-sample.mp3",
        success: false,
        message: "Error generating remix. Using a sample track instead.",
        useFallback: true,
      })

      setActiveTab("preview")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
  }

  const handleGenreChange = (value: string) => {
    setGenre(value)

    // Adjust BPM based on genre
    switch (value) {
      case "house":
        setBpm([128])
        break
      case "techno":
        setBpm([140])
        break
      case "trance":
        setBpm([138])
        break
      case "dubstep":
        setBpm([140])
        break
      case "drum-and-bass":
        setBpm([174])
        break
      default:
        setBpm([128])
    }
  }

  const handleBpmChange = (value: number[]) => {
    setBpm(value)
  }

  const handleQualityChange = (value: string) => {
    setQuality(value)
  }

  const getExamplePrompt = () => {
    switch (genre) {
      case "house":
        return "Deep house track with soulful vocals and smooth chord progression"
      case "techno":
        return "Dark techno with industrial percussion and hypnotic synth sequence"
      case "trance":
        return "Uplifting trance with emotional breakdown and euphoric drop"
      case "dubstep":
        return "Heavy dubstep with aggressive wobble bass and cinematic atmosphere"
      case "drum-and-bass":
        return "Liquid drum and bass with jazzy samples and rolling bassline"
      default:
        return "Energetic EDM track with catchy melody and powerful drop"
    }
  }

  const handleUseExample = () => {
    setDescription(getExamplePrompt())
  }

  return (
    <Card className="w-full shadow-lg border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          AI Remix Studio
        </CardTitle>
        <CardDescription>
          Create custom remixes with AI. Describe the sound you want, and our AI will generate a unique track.
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mx-6">
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="preview" disabled={!remixResult}>
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Describe Your Remix</Label>
              <div className="flex gap-2">
                <Input
                  id="description"
                  ref={descriptionRef}
                  placeholder={getExamplePrompt()}
                  value={description}
                  onChange={handleDescriptionChange}
                />
                <Button variant="outline" size="sm" onClick={handleUseExample}>
                  Example
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Describe the style, mood, and elements you want in your remix.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={genre} onValueChange={handleGenreChange}>
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edm">EDM</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="techno">Techno</SelectItem>
                  <SelectItem value="trance">Trance</SelectItem>
                  <SelectItem value="dubstep">Dubstep</SelectItem>
                  <SelectItem value="drum-and-bass">Drum & Bass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="bpm">Tempo (BPM)</Label>
                <span className="text-sm text-gray-500">{bpm[0]} BPM</span>
              </div>
              <Slider id="bpm" min={80} max={180} step={1} value={bpm} onValueChange={handleBpmChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={quality} onValueChange={handleQualityChange}>
                <SelectTrigger id="quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Faster)</SelectItem>
                  <SelectItem value="high">High (Recommended)</SelectItem>
                  <SelectItem value="ultra">Ultra (Slower)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter>
            <Button className="w-full" onClick={handleGenerateRemix} disabled={isGenerating || !description.trim()}>
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Remix
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>

        <TabsContent value="preview">
          <CardContent className="space-y-4">
            {remixResult && (
              <>
                <RemixAudioPlayer
                  audioUrl={remixResult.remixUrl || ""}
                  fallbackUrl={remixResult.fallbackUrl}
                  title={`${genre.charAt(0).toUpperCase() + genre.slice(1)} Remix`}
                  subtitle={description.length > 30 ? `${description.substring(0, 30)}...` : description}
                  imageUrl={remixResult.imageUrl || undefined}
                  autoplay={true}
                />

                <div className="text-sm space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Genre:</span>
                    <span>{genre.charAt(0).toUpperCase() + genre.slice(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tempo:</span>
                    <span>{remixResult.bpm || bpm[0]} BPM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quality:</span>
                    <span>{quality.charAt(0).toUpperCase() + quality.slice(1)}</span>
                  </div>
                  {remixResult.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Generated:</span>
                      <span>{new Date(remixResult.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab("create")}>
              Back to Editor
            </Button>
            <Button onClick={handleGenerateRemix} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Create New Remix"}
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
