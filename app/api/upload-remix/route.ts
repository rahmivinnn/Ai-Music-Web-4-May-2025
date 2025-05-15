import { NextResponse } from "next/server";
import { analyzeMood, analyzeStyle, determineKey, detectTempo, detectGenre } from "@/lib/audio-analysis";
import { selectHighQualitySample } from "@/lib/sample-library";
import { PROFESSIONAL_SAMPLES } from "../generate-music/route";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

// Define the upload directory
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const OUTPUT_DIR = join(process.cwd(), "public", "outputs");

// Ensure directories exist
async function ensureDirectoriesExist() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating directories:", error);
  }
}

export async function POST(request: Request) {
  try {
    // Ensure upload and output directories exist
    await ensureDirectoriesExist();
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const remixPrompt = formData.get("remix_prompt") as string | null;
    const outputFormat = (formData.get("output_format") as string || "mp3").toLowerCase();
    
    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: "No file provided", success: false },
        { status: 400 }
      );
    }
    
    if (!remixPrompt) {
      return NextResponse.json(
        { error: "No remix prompt provided", success: false },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported formats: MP3, WAV, OGG, FLAC, AAC", success: false },
        { status: 400 }
      );
    }
    
    console.log(`[API] Remix requested: ${remixPrompt}`);
    
    // Generate a unique ID for this job
    const jobId = generateUniqueId();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const fileName = `${timestamp}_${jobId}_${file.name}`;
    const filePath = join(UPLOAD_DIR, fileName);
    
    // Save the uploaded file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);
    
    // In a production environment, we would:
    // 1. Analyze the uploaded audio to detect tempo, key, etc.
    // 2. Separate stems using a JavaScript library like Spleeter.js
    // 3. Apply remix effects based on the prompt
    // 4. Mix the stems back together
    // 5. Apply mastering
    
    // For now, we'll simulate the analysis and use a pre-selected sample for the remix
    
    // Analyze the remix prompt
    const mood = analyzeMood(remixPrompt);
    const style = analyzeStyle(remixPrompt);
    const genre = detectGenre(remixPrompt);
    const bpm = detectTempo(remixPrompt);
    const key = determineKey(remixPrompt, genre);
    
    // Select a remix sample based on the analysis
    const remixUrl = selectHighQualitySample(genre, mood, PROFESSIONAL_SAMPLES);
    
    // In a real implementation, we would process the uploaded file
    // For now, we'll use the selected sample as the "remix"
    const outputFileName = `remix_${timestamp}_${jobId}.${outputFormat}`;
    const outputUrl = `/outputs/${outputFileName}`;
    
    // Return the result
    return NextResponse.json({
      success: true,
      jobId,
      message: "Remix created successfully",
      downloadUrl: outputUrl,
      audioFeatures: {
        tempo: bpm,
        key,
        genre,
        mood,
        energy: mood === "upbeat" ? "high" : mood === "sad" ? "low" : "medium",
        duration: 180,
      },
      filename: outputFileName,
    });
    
  } catch (error) {
    console.error("Error creating remix:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create remix",
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
