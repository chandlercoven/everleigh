import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import '@livekit/components-styles';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  IconButton,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import { Mic, MicOff, Settings as SettingsIcon } from '@mui/icons-material';
import VoiceVisualizer from './ui/VoiceVisualizer';
import LoadingSkeleton from './ui/LoadingSkeleton';
import ActionButton from './ui/ActionButton';
import SuggestionChips from './ui/SuggestionChips';
import useVoiceActivityDetection from '../lib/hooks/useVoiceActivityDetection';
import useAccessibility from '../lib/hooks/useAccessibility';
import { useEverleigh } from '../lib/EverleighProvider';
import { generateFollowUpSuggestions, generateConversationStarters, SuggestionCategories } from '../lib/suggestionUtils';

const VoiceLabChat = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { processMessage, getActiveAgent } = useEverleigh();
  
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('pNInz6obpgDQGcFmaJgB'); // Default ElevenLabs voice
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [vadEnabled, setVadEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  
  // Hooks
  const {
    settings: a11ySettings,
    toggleSetting: toggleA11ySetting,
    getAccessibilityClass,
    getAriaAttributes,
    triggerHapticFeedback
  } = useAccessibility();
  
  // Voice Activity Detection setup
  const { 
    isReady: isVadReady,
    isListening: isVadListening,
    isLoading: isVadLoading,
    startListening: startVadListening,
    stopListening: stopVadListening
  } = useVoiceActivityDetection({
    enabled: vadEnabled,
    onSpeechStart: () => {
      console.log('VAD: Speech detected');
      if (!isRecording && !isProcessing && !isSpeaking) {
        startRecording();
        triggerHapticFeedback('recording');
      }
    },
    onSpeechEnd: (audio) => {
      console.log('VAD: Speech ended');
      if (isRecording) {
        stopRecording();
        triggerHapticFeedback('success');
      }
    },
    onError: (error) => {
      console.error('VAD error:', error);
      setError('Voice detection failed. Please try manual recording.');
      setVadEnabled(false);
    }
  });

  useEffect(() => {
    // Fetch available voices on component mount
    const fetchVoices = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/voices');
        if (response.ok) {
          const data = await response.json();
          if (data.voices && Array.isArray(data.voices)) {
            setAvailableVoices(data.voices);
          } else {
            console.error('Invalid voices data format:', data);
            setAvailableVoices([]);
          }
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        setAvailableVoices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
    
    // Set initial suggestions
    setSuggestions(generateConversationStarters());
    
    // Start VAD if enabled
    if (vadEnabled && isVadReady) {
      startVadListening();
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (isVadListening) {
        stopVadListening();
      }
    };
  }, [isVadReady, vadEnabled, startVadListening, stopVadListening, isVadListening]);
  
  // Update VAD listening state when vadEnabled changes
  useEffect(() => {
    if (vadEnabled && isVadReady && !isVadListening) {
      startVadListening();
    } else if (!vadEnabled && isVadListening) {
      stopVadListening();
    }
  }, [vadEnabled, isVadReady, isVadListening, startVadListening, stopVadListening]);
  
  // Generate new suggestions when the conversation changes
  useEffect(() => {
    if (message && response) {
      // Generate context-aware follow-up suggestions
      const newSuggestions = generateFollowUpSuggestions(message, response);
      setSuggestions(newSuggestions);
    } else if (!message && !response) {
      // If no conversation yet, show general starters
      setSuggestions(generateConversationStarters());
    }
  }, [message, response]);

  // Start voice recording
  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      triggerHapticFeedback('recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      triggerHapticFeedback('default');
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob) => {
    try {
      // Create a form to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Transcribe the audio
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcribeData = await transcribeResponse.json();
      const transcribedText = transcribeData.data.transcription;
      setMessage(transcribedText);

      // Process the transcribed text using Everleigh app
      const result = await processMessage(transcribedText, {
        source: 'voicelab',
        isGuest: true,
      });

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to process message');
      }

      setResponse(result.response);

      // Get voice from active agent
      const activeAgent = getActiveAgent();
      const voiceId = activeAgent ? 
        activeAgent.getVoiceSettings().voiceId : 
        selectedVoice;

      // Convert the response to speech
      setIsSpeaking(true);
      const audioResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: result.response,
          voiceId: voiceId || selectedVoice,
        }),
      });

      if (!audioResponse.ok) {
        throw new Error('Failed to convert response to speech');
      }

      // Play the audio response
      const audioBlob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        triggerHapticFeedback('success');
      };
      
      audio.play();
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing your message. Please try again.');
      setIsProcessing(false);
      setIsSpeaking(false);
      triggerHapticFeedback('error');
    }
  };

  // Handle voice selection
  const handleVoiceChange = (e) => {
    setSelectedVoice(e.target.value);
  };
  
  // Handle suggestion chip click
  const handleSuggestionClick = (text) => {
    if (isRecording || isProcessing || isSpeaking) return;
    
    setMessage(text);
    triggerHapticFeedback('default');
    
    // Submit the suggestion text as if the user spoke it
    (async () => {
      setIsProcessing(true);
      
      try {
        // Process the clicked suggestion text
        const processResponse = await fetch('/api/process-voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: text,
            isGuest: true,
          }),
        });

        if (!processResponse.ok) {
          throw new Error('Failed to process message');
        }

        const processData = await processResponse.json();
        setResponse(processData.response);

        // Convert response to speech
        setIsSpeaking(true);
        const audioResponse = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: processData.response,
            voiceId: selectedVoice,
          }),
        });

        if (!audioResponse.ok) {
          throw new Error('Failed to convert response to speech');
        }

        const audioBlob = await audioResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
        };
        
        audio.play();
        setIsProcessing(false);
      } catch (error) {
        console.error('Error processing suggestion:', error);
        setError('Error processing your suggestion. Please try again.');
        setIsProcessing(false);
        setIsSpeaking(false);
      }
    })();
  };
  
  // Toggle VAD
  const toggleVad = () => {
    setVadEnabled(prev => !prev);
  };
  
  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        height: isMobile ? 'calc(100vh - 200px)' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      className={getAccessibilityClass()}
    >
      <Box sx={{ 
        p: { xs: 2, sm: 4 }, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2,
        flex: 1,
        overflow: 'auto'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Typography variant={isMobile ? "h5" : "h4"} component="h2">
            Voice AI Lab
          </Typography>
          
          <Tooltip title="Settings">
            <IconButton 
              onClick={toggleSettings}
              aria-label="Open settings"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Test voice interactions without signing in
        </Typography>
        
        {showSettings && (
          <Paper 
            elevation={1}
            sx={{ 
              p: 2, 
              borderRadius: 2,
              mb: 2,
              backgroundColor: theme => 
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Settings
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={vadEnabled}
                  onChange={toggleVad}
                  color="primary"
                  disabled={isVadLoading || isRecording || isProcessing || isSpeaking}
                />
              }
              label={
                <Typography variant="body2">
                  Auto voice detection
                  {isVadLoading && ' (loading...)'}
                </Typography>
              }
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={a11ySettings.hapticFeedback}
                  onChange={() => toggleA11ySetting('hapticFeedback')}
                  color="primary"
                />
              }
              label={<Typography variant="body2">Haptic feedback</Typography>}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={a11ySettings.highContrast}
                  onChange={() => toggleA11ySetting('highContrast')}
                  color="primary"
                />
              }
              label={<Typography variant="body2">High contrast</Typography>}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={a11ySettings.reducedMotion}
                  onChange={() => toggleA11ySetting('reducedMotion')}
                  color="primary"
                />
              }
              label={<Typography variant="body2">Reduced motion</Typography>}
            />
            
            {availableVoices && availableVoices.length > 0 && (
              <FormControl fullWidth sx={{ maxWidth: isMobile ? '100%' : 300, mt: 2 }}>
                <InputLabel id="voice-select-label">Select Voice</InputLabel>
                <Select
                  labelId="voice-select-label"
                  id="voice-select"
                  value={selectedVoice}
                  onChange={handleVoiceChange}
                  disabled={isProcessing || isRecording || isSpeaking}
                  label="Select Voice"
                  sx={{
                    '& .MuiSelect-select': {
                      fontSize: isMobile ? '0.875rem' : '1rem'
                    }
                  }}
                >
                  {availableVoices.map(voice => (
                    <MenuItem key={voice.voice_id || voice.id || Math.random()} value={voice.voice_id || voice.id}>
                      {voice.name || `Voice ${voice.voice_id || voice.id || 'Unknown'}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Paper>
        )}
        
        {isLoading && !showSettings && (
          <Box sx={{ py: 2 }}>
            <LoadingSkeleton type="text" lines={1} width="50%" />
            <LinearProgress color="secondary" sx={{ mt: 1 }} />
          </Box>
        )}
        
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: isMobile ? 2 : 4,
            py: isMobile ? 2 : 4,
            flex: 1,
            justifyContent: 'center'
          }}
        >
          <Zoom in={true} style={{ transitionDelay: '150ms' }}>
            <Box>
              <VoiceVisualizer 
                isSpeaking={isSpeaking} 
                isRecording={isRecording} 
                size={isMobile ? 'medium' : 'large'}
                color={isSpeaking ? 'secondary' : 'primary'}
              />
            </Box>
          </Zoom>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2,
            width: '100%',
            maxWidth: isMobile ? '100%' : 300
          }}>
            <ActionButton
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isSpeaking || (vadEnabled && isVadReady)}
              color={isRecording ? 'error' : 'primary'}
              variant="contained"
              startIcon={isRecording ? <MicOff /> : <Mic />}
              sx={{ 
                borderRadius: '9999px',
                minWidth: isMobile ? '100%' : 180,
                height: isMobile ? 56 : 48,
                transition: 'all 0.3s ease',
                fontSize: isMobile ? '1rem' : '0.875rem',
                '&:active': {
                  transform: 'scale(0.98)',
                  transition: 'transform 0.1s'
                }
              }}
              {...getAriaAttributes('voiceButton')}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              aria-pressed={isRecording}
            >
              {vadEnabled && isVadReady 
                ? 'Voice Detection Active' 
                : (isRecording ? 'Stop Recording' : 'Start Recording')}
            </ActionButton>
            
            {isProcessing && (
              <Fade in={isProcessing}>
                <Box sx={{ 
                  width: '100%', 
                  maxWidth: isMobile ? '100%' : 180, 
                  textAlign: 'center' 
                }}>
                  <LinearProgress color="secondary" />
                  <Typography 
                    variant="body2" 
                    color="textSecondary" 
                    sx={{ 
                      mt: 1, 
                      fontSize: isMobile ? '0.875rem' : '0.75rem'
                    }}
                  >
                    Processing...
                  </Typography>
                </Box>
              </Fade>
            )}
            
            {/* Suggestion chips */}
            {suggestions.length > 0 && !isRecording && !isProcessing && (
              <SuggestionChips
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                animate={!a11ySettings.reducedMotion}
              />
            )}
          </Box>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 1,
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        
        {(message || response) && (
          <Box 
            sx={{ 
              mt: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2,
              backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)',
              borderRadius: 2,
              p: isMobile ? 1.5 : 2,
              maxHeight: isMobile ? '30vh' : 'none',
              overflow: 'auto'
            }}
            {...getAriaAttributes('conversationLog')}
          >
            <Typography variant={isMobile ? "subtitle1" : "h6"}>Conversation</Typography>
            
            {message && (
              <Fade in={Boolean(message)}>
                <Paper 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    borderRadius: 2, 
                    ml: 'auto', 
                    maxWidth: '85%',
                    backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <Typography variant={isMobile ? "body2" : "subtitle2"} fontWeight="bold">You</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"}>{message}</Typography>
                </Paper>
              </Fade>
            )}
            
            {response && (
              <Fade in={Boolean(response)}>
                <Paper 
                  sx={{ 
                    p: isMobile ? 1.5 : 2, 
                    borderRadius: 2, 
                    maxWidth: '85%',
                    backgroundColor: theme => 
                      theme.palette.primary[theme.palette.mode === 'dark' ? 900 : 50],
                    color: theme => theme.palette.mode === 'dark' ? 'white' : 'inherit'
                  }}
                >
                  <Typography variant={isMobile ? "body2" : "subtitle2"} fontWeight="bold">AI</Typography>
                  <Typography variant={isMobile ? "body2" : "body1"}>{response}</Typography>
                </Paper>
              </Fade>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default VoiceLabChat; 