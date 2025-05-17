"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Share2, Trash2, Search, Music, Wand2, Play, Pause } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function MyLibraryPage() {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Sample audio URLs - in a real app, these would come from your database
  const audioSamples = {
    1: "/samples/sample-neutral.mp3",
    2: "/samples/sample-male.mp3",
    3: "/samples/sample-female.mp3",
    4: "/samples/sample-warm.mp3",
  }

  const savedItems = [
    {
      id: 1,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      type: "remix",
      image: "/placeholder.svg?key=2fzo2",
    },
    {
      id: 2,
      title: "Bass Overdrive",
      original: "Original Creation",
      date: "2024-03-12",
      duration: "01:45",
      type: "generated",
      image: "/placeholder.svg?key=m0g1y",
    },
    {
      id: 3,
      title: "Midnight Cypher",
      original: "Hip-Hop Beat",
      date: "2024-03-10",
      duration: "03:15",
      type: "remix",
      image: "/placeholder.svg?key=mkjs5",
    },
    {
      id: 4,
      title: "Ambient Soundscape",
      original: "Text Prompt",
      date: "2024-03-08",
      duration: "04:30",
      type: "generated",
      image: "/placeholder.svg?key=wa9xu",
    },
  ]

  // Update the handlePlayPause function to use the actual audio from the API
  const handlePlayPause = (id: number) => {
    if (currentlyPlaying === id) {
      // If this track is already playing, pause it
      audioRef.current?.pause()
      setCurrentlyPlaying(null)
    } else {
      // If another track is playing, stop it first
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }

      // Create a new audio element and play the selected track
      const audio = new Audio(audioSamples[id as keyof typeof audioSamples])
      audio.crossOrigin = "anonymous" // Add this for CORS support
      audio.onended = () => setCurrentlyPlaying(null)
      audio.onerror = (e) => {
        console.error("Audio error:", e)
        toast({
          title: "Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        })
        setCurrentlyPlaying(null)
      }

      audio.play().catch((error) => {
        console.error("Error playing audio:", error)
        toast({
          title: "Error",
          description: "Failed to play audio. Please try again.",
          variant: "destructive",
        })
        setCurrentlyPlaying(null)
      })

      audioRef.current = audio
      setCurrentlyPlaying(id)
    }
  }

  const handleDownload = (id: number) => {
    const audioUrl = audioSamples[id as keyof typeof audioSamples]
    if (!audioUrl) return

    fetch(audioUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `audio-${id}.mp3`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: "Audio downloaded successfully!",
        })
      })
      .catch((error) => {
        console.error("Error downloading audio:", error)
        toast({
          title: "Error",
          description: "Failed to download audio. Please try again.",
          variant: "destructive",
        })
      })
  }

  const handleShare = (id: number) => {
    const title = savedItems.find((item) => item.id === id)?.title || "Audio"
    const url = window.location.href

    if (navigator.share) {
      navigator
        .share({
          title: title,
          url: url,
        })
        .then(() => {
          toast({
            title: "Shared",
            description: "Content shared successfully!",
          })
        })
        .catch((error) => {
          console.error("Error sharing:", error)
          handleFallbackShare(url)
        })
    } else {
      handleFallbackShare(url)
    }
  }

  const handleFallbackShare = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Link copied to clipboard!",
        })
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error)
        toast({
          title: "Error",
          description: "Failed to copy link. Please try again.",
          variant: "destructive",
        })
      })
  }

  const handleDelete = (id: number) => {
    // In a real app, you would delete from your database
    toast({
      title: "Deleted",
      description: "Item deleted successfully!",
    })
  }

  // Function to render a single item
  const renderItem = (item: (typeof savedItems)[0]) => (
    <div
      key={item.id}
      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative group">
          <img
            src={item.image || "/placeholder.svg"}
            alt={item.title}
            className="h-16 w-16 rounded-md object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/diverse-group-making-music.png"
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
            onClick={() => handlePlayPause(item.id)}
          >
            {currentlyPlaying === item.id ? (
              <Pause className="h-8 w-8 text-white" />
            ) : (
              <Play className="h-8 w-8 text-white" />
            )}
          </div>
          {currentlyPlaying === item.id && (
            <div className="absolute inset-0 bg-cyan-500/20 rounded-md border-2 border-cyan-500"></div>
          )}
        </div>
        <div>
          <h3 className="font-medium flex items-center">
            {item.title}
            {item.type === "remix" ? (
              <Music className="h-4 w-4 ml-2 text-cyan-400" />
            ) : (
              <Wand2 className="h-4 w-4 ml-2 text-purple-400" />
            )}
          </h3>
          <p className="text-sm text-zinc-500">{item.original}</p>
          <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
            <span>{item.date}</span>
            <span>{item.duration}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-cyan-400"
          onClick={() => handleDownload(item.id)}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-cyan-400"
          onClick={() => handleShare(item.id)}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-zinc-400 hover:text-red-400"
          onClick={() => handleDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Library</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search library"
              className="w-[250px] bg-zinc-900 pl-9 text-sm text-zinc-400 focus:ring-cyan-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-zinc-700 bg-zinc-900">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all">All items</SelectItem>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="remixes">Remixes only</SelectItem>
              <SelectItem value="generated">Generated only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="all" className="text-lg py-3">
            All Items
          </TabsTrigger>
          <TabsTrigger value="remixes" className="text-lg py-3">
            <Music className="h-4 w-4 mr-2" />
            Remixes
          </TabsTrigger>
          <TabsTrigger value="generated" className="text-lg py-3">
            <Wand2 className="h-4 w-4 mr-2" />
            Generated Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="space-y-4">{savedItems.map(renderItem)}</div>
        </TabsContent>

        <TabsContent value="remixes" className="mt-0">
          <div className="space-y-4">{savedItems.filter((item) => item.type === "remix").map(renderItem)}</div>
        </TabsContent>

        <TabsContent value="generated" className="mt-0">
          <div className="space-y-4">{savedItems.filter((item) => item.type === "generated").map(renderItem)}</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
