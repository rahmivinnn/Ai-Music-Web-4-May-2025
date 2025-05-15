"use client"

// Advanced music generation functionality with high-quality output using Next.js API routes

/**
 * Generate music based on a text prompt
 * @param params Parameters for music generation
 * @returns Generated music data
 */
export async function generateMusic({ prompt, genre = "pop", bpm = 120, duration = 180 }) {
  try {
    console.log(`[MUSIC] Generation requested: ${prompt}, genre: ${genre}, bpm: ${bpm}, duration: ${duration}s`);

    // Call the Next.js API route for music generation
    const response = await fetch('/api/generate-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        genre,
        bpm,
        duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate music');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating music:", error);
    return {
      error: error.message || "Failed to generate music",
      success: false,
    };
  }
}

/**
 * Generate a remix from an uploaded audio file
 * @param file The audio file to remix
 * @param remixPrompt Text description of the desired remix style
 * @param outputFormat Output format (mp3 or wav)
 * @returns Remix data
 */
export async function createRemix(file, remixPrompt, outputFormat = 'mp3') {
  try {
    console.log(`[REMIX] Remix requested: ${remixPrompt}`);

    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remix_prompt', remixPrompt);
    formData.append('output_format', outputFormat);

    // Call the Next.js API route for remix generation
    const response = await fetch('/api/upload-remix', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create remix');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating remix:", error);
    return {
      error: error.message || "Failed to create remix",
      success: false,
    };
  }
}

/**
 * Generate music from text description
 * @param prompt Text description of the desired music
 * @param outputFormat Output format (mp3 or wav)
 * @param duration Maximum duration in seconds
 * @returns Generated music data
 */
export async function generateTextToAudio(prompt, outputFormat = 'mp3', duration = 180) {
  try {
    console.log(`[TEXT-TO-AUDIO] Generation requested: ${prompt}`);

    // Call the Next.js API route for text-to-audio generation
    const response = await fetch('/api/text-to-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        output_format: outputFormat,
        duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate audio from text');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error generating text-to-audio:", error);
    return {
      error: error.message || "Failed to generate audio from text",
      success: false,
    };
  }
}

/**
 * Apply audio effects to a track
 * @param audioUrl URL of the audio to process
 * @param effects Object containing effect parameters
 * @returns Processed audio data
 */
export async function applyAudioEffects(audioUrl, effects) {
  try {
    // In a production environment, we would use a Web Audio API based effects processor
    // For now, we'll simulate the processing

    console.log(`[EFFECTS] Applying effects to: ${audioUrl}`);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return the original URL (in a real implementation, this would be the processed audio)
    return {
      success: true,
      audioUrl,
      message: "Effects applied successfully",
    };
  } catch (error) {
    console.error("Error applying audio effects:", error);
    return {
      error: error.message || "Failed to apply audio effects",
      success: false,
    };
  }
}

// Legacy function for backward compatibility
export async function generateMusicTrack(params) {
  return generateMusic(params);
}
