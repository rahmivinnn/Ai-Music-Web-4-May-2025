"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Download, Volume2, VolumeX } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { generateOneSidedLoveSong } from "../one-sided-love-song"
import { AudioVisualizer } from "@/components/audio-visualizer"

export default function OneSidedLovePage() {
  const [song, setSong] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const [audioContext, setAudioContext] = useState(null)
  const [analyserNode, setAnalyserNode] = useState(null)

  // Initialize Web Audio API with improved error handling and compatibility
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Use a single AudioContext instance to prevent multiple context creation
        if (!window.globalAudioContext) {
          const AudioContext = window.AudioContext || window.webkitAudioContext
          window.globalAudioContext = new AudioContext()
        }

        const context = window.globalAudioContext

        // Resume the context if it's suspended (browser autoplay policy)
        if (context.state === "suspended") {
          context.resume()
        }

        // Create a high-resolution analyzer for better visualization
        const analyser = context.createAnalyser()
        analyser.fftSize = 1024 // Higher resolution for better visualization
        analyser.smoothingTimeConstant = 0.8 // Smoother transitions

        setAudioContext(context)
        setAnalyserNode(analyser)

        // Cleanup function
        return () => {
          // Don't close the global context, just disconnect the analyzer
          if (analyser) {
            analyser.disconnect()
          }
        }
      } catch (error) {
        console.error("Error initializing Web Audio API:", error)
        // Provide fallback for visualization if Web Audio API fails
        toast({
          title: "Audio Visualization Limited",
          description: "Advanced audio visualization is not available in your browser, but playback will still work.",
          variant: "warning",
        })
      }
    }
  }, [])

  // Generate the song when the page loads with improved error handling
  useEffect(() => {
    // Add a small delay before generating to ensure UI is rendered first
    const timer = setTimeout(() => {
      generateSong()
    }, 100)

    // Setup unload listener to prevent memory leaks
    const handleUnload = () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [])

  // Update audio time with optimized performance and error handling
  useEffect(() => {
    if (!audioRef.current) return

    // Use timeupdate event for standard updates
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime)
    }

    // Handle audio loading errors
    const handleError = (e) => {
      console.error("Audio loading error:", e)
      toast({
        title: "Audio Playback Error",
        description: "There was a problem playing the audio. Trying alternative source...",
        variant: "destructive",
      })

      // Try to reload with an alternative source
      if (song && song.fallback) {
        // Already using fallback, notify user
        toast({
          title: "Audio Unavailable",
          description: "We're having trouble playing this audio. Please try again later.",
          variant: "destructive",
        })
      } else {
        // Try regenerating with fallback
        generateSong(true)
      }
    }

    // Add event listeners
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('error', handleError)

    // Preload metadata for faster response
    audioRef.current.preload = "metadata"

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('error', handleError)
      }
    }
  }, [audioRef.current, song])

  // Connect audio element to Web Audio API with improved error handling
  useEffect(() => {
    if (!audioRef.current || !audioContext || !analyserNode || !song) return

    try {
      // Check if the audio element is already connected
      if (!audioRef.current._connected) {
        const source = audioContext.createMediaElementSource(audioRef.current)

        // Add a gain node for volume control
        const gainNode = audioContext.createGain()

        // Add a compressor for better audio quality
        const compressor = audioContext.createDynamicsCompressor()
        compressor.threshold.value = -24
        compressor.knee.value = 30
        compressor.ratio.value = 12
        compressor.attack.value = 0.003
        compressor.release.value = 0.25

        // Connect the audio processing chain
        source.connect(gainNode)
        gainNode.connect(compressor)
        compressor.connect(analyserNode)
        analyserNode.connect(audioContext.destination)

        // Store the gain node for volume control
        audioRef.current._gainNode = gainNode

        // Mark as connected to prevent reconnection
        audioRef.current._connected = true

        // Set initial volume
        if (audioRef.current._gainNode) {
          audioRef.current._gainNode.gain.value = volume / 100
        }
      }
    } catch (error) {
      // This error might occur if the source is already connected
      console.error("Error connecting audio to analyzer:", error)

      // Fallback to standard HTML5 audio if Web Audio API fails
      if (audioRef.current) {
        audioRef.current.volume = volume / 100
      }
    }
  }, [audioRef.current, audioContext, analyserNode, song])

  const generateSong = async (useFallback = false) => {
    setIsLoading(true)

    try {
      // Start preloading high-quality fallback audio to improve perceived performance
      const preloadFallbacks = () => {
        const fallbackUrls = [
          "https://assets.mixkit.co/music/preview/mixkit-sad-melancholic-classical-strings-2848.mp3",
          "https://assets.mixkit.co/music/preview/mixkit-piano-reflections-22.mp3"
        ];

        fallbackUrls.forEach(url => {
          const audioPreload = new Audio(url);
          audioPreload.preload = "auto";
          // Remove the element after preloading to avoid memory leaks
          audioPreload.oncanplaythrough = () => audioPreload.remove();
        });
      };

      preloadFallbacks();

      // Generate the song with optimized function
      let songData;

      if (useFallback) {
        // Use a direct high-quality fallback if requested
        songData = {
          title: "Waiting For Your Love",
          lyrics: lyrics, // Use the predefined lyrics
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
        // Reset audio element before setting new source
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;

          // Remove any previous event listeners to prevent memory leaks
          const oldSrc = audioRef.current.src;
          audioRef.current.src = "";

          // Small timeout to ensure clean state
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Update the song state
        setSong(songData);

        // Set duration once audio is loaded
        if (audioRef.current) {
          // Use a promise to handle audio loading with timeout
          const setAudioDuration = () => {
            return new Promise((resolve) => {
              // Set a longer timeout for slower connections
              const timeoutId = setTimeout(() => {
                console.warn("Audio metadata loading timed out");
                // Use a default duration if metadata loading fails
                setDuration(180); // Default to 3 minutes
                resolve();
              }, 5000);

              // Set up the metadata loaded handler
              audioRef.current.onloadedmetadata = () => {
                clearTimeout(timeoutId);
                setDuration(audioRef.current.duration);
                resolve();
              };

              // If metadata is already loaded, resolve immediately
              if (audioRef.current.readyState >= 2) {
                clearTimeout(timeoutId);
                setDuration(audioRef.current.duration);
                resolve();
              }
            });
          };

          await setAudioDuration();

          // Resume audio context if it's suspended (browser autoplay policy)
          if (audioContext?.state === "suspended") {
            await audioContext.resume();
          }
        }

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
        lyrics: lyrics, // Use the predefined lyrics
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

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      // Resume audio context if it's suspended (browser autoplay policy)
      if (audioContext?.state === "suspended") {
        audioContext.resume().then(() => {
          console.log("AudioContext resumed successfully");
        }).catch(err => {
          console.error("Failed to resume AudioContext:", err);
        });
      }

      // Add a small delay to ensure the context is resumed
      setTimeout(() => {
        // Use a promise to handle play() since it returns a promise
        audioRef.current.play().then(() => {
          console.log("Playback started successfully");
        }).catch(error => {
          console.error("Playback failed:", error);

          // Check if it's an autoplay policy error
          if (error.name === "NotAllowedError") {
            toast({
              title: "Autoplay Blocked",
              description: "Your browser blocked autoplay. Please click the play button again.",
              variant: "warning",
            });
          } else {
            toast({
              title: "Playback Error",
              description: "Could not play the audio. Trying alternative playback method...",
              variant: "destructive",
            });

            // Try an alternative approach - recreate the audio element
            if (song) {
              const newAudio = new Audio(song.audioUrl);
              newAudio.volume = volume / 100;
              newAudio.onplay = () => setIsPlaying(true);
              newAudio.onpause = () => setIsPlaying(false);
              newAudio.onended = () => setIsPlaying(false);

              // Replace the current audio reference
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = newAudio;
                newAudio.play().catch(e => {
                  console.error("Alternative playback failed:", e);
                  toast({
                    title: "Playback Failed",
                    description: "Please try again or refresh the page.",
                    variant: "destructive",
                  });
                });
              }
            }
          }
        });
      }, 100);
    }

    setIsPlaying(!isPlaying);
  }

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);

    // Apply volume change with improved handling
    if (audioRef.current) {
      // If we're using Web Audio API with a gain node
      if (audioRef.current._gainNode) {
        // Apply an exponential curve for more natural volume control
        // (human hearing perceives volume logarithmically)
        const gainValue = newVolume === 0 ? 0 : Math.pow(newVolume / 100, 1.5);

        // Use exponential ramp for smooth transition
        const time = audioContext.currentTime;
        audioRef.current._gainNode.gain.setTargetAtTime(gainValue, time, 0.01);
      } else {
        // Fallback to standard HTML5 Audio volume
        audioRef.current.volume = newVolume / 100;
      }
    }

    // Update mute state
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return;

    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    // Apply mute state with improved handling
    if (audioRef.current) {
      if (audioRef.current._gainNode && audioContext) {
        // Use Web Audio API for smoother transition
        const time = audioContext.currentTime;
        if (newMuteState) {
          // Store current gain for unmuting
          audioRef.current._previousGain = audioRef.current._gainNode.gain.value;
          audioRef.current._gainNode.gain.setTargetAtTime(0, time, 0.01);
        } else {
          // Restore previous gain or use volume setting
          const gainValue = audioRef.current._previousGain || volume / 100;
          audioRef.current._gainNode.gain.setTargetAtTime(gainValue, time, 0.01);
        }
      } else {
        // Fallback to standard HTML5 Audio
        audioRef.current.volume = newMuteState ? 0 : volume / 100;
      }
    }
  }

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
                    <AudioVisualizer
                      isPlaying={isPlaying}
                      audioFile={song ? { url: song.audioUrl } : null}
                      analyserNode={analyserNode}
                      currentTime={currentTime}
                      duration={duration}
                    />
                  </div>

                  <div className="flex justify-center items-center gap-4 mb-6">
                    <Button
                      onClick={togglePlayPause}
                      className="bg-purple-600 hover:bg-purple-700 rounded-full h-12 w-12 flex items-center justify-center"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:text-white"
                        onClick={toggleMute}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                      <div className="w-24">
                        <Slider
                          value={[volume]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={handleVolumeChange}
                        />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDownload}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
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

      {/* Hidden audio element */}
      {song && (
        <audio
          ref={audioRef}
          src={song.audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          preload="metadata"
        />
      )}

      <Toaster />
    </div>
  )
}
