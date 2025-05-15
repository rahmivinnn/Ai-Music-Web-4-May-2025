// Global type definitions

// Extend Window interface to include global audio context
interface Window {
  globalAudioContext?: AudioContext;
}

// Extend HTMLAudioElement to track connection status
interface HTMLAudioElement {
  _connected?: boolean;
}

// Extend GainNode to store previous gain value
interface GainNode {
  _previousGain?: number;
}

// Extend CanvasRenderingContext2D for browsers that support roundRect
interface CanvasRenderingContext2D {
  roundRect?: (x: number, y: number, width: number, height: number, radius: number) => void;
}
