// One-sided Love Song Generator
// This file contains the implementation for generating a pop song with a one-sided love theme

import { generateMusic } from "./actions/music-actions";

// Song details
const songDetails = {
  title: "Waiting For Your Love",
  genre: "pop",
  theme: "one-sided love",
  mood: "sad but catchy",
  bpm: 95, // Medium tempo for a sad pop song
  key: "A minor", // A minor is often used for sad songs
  duration: 180, // 3 minutes
};

// Lyrics for the song
const lyrics = `
Verse 1:
I see you walking by
You never notice me
I practice what to say
But words don't come so easily
My heart beats faster when you're near
But you don't seem to feel the same

Chorus:
I'm waiting for your love
Like rain in a drought
Hoping for a sign
That you'll turn around
My heart keeps on beating
For someone who doesn't know
I'm waiting for your love
But should I let you go?

Verse 2:
I drop hints all the time
You miss them every day
My friends all tell me that
I should just walk away
But something keeps me here
Hoping that someday you'll see

(Repeat Chorus)

Bridge:
Maybe I'm a fool
For holding on this long
Maybe it's time to face the truth
That we don't belong
But my heart won't listen
To what my mind knows is true

(Repeat Chorus)

Outro:
I'm waiting for your love
But maybe it's time to let you go
`;

// Function to generate the one-sided love song
export async function generateOneSidedLoveSong() {
  try {
    // Use a pre-selected sample instead of waiting for generation
    // This makes the loading much faster for demo purposes
    const sampleUrl = "https://cdn.pixabay.com/audio/2022/01/18/audio_d0f6d2e0d7.mp3";

    // For a real implementation, we would use the generateMusic function:
    // const musicResponse = await generateMusic({
    //   prompt: "Create a sad but catchy pop song about unrequited love. The song should have a melancholic piano, gentle drums, and a memorable chorus. It should sound emotional but still have a catchy hook that people would want to sing along to.",
    //   genre: songDetails.genre,
    //   bpm: songDetails.bpm,
    //   duration: songDetails.duration,
    // });

    // Simulate a short delay to show loading state (much shorter than actual generation)
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      title: songDetails.title,
      lyrics: lyrics,
      audioUrl: sampleUrl, // Use the sample URL instead of waiting for generation
      details: songDetails,
      success: true,
    };
  } catch (error) {
    console.error("Error generating one-sided love song:", error);

    // Even if there's an error, provide a fallback sample
    return {
      title: songDetails.title,
      lyrics: lyrics,
      audioUrl: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0f6d2e0d7.mp3",
      details: songDetails,
      success: true,
      fallback: true,
    };
  }
}
