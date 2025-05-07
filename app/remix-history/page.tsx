"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Share2, Trash2, Search, Play, Pause } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function RemixHistoryPage() {
  const [filter, setFilter] = useState("all")
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

  const remixes = [
    {
      id: 1,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image: "/placeholder.svg?key=3w8bn",
    },
    {
      id: 2,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image: "/placeholder.svg?key=9icam",
    },
    {
      id: 3,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image: "/placeholder.svg?key=5nfa4",
    },
    {
      id: 4,
      title: "Neon Dreams (EDM Remix)",
      original: "Dreams by Sarah Chen",
      date: "2024-03-14",
      duration: "02:20",
      image: "/placeholder.svg?key=l7yh5",
    },
  ]

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
      audio.onended = () => setCurrentlyPlaying(null)
      audio.onerror = () => {
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
        a.download = `remix-${id}.mp3`
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
    const title = remixes.find((remix) => remix.id === id)?.title || "Remix"
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
      description: "Remix deleted successfully!",
    })
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Remix History</h1>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search remixes"
              className="w-[250px] bg-zinc-900 pl-9 text-sm text-zinc-400 focus:ring-cyan-500"
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] border-zinc-700 bg-zinc-900">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="all">All remixes</SelectItem>
              <SelectItem value="recent">Recent remixes</SelectItem>
              <SelectItem value="oldest">Oldest remixes</SelectItem>
              <SelectItem value="a-z">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <Button
          className={`rounded-full px-4 ${filter === "all" ? "bg-cyan-500 text-black" : "bg-zinc-800 text-zinc-300"}`}
        >
          All
        </Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">Most played</Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">Instrumental</Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">EDM</Button>
        <Button className="rounded-full bg-zinc-800 px-4 text-zinc-300 hover:bg-zinc-700">Trap</Button>
      </div>

      <h2 className="mb-6 text-2xl font-bold">Recent Remixes</h2>

      <div className="space-y-4">
        {remixes.map((remix) => (
          <div
            key={remix.id}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={remix.image || "/placeholder.svg"}
                  alt={remix.title}
                  className="h-16 w-16 rounded-md object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/diverse-group-making-music.png"
                  }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                  onClick={() => handlePlayPause(remix.id)}
                >
                  {currentlyPlaying === remix.id ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white" />
                  )}
                </div>
                {currentlyPlaying === remix.id && (
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-md border-2 border-cyan-500"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{remix.title}</h3>
                <p className="text-sm text-zinc-500">Original: {remix.original}</p>
                <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                  <span>{remix.date}</span>
                  <span>{remix.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-cyan-400"
                onClick={() => handleDownload(remix.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-cyan-400"
                onClick={() => handleShare(remix.id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-red-400"
                onClick={() => handleDelete(remix.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-6 mt-12 text-2xl font-bold">Most Played Remixes</h2>

      <div className="space-y-4">
        {remixes.map((remix) => (
          <div
            key={`most-played-${remix.id}`}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={remix.image || "/placeholder.svg"}
                  alt={remix.title}
                  className="h-16 w-16 rounded-md object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/diverse-group-making-music.png"
                  }}
                />
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md cursor-pointer"
                  onClick={() => handlePlayPause(remix.id)}
                >
                  {currentlyPlaying === remix.id ? (
                    <Pause className="h-8 w-8 text-white" />
                  ) : (
                    <Play className="h-8 w-8 text-white" />
                  )}
                </div>
                {currentlyPlaying === remix.id && (
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-md border-2 border-cyan-500"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{remix.title}</h3>
                <p className="text-sm text-zinc-500">Original: {remix.original}</p>
                <div className="mt-1 flex items-center gap-4 text-xs text-zinc-600">
                  <span>{remix.date}</span>
                  <span>{remix.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-cyan-400"
                onClick={() => handleDownload(remix.id)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-cyan-400"
                onClick={() => handleShare(remix.id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-zinc-400 hover:text-red-400"
                onClick={() => handleDelete(remix.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
