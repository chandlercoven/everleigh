import { transcribeSpeech } from '../../lib/openai';
import formidable from 'formidable';
import fs from 'fs';

// Configure formidable to parse files
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Enhanced error handling for transcription API
 */
class TranscriptionError extends Error {
  constructor(message, status = 500, code = 'transcription_error', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'TranscriptionError';
  }
}

/**
 * API handler for audio transcription
 * Accepts an audio file and returns the transcribed text
 */
export default async function handler(req, res) {
  // Enable detailed logging in development or with DEBUG_API flag
  const enableDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_API === 'true';
  
  // Request start time for performance tracking
  const requestStartTime = Date.now();
  
  // Helper for consistent debug logging
  const logInfo = (message, data = {}) => {
    if (enableDebug) {
      console.log(`[${new Date().toISOString()}] [Transcribe API] ${message}`, data);
    }
  };
  
  logInfo('Received transcription request', {
    method: req.method,
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
  });

  // Method validation
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: {
        message: 'Method not allowed', 
        code: 'method_not_allowed',
        allowedMethods: ['POST']
      },
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logInfo('Missing OpenAI API key');
      throw new TranscriptionError(
        'Server misconfiguration - missing API key', 
        500, 
        'api_key_missing'
      );
    }

    // Parse the incoming form data
    logInfo('Parsing form data');
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max file size
      maxFields: 5,
      allowEmptyFiles: false,
      keepExtensions: true,
    });
    
    const [fields, files] = await form.parse(req).catch(err => {
      logInfo('Form parsing error', { error: err.message });
      throw new TranscriptionError(
        `Error parsing form data: ${err.message}`,
        400,
        'form_parse_error',
        { originalError: err.message }
      );
    });

    // Validate audio file
    if (!files.audio || files.audio.length === 0) {
      logInfo('Missing audio file');
      throw new TranscriptionError(
        'Audio file is required', 
        400, 
        'missing_file'
      );
    }

    const audioFile = files.audio[0];
    
    // Check file size
    if (audioFile.size === 0) {
      logInfo('Empty audio file');
      throw new TranscriptionError(
        'Audio file is empty', 
        400, 
        'empty_file'
      );
    }
    
    // Log file details
    logInfo('Received audio file', {
      filename: audioFile.originalFilename,
      filepath: audioFile.filepath,
      size: audioFile.size,
      mimetype: audioFile.mimetype,
    });
    
    // Create a Blob from the file
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    
    if (audioBuffer.length === 0) {
      logInfo('Empty audio buffer');
      throw new TranscriptionError(
        'Audio file could not be read correctly', 
        400, 
        'invalid_file_content'
      );
    }
    
    const fileBlob = new Blob([audioBuffer], { type: audioFile.mimetype });
    
    // Transcribe the audio using OpenAI Whisper
    logInfo('Starting transcription process');
    let transcription = '';
    
    try {
      transcription = await transcribeSpeech(fileBlob);
      logInfo('Transcription successful', { 
        transcriptionLength: transcription.length,
        sample: transcription.substring(0, 50)
      });
    } catch (openaiError) {
      logInfo('OpenAI transcription error', { error: openaiError.message });
      
      // Determine error type and provide helpful message
      let errorCode = 'transcription_failed';
      let errorStatus = 500;
      let errorMessage = 'Failed to transcribe audio';
      
      if (openaiError.message.includes('rate limit')) {
        errorCode = 'rate_limit';
        errorMessage = 'Transcription service is temporarily overloaded. Please try again in a moment.';
      } else if (openaiError.message.includes('format')) {
        errorCode = 'unsupported_format';
        errorMessage = 'Audio format not supported. Please use WAV, MP3, or M4A format.';
      } else if (openaiError.message.includes('timed out')) {
        errorCode = 'timeout';
        errorMessage = 'Transcription request timed out. Try with a shorter audio clip.';
      }
      
      throw new TranscriptionError(
        errorMessage,
        errorStatus,
        errorCode,
        { originalError: openaiError.message }
      );
    } finally {
      // Clean up the temporary file
      try {
        fs.unlinkSync(audioFile.filepath);
        logInfo('Temporary file deleted', { filepath: audioFile.filepath });
      } catch (cleanupError) {
        logInfo('Error cleaning up temp file', { 
          error: cleanupError.message,
          filepath: audioFile.filepath
        });
        // Continue processing - this is not a fatal error
      }
    }
    
    // If transcription is empty, return a helpful error
    if (!transcription || transcription.trim() === '') {
      logInfo('Empty transcription result');
      throw new TranscriptionError(
        'No speech detected in the audio. Please check your microphone and try speaking clearly.',
        422,
        'no_speech_detected'
      );
    }

    // Calculate processing time
    const processingTime = Date.now() - requestStartTime;
    logInfo('Transcription complete', { processingTimeMs: processingTime });

    // Return successful response
    return res.status(200).json({
      success: true,
      status: 'success',
      data: {
        transcription,
        timestamp: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    });
  } catch (error) {
    // Comprehensive error logging
    console.error('Error in transcription:', error);
    
    // Determine proper error response
    const status = error instanceof TranscriptionError ? error.status : 500;
    const errorCode = error instanceof TranscriptionError ? error.code : 'internal_server_error';
    const details = error instanceof TranscriptionError ? error.details : null;
    const errorMessage = error.message || 'An unexpected error occurred during transcription';
    
    // Log detailed error info
    logInfo('Transcription error response', {
      status,
      errorCode,
      errorMessage,
      details
    });
    
    // Return structured error response
    return res.status(status).json({
      success: false,
      status: 'error',
      error: {
        message: errorMessage,
        code: errorCode,
        details: details,
        trace: enableDebug ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    });
  }
} 