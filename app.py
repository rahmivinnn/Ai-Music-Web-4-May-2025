from flask import Flask, request, jsonify, send_file
import os
import uuid
import json
from werkzeug.utils import secure_filename
import logging
from datetime import datetime

# Import our custom modules
from audio_processing import preprocess_audio, detect_audio_features
from remix_engine import create_remix
from mastering import master_audio
from text_to_music import generate_music_from_text
from voice_synthesis import generate_vocals

app = Flask(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac', 'aac'}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload-remix', methods=['POST'])
def upload_remix():
    """
    Endpoint for uploading audio and generating a remix
    
    Expected form data:
    - file: The audio file to remix
    - remix_prompt: Text description of the desired remix style
    - output_format: 'mp3' or 'wav' (default: 'mp3')
    """
    try:
        # Check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        if not file or not allowed_file(file.filename):
            return jsonify({'error': f'File type not allowed. Supported formats: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
        
        # Get remix parameters
        remix_prompt = request.form.get('remix_prompt', '')
        output_format = request.form.get('output_format', 'mp3').lower()
        
        if output_format not in ['mp3', 'wav']:
            output_format = 'mp3'  # Default to mp3 if invalid format
        
        # Generate a unique ID for this job
        job_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save the uploaded file
        filename = secure_filename(file.filename)
        base_filename = f"{timestamp}_{job_id}_{filename}"
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], base_filename)
        file.save(upload_path)
        
        logger.info(f"File uploaded: {upload_path}")
        logger.info(f"Remix prompt: {remix_prompt}")
        
        # Process the audio file
        try:
            # Preprocess the audio (normalize, trim silence, etc.)
            preprocessed_path = preprocess_audio(upload_path)
            
            # Detect audio features (tempo, key, etc.)
            audio_features = detect_audio_features(preprocessed_path)
            logger.info(f"Detected audio features: {json.dumps(audio_features)}")
            
            # Create the remix
            remix_path = create_remix(preprocessed_path, remix_prompt, audio_features)
            
            # Master the audio
            output_filename = f"remix_{timestamp}_{job_id}.{output_format}"
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
            
            mastered_path = master_audio(remix_path, output_path)
            
            # Return the download link and audio information
            return jsonify({
                'success': True,
                'job_id': job_id,
                'message': 'Remix created successfully',
                'download_url': f"/download/{job_id}",
                'audio_features': audio_features,
                'filename': output_filename
            }), 200
            
        except Exception as e:
            logger.error(f"Error processing audio: {str(e)}", exc_info=True)
            return jsonify({'error': f'Error processing audio: {str(e)}'}), 500
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/text-to-audio', methods=['POST'])
def text_to_audio():
    """
    Endpoint for generating music from text description
    
    Expected JSON data:
    {
        "prompt": "Text description of the desired music",
        "output_format": "mp3" or "wav" (default: "mp3"),
        "duration": Maximum duration in seconds (default: 180)
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Missing prompt in request data'}), 400
        
        prompt = data['prompt']
        output_format = data.get('output_format', 'mp3').lower()
        duration = data.get('duration', 180)  # Default 3 minutes
        
        if output_format not in ['mp3', 'wav']:
            output_format = 'mp3'  # Default to mp3 if invalid format
        
        # Generate a unique ID for this job
        job_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        logger.info(f"Text-to-audio request: {prompt}")
        logger.info(f"Job ID: {job_id}")
        
        # Generate music from text
        try:
            # Generate the music track
            music_path = generate_music_from_text(prompt, duration)
            
            # Generate vocals if lyrics are detected in the prompt
            has_lyrics = "lyrics" in prompt.lower() or "vocal" in prompt.lower()
            
            if has_lyrics:
                # Extract lyrics from prompt (simplified approach)
                vocals_path = generate_vocals(prompt)
                
                # Mix vocals with music (handled inside the master_audio function)
                input_paths = [music_path, vocals_path]
            else:
                input_paths = [music_path]
            
            # Master the audio
            output_filename = f"generated_{timestamp}_{job_id}.{output_format}"
            output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
            
            mastered_path = master_audio(input_paths, output_path)
            
            # Return the download link
            return jsonify({
                'success': True,
                'job_id': job_id,
                'message': 'Music generated successfully',
                'download_url': f"/download/{job_id}",
                'filename': output_filename
            }), 200
            
        except Exception as e:
            logger.error(f"Error generating music: {str(e)}", exc_info=True)
            return jsonify({'error': f'Error generating music: {str(e)}'}), 500
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

@app.route('/download/<job_id>', methods=['GET'])
def download_file(job_id):
    """
    Endpoint for downloading generated audio files
    """
    try:
        # Find the file with the matching job_id
        for filename in os.listdir(app.config['OUTPUT_FOLDER']):
            if job_id in filename:
                file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
                return send_file(file_path, as_attachment=True)
        
        return jsonify({'error': 'File not found'}), 404
    
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        return jsonify({'error': f'Error downloading file: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Simple health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
