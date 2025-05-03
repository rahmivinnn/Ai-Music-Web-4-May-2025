"use client"

import { useState, useRef, useEffect } from "react"
import { Share2 } from "lucide-react"

export default function EDMVoiceMixer() {
  const [voiceText, setVoiceText] = useState("")
  const [selectedVoice, setSelectedVoice] = useState("neutral")
  const [selectedEDMEffect, setSelectedEDMEffect] = useState("clean")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const voices = [
    { id: "neutral", name: "Netral" },
    { id: "male", name: "Pria" },
    { id: "female", name: "Wanita" },
    { id: "deep", name: "Dalam" },
  ]

  const edmEffects = [
    { id: "clean", name: "Jernih (Clean)" },
    { id: "bass", name: "Bass Boost" },
    { id: "reverb", name: "Reverb" },
    { id: "delay", name: "Delay" },
    { id: "filter", name: "Filter Sweep" },
  ]

  // Menangani pemutaran audio
  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current

      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleEnded = () => setIsPlaying(false)

      audioElement.addEventListener("play", handlePlay)
      audioElement.addEventListener("pause", handlePause)
      audioElement.addEventListener("ended", handleEnded)

      return () => {
        audioElement.removeEventListener("play", handlePlay)
        audioElement.removeEventListener("pause", handlePause)
        audioElement.removeEventListener("ended", handleEnded)
      }
    }
  }, [audioRef.current])

  const handleGenerate = () => {
    if (!voiceText.trim()) return

    setIsGenerating(true)

    // Simulasi proses generasi
    setTimeout(() => {
      // Pilih sample audio berdasarkan voice yang dipilih
      let audioSample = ""

      switch (selectedVoice) {
        case "male":
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          break
        case "female":
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
          break
        case "deep":
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
          break
        default:
          audioSample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
      }

      setGeneratedAudio(audioSample)
      setIsGenerating(false)
    }, 2000)
  }

  const handleDownload = () => {
    if (!generatedAudio) return

    try {
      const link = document.createElement("a")
      link.href = generatedAudio
      link.download = `EDM-Voice-${selectedVoice}-${selectedEDMEffect}.mp3`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download audio")
    }
  }

  const handleShare = async () => {
    if (!generatedAudio) return

    try {
      // Cek apakah Web Share API tersedia
      if (navigator.share) {
        // Buat file untuk dibagikan
        const response = await fetch(generatedAudio)
        const blob = await response.blob()
        const file = new File([blob], `EDM-Voice-${selectedVoice}-${selectedEDMEffect}.mp3`, { type: "audio/mpeg" })

        await navigator.share({
          title: "Check out my EDM voice mix!",
          text: "I created this voice with EDM effects using Web Music AI Platform",
          files: [file],
        })
      } else {
        // Fallback jika Web Share API tidak tersedia
        // Salin link ke clipboard
        const shareText = "Check out my EDM voice mix created with Web Music AI Platform!"
        await navigator.clipboard.writeText(shareText)

        alert("Share link copied to clipboard")
      }
    } catch (error) {
      console.error("Share error:", error)

      // Fallback jika sharing gagal
      try {
        const shareText = "Check out my EDM voice mix created with Web Music AI Platform!"
        await navigator.clipboard.writeText(shareText)
        alert("Share link copied to clipboard")
      } catch (clipboardError) {
        alert("Failed to share audio")
      }
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen py-12 flex items-center justify-center">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Web Music AI Platform</h1>

        {/* Input Teks */}
        <div className="mb-4">
          <label htmlFor="voiceText" className="block text-gray-700 text-sm font-bold mb-2">
            Masukkan Teks:
          </label>
          <textarea
            id="voiceText"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="Tuliskan teks yang ingin diubah menjadi suara..."
            rows={4}
          ></textarea>
        </div>

        {/* Pilihan Voice */}
        <div className="mb-4">
          <label htmlFor="voiceSelect" className="block text-gray-700 text-sm font-bold mb-2">
            Pilih Voice:
          </label>
          <select
            id="voiceSelect"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pilihan EDM Effect */}
        <div className="mb-6">
          <label htmlFor="edmEffectSelect" className="block text-gray-700 text-sm font-bold mb-2">
            Pilih EDM Effect:
          </label>
          <select
            id="edmEffectSelect"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={selectedEDMEffect}
            onChange={(e) => setSelectedEDMEffect(e.target.value)}
          >
            {edmEffects.map((effect) => (
              <option key={effect.id} value={effect.id}>
                {effect.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tombol Generate */}
        <button
          onClick={handleGenerate}
          className="w-full py-3 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded focus:outline-none focus:shadow-outline"
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Audio"}
        </button>

        {/* Output Audio */}
        {generatedAudio && (
          <div className="mt-6">
            <audio ref={audioRef} src={generatedAudio} controls className="w-full"></audio>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={togglePlayPause}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </button>

                <button
                  onClick={handleShare}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition flex items-center justify-center gap-2"
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
