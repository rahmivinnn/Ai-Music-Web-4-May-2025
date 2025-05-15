import { NextResponse } from "next/server"
import { generateOneSidedLoveSong } from "../../one-sided-love-song"

export async function POST(request) {
  try {
    const { theme = "one-sided love", mood = "sad but catchy", vocals = "female" } = await request.json()

    console.log(`[API] Song generation requested: theme=${theme}, mood=${mood}, vocals=${vocals}`)

    // Generate the song
    const songData = await generateOneSidedLoveSong()

    return NextResponse.json({
      success: true,
      song: songData,
      message: "Song generated successfully",
    })
  } catch (error) {
    console.error("Error in song generation API:", error)
    return NextResponse.json(
      { 
        error: error.message || "Failed to generate song",
        success: false 
      }, 
      { status: 500 }
    )
  }
}
