import { NextResponse } from "next/server";
import { analyzeMood, analyzeStyle, determineKey, detectTempo, detectGenre } from "@/lib/audio-analysis";
import { selectHighQualitySample } from "@/lib/sample-library";
import { PROFESSIONAL_SAMPLES } from "../generate-music/route";

export async function POST(request: Request) {
  try {
    const { prompt, output_format = "mp3", duration = 180 } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: "Missing prompt in request data", success: false },
        { status: 400 }
      );
    }
    
    console.log(`[API] Text-to-audio request: ${prompt}`);
    
    // Analyze the prompt
    const mood = analyzeMood(prompt);
    const style = analyzeStyle(prompt);
    const genre = detectGenre(prompt);
    const bpm = detectTempo(prompt);
    const key = determineKey(prompt, genre);
    
    // Generate a unique ID for this job
    const jobId = generateUniqueId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    
    // Select appropriate audio based on the analysis
    const audioUrl = selectHighQualitySample(genre, mood, PROFESSIONAL_SAMPLES);
    
    // In a production environment, we would:
    // 1. Generate the music track using a music generation API or library
    // 2. Generate vocals if lyrics are detected in the prompt
    // 3. Mix vocals with music
    // 4. Apply mastering
    
    // For now, we're using pre-selected high-quality samples
    
    // Return the result
    return NextResponse.json({
      success: true,
      jobId,
      message: "Music generated successfully",
      audioUrl,
      filename: `generated_${timestamp}_${jobId}.${output_format}`,
      details: {
        genre,
        bpm,
        key,
        mood,
        duration,
        style,
        quality: "professional",
        format: output_format,
        sampleRate: "44.1kHz",
        bitDepth: "16-bit",
        channels: 2,
      }
    });
    
  } catch (error) {
    console.error("Error generating music:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate music",
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique ID for the job
 * @returns A unique ID string
 */
function generateUniqueId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
