"use server"

export async function generateAudioFromText(formData: FormData) {
  try {
    const text = formData.get("text") as string
    const voice = (formData.get("voice") as string) || "female"
    const effect = (formData.get("effect") as string) || "none"

    if (!text?.trim()) {
      return {
        success: false,
        error: "Text is required",
      }
    }

    // Panggil API internal kita (yang akan mensimulasikan panggilan ke Flask)
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/generate-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice, effect }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate audio")
    }

    const data = await response.json()
    return {
      success: true,
      audioUrl: data.audioUrl,
      fallbackUrl: data.fallbackUrl,
      text,
      voice,
      effect,
    }
  } catch (error) {
    console.error("Error in generateAudioFromText:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate audio",
    }
  }
}

export async function fetchAudioFromFlask(text: string, voice = "female", effect = "none") {
  try {
    // Dalam implementasi nyata, ini akan memanggil backend Flask Anda di http://localhost:5000
    // Untuk demo, kita akan memanggil API internal kita
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/generate-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice, effect }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to generate audio")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error in fetchAudioFromFlask:", error)
    throw error
  }
}
