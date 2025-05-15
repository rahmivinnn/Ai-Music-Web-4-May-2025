"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { generateOneSidedLoveSong } from "../one-sided-love-song"
import { AIAudioPlayer } from "@/components/ai-audio-player"

export default function OneSidedLovePage() {
  const [song, setSong] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate the song when the page loads
  useEffect(() => {
    // Add a small delay before generating to ensure UI is rendered first
    const timer = setTimeout(() => {
      generateSong()
    }, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  const generateSong = async (useFallback = false) => {
    setIsLoading(true);

    try {
      // Generate the song with our API
      let songData;

      if (useFallback) {
        // Use a direct high-quality fallback if requested
        songData = {
          title: "Waiting For Your Love",
          lyrics: "This is a fallback song with lyrics...", // This would be the full lyrics in a real implementation
          audioUrl: "https://assets.mixkit.co/music/preview/mixkit-piano-reflections-22.mp3",
          details: {
            genre: "pop",
            mood: "sad",
            bpm: 95,
            key: "A minor",
            quality: "professional",
            format: "mp3",
            sampleRate: "44.1kHz",
            bitDepth: "16-bit",
            channels: 2,
          },
          success: true,
          fallback: true,
        };
      } else {
        // Generate the song normally
        songData = await generateOneSidedLoveSong();
      }

      if (songData.success) {
        // Update the song state
        setSong(songData);

        // Show appropriate success message
        if (songData.fallback) {
          toast({
            title: "Song Ready (Alternative Source)",
            description: "Using a professional-quality alternative track",
            variant: "default",
          });
        } else {
          toast({
            title: "Song Generated",
            description: `"${songData.title}" has been created successfully!`,
            variant: "default",
          });
        }
      } else {
        // Handle generation failure
        console.error("Song generation failed:", songData.error);

        // Try with fallback if not already using it
        if (!useFallback) {
          toast({
            title: "Switching to Alternative Source",
            description: "We're having trouble generating your song. Using a pre-made track instead.",
            variant: "warning",
          });

          // Call generateSong again with fallback flag
          return generateSong(true);
        } else {
          toast({
            title: "Generation Failed",
            description: songData.error || "Failed to generate song",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error in song generation:", error);

      // Provide a high-quality fallback song in case of error
      const fallbackSong = {
        title: "Waiting For Your Love",
        lyrics: "This is a fallback song with lyrics...", // This would be the full lyrics in a real implementation
        audioUrl: "https://assets.mixkit.co/music/preview/mixkit-sad-melancholic-classical-strings-2848.mp3",
        details: {
          genre: "pop",
          mood: "sad",
          bpm: 95,
          key: "A minor",
          quality: "professional",
          format: "mp3",
          sampleRate: "44.1kHz",
          bitDepth: "16-bit",
          channels: 2,
        },
        success: true,
        fallback: true,
      };

      setSong(fallbackSong);

      toast({
        title: "Using Alternative Track",
        description: "We've loaded a professional-quality alternative track for you",
        variant: "warning",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle download button click
  const handleDownload = () => {
    if (!song) return;

    // Show download starting toast
    toast({
      title: "Preparing Download",
      description: "Getting your song ready for download...",
    });

    // Create a download link with improved error handling
    try {
      const a = document.createElement("a");
      a.href = song.audioUrl;

      // Format filename with song details for better organization
      const formattedTitle = song.title.replace(/\s+/g, "-").toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      a.download = `${formattedTitle}-${timestamp}.mp3`;

      // Use a more reliable download method
      a.style.display = "none";
      document.body.appendChild(a);

      // Trigger download with a small delay to ensure UI updates
      setTimeout(() => {
        a.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          toast({
            title: "Download Started",
            description: "Your professional-quality song is downloading...",
          });
        }, 100);
      }, 500);
    } catch (error) {
      console.error("Download error:", error);

      // Fallback method if the download fails
      toast({
        title: "Download Issue",
        description: "Please right-click on the player and select 'Save Audio As...'",
        variant: "warning",
      });
    }
  }

  const formatLyrics = (lyrics) => {
    if (!lyrics) return ""

    return lyrics.split("\n").map((line, index) => (
      <div key={index} className={line.includes("Chorus:") || line.includes("Verse") || line.includes("Bridge:") || line.includes("Outro:")
        ? "font-bold text-cyan-400 mt-4"
        : "text-zinc-300"}>
        {line}
      </div>
    ))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">One-Sided Love Song Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{song ? song.title : "Generating song..."}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSong}
                  disabled={isLoading}
                >
                  {isLoading ? "Generating..." : "Regenerate"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {song && (
                <>
                  <div className="mb-6">
                    <AIAudioPlayer
                      audioUrl={song.audioUrl}
                      title={song.title}
                      showVisualizer={true}
                      onDownload={handleDownload}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-500 mb-1">Genre</p>
                      <p className="font-medium text-white capitalize">{song.details.genre}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Mood</p>
                      <p className="font-medium text-white">{song.details.mood}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">BPM</p>
                      <p className="font-medium text-white">{song.details.bpm}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1">Key</p>
                      <p className="font-medium text-white">{song.details.key}</p>
                    </div>
                  </div>
                </>
              )}

              {!song && (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-zinc-400">Generating your one-sided love song...</p>
                    <p className="text-zinc-500 text-sm mt-2">This may take a moment</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="border-zinc-800 bg-zinc-900/50 h-full">
            <CardHeader>
              <CardTitle>Lyrics</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] overflow-y-auto">
              {song ? (
                <div className="space-y-1 text-sm">
                  {formatLyrics(song.lyrics)}
                </div>
              ) : (
                <div className="text-zinc-500 italic">
                  Lyrics will appear here once the song is generated...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>



      <Toaster />
    </div>
  )
}
