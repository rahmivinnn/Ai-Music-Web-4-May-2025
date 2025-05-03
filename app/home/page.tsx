"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Music, Wand2, Heart, Play, Pause, Download, Shuffle, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null)
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})
  const [audioLoaded, setAudioLoaded] = useState<{ [key: number]: boolean }>({})
  const [audioError, setAudioError] = useState<{ [key: number]: boolean }>({})

  // EDM playlists with guaranteed working image URLs and audio URLs
  const edmPlaylists = [
    {
      id: 1,
      title: "Neon Pulse",
      genre: "EDM",
      author: "DJ Synth",
      image: "https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg",
      fallbackImage: "https://cdn.pixabay.com/photo/2015/04/14/17/08/festival-722773_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/11/17/audio_febc508a42.mp3",
    },
    {
      id: 2,
      title: "Bass Reactor",
      genre: "Dubstep",
      author: "BassKing",
      image: "https://cdn.pixabay.com/photo/2016/11/22/19/15/hand-1850120_1280.jpg",
      fallbackImage: "https://cdn.pixabay.com/photo/2019/09/17/18/48/computer-4484282_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
    },
    {
      id: 3,
      title: "Techno Fusion",
      genre: "Techno",
      author: "TechMaster",
      image: "https://cdn.pixabay.com/photo/2017/07/21/23/57/concert-2527495_1280.jpg",
      fallbackImage: "https://cdn.pixabay.com/photo/2016/11/29/06/17/audience-1867754_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/03/15/audio_c8b9758c8d.mp3",
    },
    {
      id: 4,
      title: "Electric Dreams",
      genre: "Trance",
      author: "Dreamweaver",
      image: "https://cdn.pixabay.com/photo/2017/11/24/10/43/ticket-2974645_1280.jpg",
      fallbackImage: "https://cdn.pixabay.com/photo/2018/06/17/10/38/artist-3480274_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0f6d2e0d7.mp3",
    },
    {
      id: 5,
      title: "Drop Zone",
      genre: "House",
      author: "HouseMaster",
      image: "https://cdn.pixabay.com/photo/2016/11/23/15/48/audience-1853662_1280.jpg",
      fallbackImage: "https://cdn.pixabay.com/photo/2016/11/22/19/15/hand-1850120_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3",
    },
    {
      id: 6,
      title: "Future Beats",
      genre: "Future Bass",
      author: "FutureBeat",
      image: "https://cdn.pixabay.com/photo/2014/05/21/15/18/musician-349790_1280.jpg",
      fallbackImage: "https://cdn.pixabay.com/photo/2015/03/08/17/25/musician-664432_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/10/25/audio_864e7672de.mp3",
    },
  ]

  // AI EDM tracks with guaranteed working image URLs and audio URLs
  const aiEdmTracks = [
    {
      id: 101,
      title: "AI Bass Drop",
      artist: "Neural Beats",
      coverUrl: "https://cdn.pixabay.com/photo/2019/08/23/08/26/music-4425334_1280.jpg",
      fallbackCover: "https://cdn.pixabay.com/photo/2015/05/15/14/50/concert-768722_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/05/16/audio_8cc0501d62.mp3",
    },
    {
      id: 102,
      title: "Neon Pulse",
      artist: "Deep Learning DJ",
      coverUrl: "https://cdn.pixabay.com/photo/2016/11/19/13/57/drum-set-1839383_1280.jpg",
      fallbackCover: "https://cdn.pixabay.com/photo/2019/11/14/03/22/dj-4625286_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/10/28/audio_f52a5134b1.mp3",
    },
    {
      id: 103,
      title: "Future Vibe",
      artist: "Algorithm Remix",
      coverUrl: "https://cdn.pixabay.com/photo/2016/11/22/19/15/hand-1850120_1280.jpg",
      fallbackCover: "https://cdn.pixabay.com/photo/2019/09/08/19/13/autumn-4461685_1280.jpg",
      audioUrl: "https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668d05.mp3",
    },
  ]

  // Preload audio files to ensure they're ready to play
  useEffect(() => {
    const preloadAudio = (id: number, url: string) => {
      const audio = new Audio()
      audio.src = url
      audio.preload = "auto"

      audio.addEventListener("canplaythrough", () => {
        setAudioLoaded((prev) => ({ ...prev, [id]: true }))
      })

      audio.addEventListener("error", () => {
        console.error(`Error loading audio for track ${id}`)
        setAudioError((prev) => ({ ...prev, [id]: true }))
      })
    }

    // Preload all playlist audio
    edmPlaylists.forEach((playlist) => {
      preloadAudio(playlist.id, playlist.audioUrl)
    })

    // Preload all AI track audio
    aiEdmTracks.forEach((track) => {
      preloadAudio(track.id, track.audioUrl)
    })
  }, [])

  // Handle image error by setting a flag to use fallback
  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({
      ...prev,
      [id]: true,
    }))
  }

  // Toggle play/pause for a track
  const togglePlay = (id: number) => {
    if (playingTrackId === id) {
      // Pause the current track
      const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement
      if (audio) {
        audio.pause()
      }
      setPlayingTrackId(null)
    } else {
      // If another track is playing, pause it first
      if (playingTrackId !== null) {
        const previousAudio = document.getElementById(`audio-${playingTrackId}`) as HTMLAudioElement
        if (previousAudio) {
          previousAudio.pause()
        }
      }

      // Play the new track
      const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement
      if (audio) {
        // Reset the audio to the beginning if it was played before
        audio.currentTime = 0

        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlayingTrackId(id)
            })
            .catch((error) => {
              console.error("Error playing audio:", error)
              // Try an alternative approach for mobile browsers
              setTimeout(() => {
                audio
                  .play()
                  .then(() => setPlayingTrackId(id))
                  .catch((err) => console.error("Second attempt failed:", err))
              }, 100)
            })
        }
      }
    }
  }

  // Function to handle direct download
  const downloadTrack = (url: string, filename: string) => {
    // Create an invisible anchor element
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = filename + ".mp3"

    // Add to document, trigger click, and remove
    document.body.appendChild(a)
    a.click()

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a)
    }, 100)
  }

  return (
    <div className="container py-8">
      <h1 className="mb-2 text-3xl font-bold">AI-Powered Music Creation</h1>
      <p className="mb-8 text-zinc-400">
        Remix songs into EDM beats or generate unique audio from text using Composition converter.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="remix-card bg-gradient-to-br from-cyan-900/20 to-black p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-cyan-400">Remix Song AI</h2>
              <p className="mb-6 text-zinc-400">
                Transform any song into an EDM remix with AI-powered creativity. Upload, remix, and enjoy!
              </p>
              <Link href="/remix">
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Music className="mr-2 h-4 w-4" />
                  Create remix
                </Button>
              </Link>

              {/* New feature: Clear EDM Effects options */}
              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-cyan-900/30">
                <h3 className="text-sm font-medium text-cyan-400 mb-2">Crystal Clear EDM Effects</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Pristine Bass</span>
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Clear Highs</span>
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Balanced Mix</span>
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Voice Integration</span>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="20" width="10" height="40" rx="2" fill="#00c0c0" />
                <rect x="25" y="10" width="10" height="60" rx="2" fill="#00a0a0" />
                <rect x="40" y="30" width="10" height="20" rx="2" fill="#00e0e0" />
                <rect x="55" y="15" width="10" height="50" rx="2" fill="#00c0c0" />
              </svg>
            </div>
          </div>
        </div>

        <div className="remix-card bg-gradient-to-br from-cyan-900/20 to-black p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-cyan-400">Text-to-Audio</h2>
              <p className="mb-6 text-zinc-400">
                Convert your text into AI-generated music or vocals. Simply enter text and let AI create the sound!
              </p>
              <Link href="/text-to-audio">
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Audio
                </Button>
              </Link>

              {/* New feature: Clear EDM Effects options */}
              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-cyan-900/30">
                <h3 className="text-sm font-medium text-cyan-400 mb-2">Premium Voice + EDM Options</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Crystal Clear Mix</span>
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Voice Clarity</span>
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">Text Prompts</span>
                  <span className="px-2 py-1 bg-cyan-900/30 text-xs rounded-full text-cyan-300">EDM Fusion</span>
                </div>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70C56.5685 70 70 56.5685 70 40C70 23.4315 56.5685 10 40 10ZM40 65C26.1929 65 15 53.8071 15 40C15 26.1929 26.1929 15 40 15C53.8071 15 65 26.1929 65 40C65 53.8071 53.8071 65 40 65Z"
                  fill="#00a0a0"
                />
                <path
                  d="M40 20C29.0543 20 20 29.0543 20 40C20 50.9457 29.0543 60 40 60C50.9457 60 60 50.9457 60 40C60 29.0543 50.9457 20 40 20ZM40 55C31.7157 55 25 48.2843 25 40C25 31.7157 31.7157 25 40 25C48.2843 25 55 31.7157 55 40C55 48.2843 48.2843 55 40 55Z"
                  fill="#00c0c0"
                />
                <circle cx="40" cy="40" r="10" fill="#00e0e0" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">EDM Playlists</h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-1 text-cyan-400 border-cyan-800/50">
              <Shuffle className="h-3 w-3" />
              <span>Shuffle</span>
            </Button>
            <Button variant="link" className="text-cyan-400">
              View all
            </Button>
          </div>
        </div>
        <p className="mb-6 text-zinc-400">Explore our collection of EDM playlists</p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {edmPlaylists.map((playlist) => (
            <div key={playlist.id} className="remix-card group">
              <div className="relative overflow-hidden rounded-lg">
                <Link href={`/playlist/${playlist.id}`}>
                  <div className="aspect-square w-full bg-gradient-to-br from-cyan-900/50 to-purple-900/50">
                    {/* Use img tag with error handling for guaranteed image display */}
                    <img
                      src={
                        imageErrors[`playlist-${playlist.id || "/placeholder.svg"}`]
                          ? playlist.fallbackImage
                          : playlist.image
                      }
                      alt={playlist.title}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={() => handleImageError(`playlist-${playlist.id}`)}
                    />
                  </div>
                </Link>
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-full bg-cyan-500 text-black hover:bg-cyan-400"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      togglePlay(playlist.id)
                    }}
                  >
                    {playingTrackId === playlist.id ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </Button>
                  <div className="absolute bottom-2 right-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full bg-cyan-500/80 text-black hover:bg-cyan-400 transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        downloadTrack(playlist.audioUrl, playlist.title)
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download {playlist.title}</span>
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Heart className="h-4 w-4" />
                </Button>

                {/* Audio status indicator */}
                {playingTrackId === playlist.id && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center justify-center gap-1">
                      <Volume2 className="h-3 w-3 text-cyan-400" />
                      <div className="flex space-x-0.5">
                        <div className="h-3 w-1 animate-pulse bg-cyan-400"></div>
                        <div className="h-4 w-1 animate-pulse bg-cyan-400" style={{ animationDelay: "0.1s" }}></div>
                        <div className="h-2 w-1 animate-pulse bg-cyan-400" style={{ animationDelay: "0.2s" }}></div>
                        <div className="h-5 w-1 animate-pulse bg-cyan-400" style={{ animationDelay: "0.3s" }}></div>
                        <div className="h-3 w-1 animate-pulse bg-cyan-400" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3">
                <Link href={`/playlist/${playlist.id}`}>
                  <h3 className="font-medium hover:text-cyan-400 transition-colors">{playlist.title}</h3>
                </Link>
                <p className="text-sm text-cyan-400">{playlist.genre}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                  <span className="text-xs text-zinc-500">{playlist.author}</span>
                  {playingTrackId === playlist.id && <span className="ml-auto text-xs text-cyan-400">Playing</span>}
                </div>
              </div>

              {/* Hidden audio element for this playlist */}
              <audio
                id={`audio-${playlist.id}`}
                src={playlist.audioUrl}
                className="hidden"
                preload="auto"
                onEnded={() => setPlayingTrackId(null)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* EDM AI Playlist Section */}
      <div className="mt-16 border-t border-zinc-800 pt-8">
        <h2 className="text-3xl font-bold mb-6">🎧 EDM AI Playlist</h2>
        <p className="text-zinc-400 mb-8">AI-generated EDM tracks with deep bass and futuristic vibes</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiEdmTracks.map((track) => (
            <div
              key={track.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all"
            >
              <div className="relative aspect-square overflow-hidden">
                {/* Use img tag with error handling for guaranteed image display */}
                <img
                  src={imageErrors[`track-${track.id || "/placeholder.svg"}`] ? track.fallbackCover : track.coverUrl}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={() => handleImageError(`track-${track.id}`)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-cyan-500/80 hover:text-black"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">{track.title}</h3>
                <p className="text-cyan-400 text-sm mb-4">{track.artist}</p>

                <audio
                  id={`audio-${track.id}`}
                  className="w-full"
                  controls
                  src={track.audioUrl}
                  preload="auto"
                  onPlay={() => setPlayingTrackId(track.id)}
                  onPause={() => setPlayingTrackId(null)}
                >
                  Your browser does not support the audio element.
                </audio>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
                    onClick={() => downloadTrack(track.audioUrl, track.title)}
                  >
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
