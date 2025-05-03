"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, Download, Share2 } from "lucide-react"

interface Track {
  id: string
  title: string
  description: string
  coverImage: string
  audioSrc: string
}

export function EdmAiPlaylist() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})

  // Sample EDM AI generated tracks
  const tracks: Track[] = [
    {
      id: "1",
      title: "AI Bass Drop",
      description: "AI generated EDM track with heavy bass",
      coverImage: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=300&h=300&auto=format&fit=crop",
      audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
      id: "2",
      title: "Neural Trance",
      description: "AI generated trance music with ethereal synths",
      coverImage: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=300&h=300&auto=format&fit=crop",
      audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    },
    {
      id: "3",
      title: "Quantum House Beat",
      description: "AI generated house music with futuristic beats",
      coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&h=300&auto=format&fit=crop",
      audioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    },
  ]

  const togglePlay = (trackId: string) => {
    const audio = audioRefs.current[trackId]
    if (!audio) return

    if (playingId === trackId) {
      // Pause current track
      audio.pause()
      setPlayingId(null)
    } else {
      // Pause any playing track
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId]?.pause()
      }

      // Play new track
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback failed:", error)
        })
      }
      setPlayingId(trackId)
    }
  }

  const handleAudioEnded = (trackId: string) => {
    if (playingId === trackId) {
      setPlayingId(null)
    }
  }

  const downloadTrack = (track: Track) => {
    try {
      // Create an anchor element for download
      const downloadLink = document.createElement("a")
      downloadLink.href = track.audioSrc
      downloadLink.download = `${track.title}.mp3`
      document.body.appendChild(downloadLink)
      downloadLink.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(downloadLink)
      }, 100)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download track")
    }
  }

  const shareTrack = async (track: Track) => {
    try {
      // Cek apakah Web Share API tersedia
      if (navigator.share) {
        // Buat file untuk dibagikan
        const response = await fetch(track.audioSrc)
        const blob = await response.blob()
        const file = new File([blob], `${track.title}.mp3`, { type: "audio/mpeg" })

        await navigator.share({
          title: `Check out "${track.title}"!`,
          text: `I found this awesome EDM track: ${track.title}`,
          files: [file],
        })
      } else {
        // Fallback jika Web Share API tidak tersedia
        // Salin link ke clipboard
        const shareText = `Check out this awesome EDM track: ${track.title}`
        await navigator.clipboard.writeText(shareText)

        alert("Share link copied to clipboard")
      }
    } catch (error) {
      console.error("Share error:", error)

      // Fallback jika sharing gagal
      try {
        const shareText = `Check out this awesome EDM track: ${track.title}`
        await navigator.clipboard.writeText(shareText)
        alert("Share link copied to clipboard")
      } catch (clipboardError) {
        alert("Failed to share track")
      }
    }
  }

  // Fallback image handling
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.src = "/placeholder.svg?key=o59cj"
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">EDM AI Playlist</h2>
        <p className="text-gray-500 dark:text-gray-400">AI generated EDM tracks for your next mix</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <Card key={track.id} className="overflow-hidden border-2 hover:border-cyan-500 transition-all duration-300">
            <div className="aspect-square relative overflow-hidden">
              <img
                src={track.coverImage || "/placeholder.svg"}
                alt={track.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30"
                  onClick={() => togglePlay(track.id)}
                >
                  {playingId === track.id ? (
                    <Pause className="h-6 w-6 text-white" />
                  ) : (
                    <Play className="h-6 w-6 text-white" />
                  )}
                </Button>
              </div>
            </div>

            <CardHeader className="pb-2">
              <CardTitle>{track.title}</CardTitle>
              <CardDescription>{track.description}</CardDescription>
            </CardHeader>

            <CardFooter className="pt-0 flex justify-between">
              <audio
                ref={(el) => (audioRefs.current[track.id] = el)}
                src={track.audioSrc}
                onEnded={() => handleAudioEnded(track.id)}
                preload="metadata"
              />

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-500 hover:text-cyan-600 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
                  onClick={() => downloadTrack(track)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-900/30"
                  onClick={() => shareTrack(track)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
