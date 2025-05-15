"use client"

import { useEffect, useRef } from "react"

// Add roundRect method to CanvasRenderingContext2D interface
declare global {
  interface CanvasRenderingContext2D {
    roundRect?: (x: number, y: number, width: number, height: number, radius: number) => void;
  }
}

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioFile: { url: string } | null;
  analyserNode: AnalyserNode | null;
  currentTime: number;
  duration: number;
}

export function AudioVisualizer({
  isPlaying,
  audioFile,
  analyserNode,
  currentTime,
  duration
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    if (!audioFile) {
      // Draw placeholder waveform
      ctx.fillStyle = "#3f3f46"
      ctx.fillRect(0, height / 2 - 1, width, 2)

      for (let i = 0; i < width; i += 3) {
        const h = Math.sin(i * 0.05) * 10 + 5
        ctx.fillStyle = "#52525b"
        ctx.fillRect(i, height / 2 - h / 2, 2, h)
      }
      return
    }

    // Draw visualization
    const drawFrame = () => {
      if (!canvas) return

      ctx.clearRect(0, 0, width, height)

      // Draw base line
      ctx.fillStyle = "#3f3f46"
      ctx.fillRect(0, height / 2 - 1, width, 2)

      // Draw progress indicator
      if (duration > 0) {
        const progress = (currentTime / duration) * width
        ctx.fillStyle = "#00c0c0"
        ctx.fillRect(0, height - 4, progress, 4)
      }

      if (isPlaying && analyserNode) {
        // Use real audio data if available
        try {
          analyserNode.fftSize = 512 // Increased for better resolution
          const bufferLength = analyserNode.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          analyserNode.getByteFrequencyData(dataArray)

          const barWidth = (width / bufferLength) * 2.5
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            // Apply a smoother curve to the visualization
            const barHeight = (dataArray[i] / 255) * height * 0.7

            // Create a gradient color based on frequency
            const hue = (i / bufferLength) * 180 + 180 // Cyan range (180-360)
            ctx.fillStyle = i % 3 === 0 ? `hsl(${hue}, 100%, 50%)` : `hsl(${hue}, 80%, 40%)`

            // Draw rounded bars for a more polished look
            const barY = height / 2 - barHeight / 2
            ctx.beginPath()

            // Use roundRect if available, otherwise fallback to regular rect
            if (ctx.roundRect) {
              ctx.roundRect(x, barY, barWidth, barHeight, 2)
            } else {
              ctx.rect(x, barY, barWidth, barHeight)
            }

            ctx.fill()

            x += barWidth + 1
          }
        } catch (error) {
          console.error("Visualization error:", error)
          // Fallback to simulated visualization
          for (let i = 0; i < width; i += 3) {
            const time = Date.now() * 0.001
            const h = Math.sin(i * 0.05 + time * 2) * 20 + Math.sin(i * 0.02 + time * 1.5) * 15 + Math.random() * 5

            const barHeight = Math.abs(h) + 5
            // Use cyan color palette
            ctx.fillStyle = i % 6 === 0 ? "#00e0e0" : "#00a0a0"
            ctx.beginPath()
            if (ctx.roundRect) {
              ctx.roundRect(i, height / 2 - barHeight / 2, 2, barHeight, 1)
            } else {
              ctx.rect(i, height / 2 - barHeight / 2, 2, barHeight)
            }
            ctx.fill()
          }
        }
      } else {
        // Draw static waveform
        for (let i = 0; i < width; i += 3) {
          const h = Math.sin(i * 0.05) * 15 + Math.sin(i * 0.02) * 10
          const barHeight = Math.abs(h) + 5
          ctx.fillStyle = "#52525b"
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(i, height / 2 - barHeight / 2, 2, barHeight, 1)
          } else {
            ctx.rect(i, height / 2 - barHeight / 2, 2, barHeight)
          }
          ctx.fill()
        }
      }

      animationRef.current = requestAnimationFrame(drawFrame)
    }

    drawFrame()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, audioFile, analyserNode, currentTime, duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full bg-zinc-800/30 rounded-lg p-4">
      <canvas ref={canvasRef} width={800} height={120} className="w-full h-[120px]" />
      <div className="flex justify-between mt-2 text-xs text-zinc-500">
        <span>{formatTime(currentTime || 0)}</span>
        <span>{formatTime(duration / 2 || 0)}</span>
        <span>{formatTime(duration || 0)}</span>
      </div>
    </div>
  )
}
