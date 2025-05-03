import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const { prompt, voice = "alloy", model = "tts-1" } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log(`[DUMMY API] Text-to-speech requested: "${prompt}", voice: ${voice}, model: ${model}`)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Instead of generating real audio, we'll return a redirect to a sample audio file
    return NextResponse.json({
      success: true,
      message: "This is a dummy implementation. In a real implementation, this would return audio data.",
      audioUrl: "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
      isDummy: true,
    })
  } catch (error) {
    console.error("Error in dummy text-to-speech API:", error)
    return NextResponse.json({ error: error.message || "Failed to generate speech" }, { status: 500 })
  }
}
