import os
import logging
import tempfile
import subprocess
import numpy as np
import json
import re
from pydub import AudioSegment
import random

logger = logging.getLogger(__name__)

def generate_vocals(prompt):
    """
    Generate vocals from a text prompt
    
    Args:
        prompt: Text description of the desired vocals
        
    Returns:
        Path to the generated vocals
    """
    logger.info(f"Generating vocals from prompt: {prompt}")
    
    try:
        # Extract lyrics and vocal parameters from the prompt
        vocal_params = extract_vocal_params(prompt)
        logger.info(f"Extracted vocal parameters: {json.dumps(vocal_params)}")
        
        # Create a temporary directory for generated files
        temp_dir = tempfile.mkdtemp()
        
        # Generate the vocals
        vocals_path = os.path.join(temp_dir, "generated_vocals.wav")
        
        # Try to use ElevenLabs if available
        try:
            elevenlabs_vocals = generate_with_elevenlabs(vocal_params)
            if elevenlabs_vocals:
                return elevenlabs_vocals
        except Exception as e:
            logger.warning(f"ElevenLabs generation failed: {str(e)}")
        
        # Try to use Bark if available
        try:
            bark_vocals = generate_with_bark(vocal_params)
            if bark_vocals:
                return bark_vocals
        except Exception as e:
            logger.warning(f"Bark generation failed: {str(e)}")
        
        # Fall back to a simple synthesized voice
        return synthesize_simple_vocals(vocal_params, vocals_path)
        
    except Exception as e:
        logger.error(f"Error generating vocals: {str(e)}", exc_info=True)
        
        # If generation fails, return a sample file
        return get_sample_vocals_file()

def extract_vocal_params(prompt):
    """
    Extract lyrics and vocal parameters from the prompt
    
    Args:
        prompt: Text description of the desired vocals
        
    Returns:
        Dictionary of vocal parameters
    """
    # Default parameters
    params = {
        "lyrics": "",
        "gender": "female",
        "style": "pop",
        "emotion": "neutral",
        "effects": {
            "reverb": 0.3,
            "delay": 0.0,
            "autotune": 0.0
        }
    }
    
    # Extract lyrics if they're in quotes
    lyrics_match = re.search(r'"([^"]*)"', prompt)
    if lyrics_match:
        params["lyrics"] = lyrics_match.group(1)
    else:
        # Try to extract a theme for the lyrics
        theme_match = re.search(r'about\s+([^,.]+)', prompt.lower())
        if theme_match:
            theme = theme_match.group(1)
            params["lyrics"] = generate_lyrics_from_theme(theme)
    
    # If no lyrics were found, generate some based on the prompt
    if not params["lyrics"]:
        params["lyrics"] = generate_lyrics_from_theme(prompt)
    
    # Extract gender
    if re.search(r'\b(male|man|guy|boy|masculine)\b', prompt.lower()):
        params["gender"] = "male"
    elif re.search(r'\b(female|woman|girl|feminine)\b', prompt.lower()):
        params["gender"] = "female"
    
    # Extract style
    style_patterns = {
        r'\b(pop)\b': "pop",
        r'\b(rock)\b': "rock",
        r'\b(r&b|rnb)\b': "rnb",
        r'\b(rap|hip hop|hip-hop)\b': "rap",
        r'\b(jazz)\b': "jazz",
        r'\b(folk)\b': "folk",
        r'\b(country)\b': "country",
        r'\b(opera|operatic)\b': "opera"
    }
    
    for pattern, style in style_patterns.items():
        if re.search(pattern, prompt.lower()):
            params["style"] = style
            break
    
    # Extract emotion
    emotion_patterns = {
        r'\b(happy|joyful|upbeat|cheerful)\b': "happy",
        r'\b(sad|melancholic|somber|depressing)\b': "sad",
        r'\b(angry|aggressive|intense)\b': "angry",
        r'\b(calm|peaceful|relaxed|chill)\b': "calm",
        r'\b(romantic|love|emotional)\b': "romantic",
        r'\b(nostalgic|retro|vintage)\b': "nostalgic"
    }
    
    for pattern, emotion in emotion_patterns.items():
        if re.search(pattern, prompt.lower()):
            params["emotion"] = emotion
            break
    
    # Extract effects
    if re.search(r'\b(reverb|echo|spacey|atmospheric)\b', prompt.lower()):
        params["effects"]["reverb"] = 0.7
    
    if re.search(r'\b(delay|echo)\b', prompt.lower()):
        params["effects"]["delay"] = 0.5
    
    if re.search(r'\b(autotune|vocoder|robotic)\b', prompt.lower()):
        params["effects"]["autotune"] = 0.7
    
    return params

def generate_lyrics_from_theme(theme):
    """
    Generate lyrics based on a theme
    
    Args:
        theme: Theme for the lyrics
        
    Returns:
        Generated lyrics
    """
    # In a real implementation, you would use a language model to generate lyrics
    # For now, we'll use some templates
    
    # Clean up the theme
    theme = theme.lower().strip()
    
    # Simple templates for different themes
    love_lyrics = [
        "I can't stop thinking about you\nEvery moment, every day\nYour love is all I need\nPlease don't ever go away",
        "When I look into your eyes\nI see a love so true\nNo matter what happens\nI'll always be with you",
        "Love is a journey we take together\nHand in hand, heart to heart\nThrough the storms and sunny weather\nNever wanting to be apart"
    ]
    
    sad_lyrics = [
        "The rain falls down like my tears\nEmpty days and lonely nights\nMemories of what we had\nSlowly fading from sight",
        "Broken promises, shattered dreams\nA heart that's torn apart\nI'm trying to move on\nBut you're still in my heart",
        "The silence is deafening\nIn this empty room\nYour absence is a presence\nThat fills me with gloom"
    ]
    
    happy_lyrics = [
        "The sun is shining bright today\nJust like the joy in my heart\nLife is a beautiful journey\nAnd this is just the start",
        "Dancing through life with a smile\nNothing can bring me down\nHappiness flows through my veins\nAs I spin and twirl around",
        "Every day is a gift\nA chance to laugh and play\nEmbracing all the little things\nThat brighten up my day"
    ]
    
    # Choose lyrics based on the theme
    if any(word in theme for word in ["love", "romance", "heart", "relationship"]):
        return random.choice(love_lyrics)
    elif any(word in theme for word in ["sad", "heartbreak", "lonely", "missing"]):
        return random.choice(sad_lyrics)
    elif any(word in theme for word in ["happy", "joy", "celebration", "fun"]):
        return random.choice(happy_lyrics)
    else:
        # Default to a generic template
        return f"This song is all about {theme}\nA melody that tells a story\nWords that come from the heart\nA rhythm that moves the soul"

def generate_with_elevenlabs(params):
    """
    Generate vocals using ElevenLabs API
    
    Args:
        params: Dictionary of vocal parameters
        
    Returns:
        Path to the generated vocals or None if generation fails
    """
    try:
        # Check if ElevenLabs is available
        import elevenlabs
        
        # Create a temporary file for the output
        temp_dir = tempfile.mkdtemp()
        output_path = os.path.join(temp_dir, "elevenlabs_vocals.wav")
        
        # Set up ElevenLabs API key
        api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not api_key:
            logger.warning("ElevenLabs API key not found")
            return None
        
        elevenlabs.set_api_key(api_key)
        
        # Choose a voice based on gender and style
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Default female voice
        
        if params["gender"] == "male":
            voice_id = "TxGEqnHWrfWFTfGW9XjX"  # Male voice
        
        # Generate the audio
        audio = elevenlabs.generate(
            text=params["lyrics"],
            voice=voice_id,
            model="eleven_monolingual_v1"
        )
        
        # Save the audio
        with open(output_path, "wb") as f:
            f.write(audio)
        
        logger.info(f"Generated vocals with ElevenLabs: {output_path}")
        return output_path
        
    except ImportError:
        logger.warning("ElevenLabs not installed")
        return None
    except Exception as e:
        logger.error(f"Error generating with ElevenLabs: {str(e)}", exc_info=True)
        return None

def generate_with_bark(params):
    """
    Generate vocals using Bark
    
    Args:
        params: Dictionary of vocal parameters
        
    Returns:
        Path to the generated vocals or None if generation fails
    """
    try:
        # Check if Bark is available
        from bark import SAMPLE_RATE, generate_audio, preload_models
        
        # Create a temporary file for the output
        temp_dir = tempfile.mkdtemp()
        output_path = os.path.join(temp_dir, "bark_vocals.wav")
        
        # Preload models
        preload_models()
        
        # Choose a speaker based on gender and style
        speaker = "v2/en_speaker_6" if params["gender"] == "female" else "v2/en_speaker_9"
        
        # Generate the audio
        audio_array = generate_audio(params["lyrics"], speaker=speaker)
        
        # Save the audio
        import soundfile as sf
        sf.write(output_path, audio_array, SAMPLE_RATE)
        
        logger.info(f"Generated vocals with Bark: {output_path}")
        return output_path
        
    except ImportError:
        logger.warning("Bark not installed")
        return None
    except Exception as e:
        logger.error(f"Error generating with Bark: {str(e)}", exc_info=True)
        return None

def synthesize_simple_vocals(params, output_path):
    """
    Synthesize simple vocals using basic techniques
    
    Args:
        params: Dictionary of vocal parameters
        output_path: Path to save the vocals
        
    Returns:
        Path to the synthesized vocals
    """
    try:
        # In a real implementation, you would use a proper TTS system
        # For now, we'll create a simple synthesized voice
        
        # Create a temporary file for the output
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, "temp_vocals.wav")
        
        # Try to use the system's text-to-speech
        try:
            # For Windows
            if os.name == "nt":
                subprocess.run([
                    "powershell",
                    "-Command",
                    f"Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).SetOutputToWaveFile('{temp_path}'); (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('{params['lyrics']}')"
                ], check=True, capture_output=True)
                
                # Convert to the right format
                audio = AudioSegment.from_file(temp_path)
                
                # Apply effects
                audio = apply_vocal_effects(audio, params["effects"])
                
                # Export
                audio.export(output_path, format="wav")
                return output_path
                
            # For macOS
            elif os.name == "posix" and os.path.exists("/usr/bin/say"):
                subprocess.run([
                    "say",
                    "-o", temp_path,
                    params["lyrics"]
                ], check=True, capture_output=True)
                
                # Convert to the right format
                audio = AudioSegment.from_file(temp_path)
                
                # Apply effects
                audio = apply_vocal_effects(audio, params["effects"])
                
                # Export
                audio.export(output_path, format="wav")
                return output_path
        except Exception as e:
            logger.warning(f"System TTS failed: {str(e)}")
        
        # If system TTS fails, create a very basic synthesized voice
        return create_basic_vocals(params, output_path)
        
    except Exception as e:
        logger.error(f"Error synthesizing vocals: {str(e)}", exc_info=True)
        return get_sample_vocals_file()

def create_basic_vocals(params, output_path):
    """
    Create very basic vocals using simple synthesis
    
    Args:
        params: Dictionary of vocal parameters
        output_path: Path to save the vocals
        
    Returns:
        Path to the created vocals
    """
    try:
        # Create a simple sine wave carrier
        sample_rate = 44100
        
        # Base frequency depends on gender
        base_freq = 220 if params["gender"] == "female" else 110
        
        # Split lyrics into words
        words = params["lyrics"].replace("\n", " ").split()
        
        # Create an empty audio segment
        vocals = AudioSegment.empty()
        
        # Generate each word
        for word in words:
            # Duration based on word length
            duration = 0.3 + len(word) * 0.1  # seconds
            
            # Create time array
            t = np.linspace(0, duration, int(sample_rate * duration))
            
            # Create a carrier wave
            carrier = np.zeros_like(t)
            
            # Add harmonics
            for i in range(1, 5):
                # Frequency variation for each word
                freq_var = 1.0 + 0.05 * (random.random() - 0.5)
                freq = base_freq * i * freq_var
                
                # Amplitude decreases for higher harmonics
                amp = 0.8 / i
                
                # Add harmonic
                carrier += amp * np.sin(2 * np.pi * freq * t)
            
            # Apply an envelope
            envelope = np.ones_like(t)
            attack = int(0.1 * sample_rate)
            release = int(0.2 * sample_rate)
            
            # Attack
            envelope[:attack] = np.linspace(0, 1, attack)
            
            # Release
            if len(envelope) > release:
                envelope[-release:] = np.linspace(1, 0, release)
            
            # Apply envelope
            word_audio = carrier * envelope
            
            # Convert to AudioSegment
            word_segment = AudioSegment(
                word_audio.astype(np.float32).tobytes(),
                frame_rate=sample_rate,
                sample_width=4,
                channels=1
            )
            
            # Add to vocals
            vocals += word_segment
            
            # Add a short pause between words
            vocals += AudioSegment.silent(duration=50)  # 50ms pause
        
        # Convert to stereo
        vocals = vocals.set_channels(2)
        
        # Apply effects
        vocals = apply_vocal_effects(vocals, params["effects"])
        
        # Export
        vocals.export(output_path, format="wav")
        return output_path
        
    except Exception as e:
        logger.error(f"Error creating basic vocals: {str(e)}", exc_info=True)
        return get_sample_vocals_file()

def apply_vocal_effects(vocals, effects):
    """
    Apply effects to vocals
    
    Args:
        vocals: AudioSegment to process
        effects: Dictionary of effect parameters
        
    Returns:
        Processed AudioSegment
    """
    try:
        # Apply reverb
        if effects.get("reverb", 0) > 0:
            reverb_amount = effects["reverb"]
            reverb = vocals.fade_out(2000)
            reverb = reverb - 6  # Reduce volume
            
            # Mix with original
            vocals = vocals.overlay(reverb, position=100)
        
        # Apply delay
        if effects.get("delay", 0) > 0:
            delay_amount = effects["delay"]
            delay_time = 300  # milliseconds
            delay = vocals - 10  # Reduce volume
            
            # Add multiple delays
            delayed_vocals = vocals
            for i in range(1, 4):
                delayed_vocals = delayed_vocals.overlay(
                    delay, 
                    position=delay_time * i
                )
            
            vocals = delayed_vocals
        
        # Apply autotune (simplified)
        if effects.get("autotune", 0) > 0:
            # In a real implementation, you would use a proper autotune algorithm
            # This is a very simplified approach that just adds some harmonics
            
            # Convert to numpy array
            samples = np.array(vocals.get_array_of_samples())
            
            # Add harmonics
            autotune_amount = effects["autotune"]
            samples_float = samples.astype(np.float32) / (2**15 if vocals.sample_width == 2 else 2**31)
            
            # Add a fifth above (simplified autotune effect)
            samples_float += autotune_amount * 0.3 * np.roll(samples_float, 5)
            
            # Convert back to integer samples
            samples = (samples_float * (2**15 if vocals.sample_width == 2 else 2**31)).astype(
                np.int16 if vocals.sample_width == 2 else np.int32
            )
            
            # Create a new AudioSegment
            vocals = vocals._spawn(samples.tobytes())
        
        return vocals
        
    except Exception as e:
        logger.error(f"Error applying vocal effects: {str(e)}", exc_info=True)
        return vocals

def get_sample_vocals_file():
    """
    Get a sample vocals file
    
    Returns:
        Path to a sample vocals file
    """
    # Create a temporary file
    temp_dir = tempfile.mkdtemp()
    sample_path = os.path.join(temp_dir, "sample_vocals.wav")
    
    # Create a simple sine wave as a placeholder
    sample_rate = 44100
    duration = 10  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # A440 sine wave with vibrato
    vibrato_rate = 5  # Hz
    vibrato_depth = 5  # Hz
    
    frequency = 220 + vibrato_depth * np.sin(2 * np.pi * vibrato_rate * t)
    sine = 0.5 * np.sin(2 * np.pi * frequency * t)
    
    # Add some harmonics
    for i in range(2, 5):
        sine += 0.2 / i * np.sin(2 * np.pi * i * frequency * t)
    
    # Apply an envelope
    envelope = np.ones_like(t)
    envelope[:int(0.1 * sample_rate)] = np.linspace(0, 1, int(0.1 * sample_rate))
    envelope[-int(0.2 * sample_rate):] = np.linspace(1, 0, int(0.2 * sample_rate))
    
    sine *= envelope
    
    # Save as WAV
    try:
        import soundfile as sf
        sf.write(sample_path, sine, sample_rate)
    except ImportError:
        # If soundfile is not available, use a different approach
        audio_segment = AudioSegment(
            sine.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        )
        audio_segment = audio_segment.set_channels(2)
        audio_segment.export(sample_path, format="wav")
    
    logger.info(f"Created sample vocals file: {sample_path}")
    return sample_path
