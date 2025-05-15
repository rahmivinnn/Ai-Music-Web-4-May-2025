/**
 * Audio utility functions for handling playback across browsers
 */

// Initialize AudioContext with proper browser support
export function createAudioContext(): AudioContext | null {
  try {
    // Check if AudioContext is available
    if (typeof window === 'undefined') return null;
    
    const AudioContextClass = window.AudioContext || 
                             (window as any).webkitAudioContext;
    
    if (!AudioContextClass) {
      console.warn('AudioContext not supported in this browser');
      return null;
    }
    
    return new AudioContextClass();
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    return null;
  }
}

// Check if audio can be played
export async function canPlayAudio(audioUrl: string): Promise<boolean> {
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    if (!response.ok) return false;
    
    const audio = new Audio();
    return new Promise((resolve) => {
      audio.oncanplaythrough = () => {
        resolve(true);
        audio.remove();
      };
      audio.onerror = () => {
        resolve(false);
        audio.remove();
      };
      audio.src = audioUrl;
      audio.load();
      
      // Set a timeout in case the audio never loads
      setTimeout(() => {
        resolve(false);
        audio.remove();
      }, 5000);
    });
  } catch (error) {
    console.error('Error checking audio playability:', error);
    return false;
  }
}

// Ensure user interaction before playing audio
export function requiresUserInteraction(): boolean {
  // Check if browser requires user interaction
  if (typeof window === 'undefined') return true;
  
  const audioContext = createAudioContext();
  if (!audioContext) return true;
  
  const isContextSuspended = audioContext.state === 'suspended';
  audioContext.close();
  
  return isContextSuspended;
}

// Get alternative audio format if primary format fails
export function getAlternativeFormat(audioUrl: string): string {
  if (!audioUrl) return '';
  
  // If it's an MP3, try OGG or WAV
  if (audioUrl.endsWith('.mp3')) {
    return audioUrl.replace('.mp3', '.ogg');
  }
  
  // If it's an OGG, try MP3 or WAV
  if (audioUrl.endsWith('.ogg')) {
    return audioUrl.replace('.ogg', '.mp3');
  }
  
  // Default to MP3 if format is unknown
  if (!audioUrl.includes('.mp3') && !audioUrl.includes('.ogg') && !audioUrl.includes('.wav')) {
    return `${audioUrl}.mp3`;
  }
  
  return audioUrl;
}

// Preload audio files for faster playback
export function preloadAudio(audioUrls: string[]): void {
  if (typeof window === 'undefined') return;
  
  audioUrls.forEach(url => {
    if (!url) return;
    
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    
    // Remove the element after preloading to avoid memory leaks
    audio.oncanplaythrough = () => {
      setTimeout(() => audio.remove(), 1000);
    };
    
    audio.onerror = () => audio.remove();
  });
}

// Create a waveform visualization from audio data
export function createWaveform(
  canvas: HTMLCanvasElement,
  analyserNode: AnalyserNode | null,
  isPlaying: boolean,
  currentTime: number,
  duration: number
): void {
  if (!canvas || !analyserNode) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw base line
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(0, height / 2 - 1, width, 2);
  
  // Draw progress indicator
  if (duration > 0) {
    const progress = (currentTime / duration) * width;
    ctx.fillStyle = "#00c0c0";
    ctx.fillRect(0, height - 4, progress, 4);
  }
  
  if (isPlaying) {
    try {
      // Use real audio data
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);
      
      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.7;
        
        // Create a gradient color
        const hue = (i / bufferLength) * 180 + 180; // Cyan range
        ctx.fillStyle = i % 3 === 0 ? `hsl(${hue}, 100%, 50%)` : `hsl(${hue}, 80%, 40%)`;
        
        // Draw rounded bars
        const barY = height / 2 - barHeight / 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, barY, barWidth, barHeight, 2);
        } else {
          // Fallback for browsers that don't support roundRect
          ctx.rect(x, barY, barWidth, barHeight);
        }
        ctx.fill();
        
        x += barWidth + 1;
      }
    } catch (error) {
      // Fallback to simulated visualization
      drawSimulatedWaveform(ctx, width, height, true);
    }
  } else {
    // Draw static waveform
    drawSimulatedWaveform(ctx, width, height, false);
  }
}

// Draw a simulated waveform when real audio data isn't available
function drawSimulatedWaveform(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  animate: boolean
): void {
  for (let i = 0; i < width; i += 3) {
    let h;
    if (animate) {
      const time = Date.now() * 0.001;
      h = Math.sin(i * 0.05 + time * 2) * 20 + Math.sin(i * 0.02 + time * 1.5) * 15 + Math.random() * 5;
    } else {
      h = Math.sin(i * 0.05) * 15 + Math.sin(i * 0.02) * 10;
    }
    
    const barHeight = Math.abs(h) + 5;
    ctx.fillStyle = animate ? (i % 6 === 0 ? "#00e0e0" : "#00a0a0") : "#52525b";
    
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(i, height / 2 - barHeight / 2, 2, barHeight, 1);
    } else {
      // Fallback for browsers that don't support roundRect
      ctx.rect(i, height / 2 - barHeight / 2, 2, barHeight);
    }
    ctx.fill();
  }
}
