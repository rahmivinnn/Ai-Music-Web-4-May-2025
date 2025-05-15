/**
 * Client-side audio processing utilities using Web Audio API
 */

/**
 * Apply mastering effects to an audio buffer
 * @param audioContext The Web Audio API context
 * @param buffer The audio buffer to process
 * @returns Processed audio buffer
 */
export async function masterAudio(audioContext: AudioContext, buffer: AudioBuffer): Promise<AudioBuffer> {
  // Create nodes for the audio processing chain
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  
  // Create a compressor for dynamic range control
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24;
  compressor.knee.value = 30;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  
  // Create a gain node for level adjustment
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.7; // Adjust level to prevent clipping
  
  // Create a biquad filter for EQ
  const highShelf = audioContext.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 10000;
  highShelf.gain.value = 3;
  
  const lowShelf = audioContext.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 100;
  lowShelf.gain.value = 3;
  
  // Connect the nodes
  sourceNode.connect(compressor);
  compressor.connect(lowShelf);
  lowShelf.connect(highShelf);
  highShelf.connect(gainNode);
  
  // Create an offline context for rendering
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  // Clone the processing chain for the offline context
  const offlineSource = offlineContext.createBufferSource();
  offlineSource.buffer = buffer;
  
  const offlineCompressor = offlineContext.createDynamicsCompressor();
  offlineCompressor.threshold.value = compressor.threshold.value;
  offlineCompressor.knee.value = compressor.knee.value;
  offlineCompressor.ratio.value = compressor.ratio.value;
  offlineCompressor.attack.value = compressor.attack.value;
  offlineCompressor.release.value = compressor.release.value;
  
  const offlineGain = offlineContext.createGain();
  offlineGain.gain.value = gainNode.gain.value;
  
  const offlineHighShelf = offlineContext.createBiquadFilter();
  offlineHighShelf.type = highShelf.type;
  offlineHighShelf.frequency.value = highShelf.frequency.value;
  offlineHighShelf.gain.value = highShelf.gain.value;
  
  const offlineLowShelf = offlineContext.createBiquadFilter();
  offlineLowShelf.type = lowShelf.type;
  offlineLowShelf.frequency.value = lowShelf.frequency.value;
  offlineLowShelf.gain.value = lowShelf.gain.value;
  
  // Connect the offline nodes
  offlineSource.connect(offlineCompressor);
  offlineCompressor.connect(offlineLowShelf);
  offlineLowShelf.connect(offlineHighShelf);
  offlineHighShelf.connect(offlineGain);
  offlineGain.connect(offlineContext.destination);
  
  // Start the source and render
  offlineSource.start();
  
  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();
  return renderedBuffer;
}

/**
 * Apply reverb effect to an audio buffer
 * @param audioContext The Web Audio API context
 * @param buffer The audio buffer to process
 * @param reverbTime Reverb time in seconds
 * @returns Processed audio buffer
 */
export async function applyReverb(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  reverbTime: number = 2
): Promise<AudioBuffer> {
  // Create an impulse response for the reverb
  const impulseLength = audioContext.sampleRate * reverbTime;
  const impulse = audioContext.createBuffer(
    2,
    impulseLength,
    audioContext.sampleRate
  );
  
  // Fill the impulse buffer with decaying noise
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const impulseData = impulse.getChannelData(channel);
    for (let i = 0; i < impulseLength; i++) {
      impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
    }
  }
  
  // Create a convolver node with the impulse response
  const convolver = audioContext.createConvolver();
  convolver.buffer = impulse;
  
  // Create an offline context for rendering
  const offlineContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  
  // Create source and convolver in the offline context
  const offlineSource = offlineContext.createBufferSource();
  offlineSource.buffer = buffer;
  
  const offlineConvolver = offlineContext.createConvolver();
  offlineConvolver.buffer = impulse;
  
  // Create a gain node for the dry/wet mix
  const dryGain = offlineContext.createGain();
  dryGain.gain.value = 0.7; // 70% dry signal
  
  const wetGain = offlineContext.createGain();
  wetGain.gain.value = 0.3; // 30% wet signal
  
  // Connect the nodes
  offlineSource.connect(dryGain);
  offlineSource.connect(offlineConvolver);
  offlineConvolver.connect(wetGain);
  
  dryGain.connect(offlineContext.destination);
  wetGain.connect(offlineContext.destination);
  
  // Start the source and render
  offlineSource.start();
  
  // Render the audio
  const renderedBuffer = await offlineContext.startRendering();
  return renderedBuffer;
}

/**
 * Load an audio file from a URL and return as an AudioBuffer
 * @param audioContext The Web Audio API context
 * @param url URL of the audio file
 * @returns Audio buffer
 */
export async function loadAudioFromUrl(audioContext: AudioContext, url: string): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Convert an AudioBuffer to a Blob
 * @param audioBuffer The audio buffer to convert
 * @param format Output format (mp3 or wav)
 * @returns Blob of the audio data
 */
export async function audioBufferToBlob(audioBuffer: AudioBuffer, format: string = 'mp3'): Promise<Blob> {
  // For now, we'll only implement WAV conversion as MP3 encoding requires additional libraries
  if (format.toLowerCase() !== 'wav') {
    console.warn('Only WAV format is supported for direct conversion. Using WAV format.');
  }
  
  // Get the PCM data from the buffer
  const numOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  
  // Create the WAV file header
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);
  
  // Write the WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 for PCM)
  view.setUint16(22, numOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Write the PCM samples
  const dataView = new DataView(buffer);
  let offset = 44;
  
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      // Convert float to 16-bit PCM
      const value = Math.max(-1, Math.min(1, sample));
      const pcmValue = value < 0 ? value * 0x8000 : value * 0x7FFF;
      dataView.setInt16(offset, pcmValue, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
