/**
 * Premium Audio Processing Utilities
 * Advanced audio processing for professional-quality remixes
 */

// Define the audio processing parameters interface
export interface AudioProcessingParams {
  // Basic parameters
  bassBoost: number;        // 0-100: Bass boost intensity
  trebleEnhance: number;    // 0-100: Treble enhancement
  compression: number;      // 0-100: Dynamic range compression
  stereoWidth: number;      // 0-100: Stereo field width
  saturation: number;       // 0-100: Harmonic saturation/distortion
  
  // Advanced parameters
  sidechainAmount: number;  // 0-100: Sidechain compression amount
  sidechainRelease: number; // 50-500: Release time in ms
  reverbMix: number;        // 0-100: Reverb wet/dry mix
  delayMix: number;         // 0-100: Delay wet/dry mix
  delayTime: number;        // 0-1000: Delay time in ms
  
  // Mastering parameters
  limiterThreshold: number; // -20 to 0: Limiter threshold in dB
  outputGain: number;       // -12 to 12: Output gain in dB
  
  // Effect parameters
  filterCutoff: number;     // 20-20000: Filter cutoff frequency
  filterResonance: number;  // 0-30: Filter resonance/Q
  filterType: string;       // "lowpass", "highpass", "bandpass", "notch"
  
  // Modulation parameters
  lfoRate: number;          // 0-20: LFO rate in Hz
  lfoDepth: number;         // 0-100: LFO modulation depth
  lfoTarget: string;        // "filter", "volume", "pan"
}

// Premium preset interface
export interface PremiumPreset {
  name: string;
  description: string;
  category: string;
  bpmRange: [number, number];
  keyCompatibility: string[];
  parameters: AudioProcessingParams;
  soundElements: string[];
  referenceArtists: string[];
}

// Define premium EDM presets with professional parameters
export const premiumEdmPresets: Record<string, PremiumPreset> = {
  // Bass Boost preset - Deep, powerful bass with clean highs
  "bass_boost": {
    name: "Bass Boost",
    description: "Deep, powerful bass with clean highs and punchy transients",
    category: "EDM",
    bpmRange: [120, 140],
    keyCompatibility: ["C Minor", "G Minor", "F Minor", "D Minor"],
    parameters: {
      bassBoost: 80,
      trebleEnhance: 60,
      compression: 70,
      stereoWidth: 75,
      saturation: 40,
      sidechainAmount: 65,
      sidechainRelease: 150,
      reverbMix: 20,
      delayMix: 15,
      delayTime: 250,
      limiterThreshold: -3,
      outputGain: 1.5,
      filterCutoff: 100,
      filterResonance: 6,
      filterType: "lowpass",
      lfoRate: 0.25,
      lfoDepth: 20,
      lfoTarget: "filter"
    },
    soundElements: ["808 sub bass", "layered kicks", "compressed snares", "filtered hi-hats"],
    referenceArtists: ["Martin Garrix", "Tiësto", "Hardwell"]
  },
  
  // Dubstep Wobble preset - Aggressive, modulated bass with heavy drops
  "dubstep_wobble": {
    name: "Dubstep Wobble",
    description: "Aggressive, modulated bass with heavy drops and metallic textures",
    category: "Dubstep",
    bpmRange: [135, 150],
    keyCompatibility: ["F Minor", "G Minor", "A Minor"],
    parameters: {
      bassBoost: 85,
      trebleEnhance: 70,
      compression: 80,
      stereoWidth: 65,
      saturation: 75,
      sidechainAmount: 50,
      sidechainRelease: 100,
      reverbMix: 25,
      delayMix: 20,
      delayTime: 333,
      limiterThreshold: -2,
      outputGain: 1,
      filterCutoff: 500,
      filterResonance: 12,
      filterType: "lowpass",
      lfoRate: 4,
      lfoDepth: 90,
      lfoTarget: "filter"
    },
    soundElements: ["wobble bass", "growl bass", "metallic percussion", "glitch effects"],
    referenceArtists: ["Skrillex", "Excision", "Virtual Riot"]
  },
  
  // Techno Beat preset - Hypnotic, driving rhythm with analog warmth
  "techno_beat": {
    name: "Techno Beat",
    description: "Hypnotic, driving rhythm with analog warmth and spatial depth",
    category: "Techno",
    bpmRange: [125, 135],
    keyCompatibility: ["C Minor", "D Minor", "F Minor", "G Minor"],
    parameters: {
      bassBoost: 65,
      trebleEnhance: 50,
      compression: 60,
      stereoWidth: 70,
      saturation: 55,
      sidechainAmount: 40,
      sidechainRelease: 200,
      reverbMix: 35,
      delayMix: 30,
      delayTime: 375,
      limiterThreshold: -4,
      outputGain: 0.5,
      filterCutoff: 800,
      filterResonance: 4,
      filterType: "bandpass",
      lfoRate: 0.5,
      lfoDepth: 30,
      lfoTarget: "filter"
    },
    soundElements: ["analog kick", "modular percussion", "acid bass", "atmospheric pads"],
    referenceArtists: ["Charlotte de Witte", "Amelie Lens", "Adam Beyer"]
  },
  
  // Trance Vibe preset - Euphoric, uplifting with lush pads
  "trance_vibe": {
    name: "Trance Vibe",
    description: "Euphoric, uplifting with lush pads and emotional arpeggios",
    category: "Trance",
    bpmRange: [130, 140],
    keyCompatibility: ["A Minor", "E Minor", "D Minor", "B Minor"],
    parameters: {
      bassBoost: 60,
      trebleEnhance: 75,
      compression: 65,
      stereoWidth: 90,
      saturation: 35,
      sidechainAmount: 60,
      sidechainRelease: 180,
      reverbMix: 45,
      delayMix: 40,
      delayTime: 500,
      limiterThreshold: -3.5,
      outputGain: 1,
      filterCutoff: 1200,
      filterResonance: 8,
      filterType: "lowpass",
      lfoRate: 8,
      lfoDepth: 40,
      lfoTarget: "pan"
    },
    soundElements: ["rolling bassline", "uplifting pads", "arpeggiated synths", "emotional leads"],
    referenceArtists: ["Armin van Buuren", "Above & Beyond", "Aly & Fila"]
  },
  
  // House Party preset - Groovy, energetic with vocal chops
  "house_party": {
    name: "House Party",
    description: "Groovy, energetic with vocal chops and bouncy percussion",
    category: "House",
    bpmRange: [120, 128],
    keyCompatibility: ["C Major", "G Major", "A Minor", "E Minor"],
    parameters: {
      bassBoost: 70,
      trebleEnhance: 65,
      compression: 55,
      stereoWidth: 80,
      saturation: 45,
      sidechainAmount: 70,
      sidechainRelease: 120,
      reverbMix: 30,
      delayMix: 25,
      delayTime: 125,
      limiterThreshold: -2.5,
      outputGain: 1.2,
      filterCutoff: 2000,
      filterResonance: 5,
      filterType: "lowpass",
      lfoRate: 1,
      lfoDepth: 15,
      lfoTarget: "volume"
    },
    soundElements: ["funky bass", "vocal chops", "piano stabs", "disco elements"],
    referenceArtists: ["Fisher", "Chris Lake", "Solardo"]
  },
  
  // Future Bass preset - Emotional with wide supersaws
  "future_bass": {
    name: "Future Bass",
    description: "Emotional with wide supersaws and trap-influenced beats",
    category: "Future Bass",
    bpmRange: [140, 160],
    keyCompatibility: ["C Major", "A Minor", "F Major", "D Minor"],
    parameters: {
      bassBoost: 75,
      trebleEnhance: 70,
      compression: 75,
      stereoWidth: 95,
      saturation: 50,
      sidechainAmount: 80,
      sidechainRelease: 150,
      reverbMix: 40,
      delayMix: 30,
      delayTime: 166,
      limiterThreshold: -3,
      outputGain: 1.5,
      filterCutoff: 1500,
      filterResonance: 10,
      filterType: "lowpass",
      lfoRate: 2,
      lfoDepth: 60,
      lfoTarget: "filter"
    },
    soundElements: ["supersaw chords", "trap drums", "vocal chops", "emotional melodies"],
    referenceArtists: ["Flume", "Illenium", "San Holo"]
  }
};

/**
 * Apply audio processing parameters to Web Audio API nodes
 * @param audioContext The Web Audio API context
 * @param sourceNode The audio source node
 * @param params The audio processing parameters
 * @returns Connected audio processing chain
 */
export function createPremiumAudioChain(
  audioContext: AudioContext,
  sourceNode: AudioNode,
  params: AudioProcessingParams
) {
  // Create audio processing nodes
  const bassBoostNode = createBassBoostNode(audioContext, params.bassBoost);
  const compressorNode = createCompressorNode(audioContext, params.compression);
  const stereoWidthNode = createStereoWidthNode(audioContext, params.stereoWidth);
  const saturationNode = createSaturationNode(audioContext, params.saturation);
  const filterNode = createFilterNode(audioContext, params);
  const reverbNode = createReverbNode(audioContext, params.reverbMix);
  const delayNode = createDelayNode(audioContext, params);
  const limiterNode = createLimiterNode(audioContext, params);
  const outputGainNode = audioContext.createGain();
  
  // Set output gain
  outputGainNode.gain.value = dbToGain(params.outputGain);
  
  // Connect the audio processing chain
  sourceNode
    .connect(bassBoostNode)
    .connect(compressorNode)
    .connect(stereoWidthNode)
    .connect(saturationNode)
    .connect(filterNode)
    .connect(reverbNode)
    .connect(delayNode)
    .connect(limiterNode)
    .connect(outputGainNode);
  
  // Return the output node
  return outputGainNode;
}

// Helper functions for creating audio processing nodes
function createBassBoostNode(audioContext: AudioContext, amount: number) {
  const bassBoost = audioContext.createBiquadFilter();
  bassBoost.type = "lowshelf";
  bassBoost.frequency.value = 200;
  bassBoost.gain.value = amount / 10; // Scale 0-100 to 0-10 dB
  return bassBoost;
}

function createCompressorNode(audioContext: AudioContext, amount: number) {
  const compressor = audioContext.createDynamicsCompressor();
  compressor.threshold.value = -24 + (amount / 100) * 20; // Scale 0-100 to -24 to -4 dB
  compressor.knee.value = 30 - (amount / 100) * 25; // Scale 0-100 to 30 to 5
  compressor.ratio.value = 1 + (amount / 100) * 19; // Scale 0-100 to 1 to 20
  compressor.attack.value = 0.003 + (amount / 100) * 0.097; // Scale 0-100 to 3ms to 100ms
  compressor.release.value = 0.25 + (amount / 100) * 0.75; // Scale 0-100 to 250ms to 1s
  return compressor;
}

function createStereoWidthNode(audioContext: AudioContext, amount: number) {
  // Implement stereo width processing
  const stereoWidth = audioContext.createGain();
  // In a real implementation, this would use a more complex stereo width algorithm
  return stereoWidth;
}

function createSaturationNode(audioContext: AudioContext, amount: number) {
  // Implement saturation/distortion processing
  const saturation = audioContext.createWaveShaper();
  // Create a distortion curve based on the amount
  const curve = new Float32Array(44100);
  const amount2 = amount / 100 * 50;
  for (let i = 0; i < 44100; i++) {
    const x = (i * 2) / 44100 - 1;
    curve[i] = (3 + amount2) * x * 20 * (Math.PI / 180) / (Math.PI + amount2 * Math.abs(x));
  }
  saturation.curve = curve;
  saturation.oversample = "4x";
  return saturation;
}

function createFilterNode(audioContext: AudioContext, params: AudioProcessingParams) {
  const filter = audioContext.createBiquadFilter();
  filter.type = params.filterType as BiquadFilterType;
  filter.frequency.value = params.filterCutoff;
  filter.Q.value = params.filterResonance / 10; // Scale 0-30 to 0-3
  
  // Add LFO if needed
  if (params.lfoTarget === "filter" && params.lfoDepth > 0) {
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    
    lfo.frequency.value = params.lfoRate;
    lfoGain.gain.value = params.filterCutoff * (params.lfoDepth / 100);
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  }
  
  return filter;
}

function createReverbNode(audioContext: AudioContext, amount: number) {
  // In a real implementation, this would use convolution reverb
  // For now, we'll use a simple delay-based reverb approximation
  const reverb = audioContext.createGain();
  return reverb;
}

function createDelayNode(audioContext: AudioContext, params: AudioProcessingParams) {
  if (params.delayMix <= 0) {
    return audioContext.createGain(); // Passthrough
  }
  
  const delay = audioContext.createDelay();
  const feedback = audioContext.createGain();
  const dryGain = audioContext.createGain();
  const wetGain = audioContext.createGain();
  const output = audioContext.createGain();
  
  delay.delayTime.value = params.delayTime / 1000; // Convert ms to seconds
  feedback.gain.value = 0.4; // Fixed feedback amount
  
  dryGain.gain.value = 1 - (params.delayMix / 100);
  wetGain.gain.value = params.delayMix / 100;
  
  // Connect the delay network
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wetGain);
  
  // Connect dry and wet paths to output
  dryGain.connect(output);
  wetGain.connect(output);
  
  // Create a wrapper node to handle input and output
  const inputNode = audioContext.createGain();
  inputNode.connect(delay);
  inputNode.connect(dryGain);
  
  return inputNode;
}

function createLimiterNode(audioContext: AudioContext, params: AudioProcessingParams) {
  const limiter = audioContext.createDynamicsCompressor();
  limiter.threshold.value = params.limiterThreshold;
  limiter.knee.value = 0.0; // Hard knee
  limiter.ratio.value = 20.0; // Limiting ratio
  limiter.attack.value = 0.001; // 1ms attack
  limiter.release.value = 0.050; // 50ms release
  return limiter;
}

// Utility function to convert dB to gain
function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

// Utility function to convert gain to dB
function gainToDb(gain: number): number {
  return 20 * Math.log10(gain);
}
