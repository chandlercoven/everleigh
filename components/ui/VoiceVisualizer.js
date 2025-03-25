import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';

const VoiceVisualizer = ({ isSpeaking, isRecording, size = 'medium', color = 'primary' }) => {
  const waveRef = useRef(null);
  const numBars = 12;

  // Calculate size based on prop
  const dimensionMap = {
    small: { containerSize: '60px', barWidth: '2px', gap: '2px' },
    medium: { containerSize: '100px', barWidth: '3px', gap: '3px' },
    large: { containerSize: '140px', barWidth: '4px', gap: '4px' },
  };

  const { containerSize, barWidth, gap } = dimensionMap[size] || dimensionMap.medium;

  // Animate bars based on speaking or recording state
  useEffect(() => {
    if (!waveRef.current) return;
    
    const bars = waveRef.current.querySelectorAll('.visualizer-bar');
    
    const animateBars = () => {
      bars.forEach((bar) => {
        const randomHeight = Math.floor(Math.random() * 70) + 10; // Random height between 10% and 80%
        bar.style.height = `${randomHeight}%`;
      });
    };
    
    let interval;
    
    if (isSpeaking || isRecording) {
      // Immediate initial animation
      animateBars();
      
      // Set up recurring animation with faster interval for mobile
      interval = setInterval(animateBars, isRecording ? 100 : 150);
    } else {
      // Reset all bars to minimum height when not active
      bars.forEach((bar) => {
        bar.style.height = '10%';
      });
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeaking, isRecording]);

  return (
    <Box
      sx={{
        width: containerSize,
        height: containerSize,
        borderRadius: '50%',
        backgroundColor: (theme) => theme.palette[color].main,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: (theme) => isRecording || isSpeaking 
          ? `0 0 0 4px ${theme.palette[color].main}30, 0 0 20px ${theme.palette[color].main}70` 
          : 'none',
        animation: isRecording 
          ? 'pulse 1.5s infinite ease-in-out' 
          : 'none',
        position: 'relative',
        '&::before': isRecording ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          backgroundColor: (theme) => theme.palette[color].main,
          opacity: 0.2,
          animation: 'ripple 2s infinite ease-out',
        } : {},
        '@keyframes ripple': {
          '0%': {
            transform: 'scale(1)',
            opacity: 0.2,
          },
          '100%': {
            transform: 'scale(1.5)',
            opacity: 0,
          },
        },
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(1)',
            boxShadow: (theme) => `0 0 0 4px ${theme.palette[color].main}30, 0 0 20px ${theme.palette[color].main}70`,
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: (theme) => `0 0 0 8px ${theme.palette[color].main}30, 0 0 30px ${theme.palette[color].main}70`,
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: (theme) => `0 0 0 4px ${theme.palette[color].main}30, 0 0 20px ${theme.palette[color].main}70`,
          },
        }
      }}
    >
      <Box
        ref={waveRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '70%',
          gap,
          transform: isRecording ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s ease',
        }}
      >
        {Array.from({ length: numBars }).map((_, index) => (
          <Box
            key={index}
            className="visualizer-bar"
            sx={{
              width: barWidth,
              height: '10%',
              backgroundColor: '#fff',
              borderRadius: '2px',
              transition: 'height 0.2s ease',
              transform: `translateY(${Math.sin(index * 0.5) * 5}px)`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default VoiceVisualizer; 