# EDM Remix Sample Files

This directory should contain sample EDM tracks for the remix feature.

## Required Sample Files

The application expects these sample files:

- `progressive-house-sample.mp3` - Progressive House style (128 BPM, C Minor)
- `future-bass-sample.mp3` - Future Bass style (150 BPM, C Minor)
- `bass-house-sample.mp3` - Bass House style (128 BPM, G Minor)
- `tropical-house-sample.mp3` - Tropical House style (104 BPM, D Major)
- `dubstep-sample.mp3` - Dubstep style (140 BPM, F Minor)

## Sample Sources

For development and testing, we're using royalty-free samples from:

1. Mixkit (https://mixkit.co/)
2. Uppbeat (https://uppbeat.io/)
3. Soundstripe (https://soundstripe.com/)

## Adding New Samples

When adding new samples:
1. Use high-quality audio files (320kbps MP3 or WAV)
2. Ensure they match the EDM subgenre characteristics
3. Update the `remix-utils.ts` file with the new sample information

## Note on Audio Quality

All samples should be:
- Properly mastered with -1dB peak
- Stereo (not mono)
- Free of clipping or distortion
- 44.1kHz sample rate
- At least 30 seconds in length
