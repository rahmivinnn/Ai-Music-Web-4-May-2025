import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { text, voice = "female", effect = "none" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    console.log(`Generating audio for text: "${text}" with voice: ${voice} and effect: ${effect}`)

    // Simulasi panggilan ke backend Flask
    // Dalam implementasi nyata, ini akan memanggil backend Flask Anda
    try {
      // Simulasi delay untuk proses generasi
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Pilih sample audio berdasarkan voice
      let audioSample

      // Tentukan file audio berdasarkan voice dan effect
      if (voice === "male") {
        audioSample = effect === "none" ? "/samples/male-neutral-sample.mp3" : `/samples/male-${effect}-sample.mp3`
      } else if (voice === "female") {
        audioSample = effect === "none" ? "/samples/female-neutral-sample.mp3" : `/samples/female-${effect}-sample.mp3`
      } else if (voice === "neutral") {
        audioSample =
          effect === "none" ? "/samples/neutral-neutral-sample.mp3" : `/samples/neutral-${effect}-sample.mp3`
      } else if (voice === "warm") {
        audioSample = effect === "none" ? "/samples/warm-neutral-sample.mp3" : `/samples/warm-${effect}-sample.mp3`
      } else {
        audioSample = effect === "none" ? "/samples/deep-neutral-sample.mp3" : `/samples/deep-${effect}-sample.mp3`
      }

      // Fallback jika file tidak ditemukan
      const fallbackAudio = "/samples/neutral-neutral-sample.mp3"

      return NextResponse.json({
        success: true,
        audioUrl: audioSample,
        fallbackUrl: fallbackAudio,
        text,
        voice,
        effect,
      })
    } catch (error) {
      console.error("Error calling Flask backend:", error)
      throw new Error("Failed to generate audio from Flask backend")
    }
  } catch (error) {
    console.error("Error in generate-audio API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate audio" },
      { status: 500 },
    )
  }
}
