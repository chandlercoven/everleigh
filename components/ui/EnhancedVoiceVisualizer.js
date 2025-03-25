import { Box, useTheme } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import useAnimatedAssistant from '../../lib/hooks/useAnimatedAssistant';

/**
 * Enhanced voice visualizer with advanced animations
 * Based on the assistant's state (listening, processing, speaking, idle)
 */
const EnhancedVoiceVisualizer = ({ 
  isSpeaking = false, 
  isRecording = false, 
  isProcessing = false,
  voiceVolume = 0,
  waveformData = null,
  size = 'medium', 
  color = 'primary',
  hapticFeedback = true,
  animationType = 'wave' // wave, particle, pulse, ripple
}) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use our animated assistant hook to get animation state
  const { 
    currentState, 
    animationProps,
    stateAnimations
  } = useAnimatedAssistant({
    isRecording,
    isProcessing,
    isSpeaking,
    voiceVolume,
    currentAudioWaveform: waveformData,
    hapticFeedbackEnabled: hapticFeedback
  });

  // Calculate size based on prop
  const dimensionMap = {
    small: { containerSize: '60px', barWidth: '2px', gap: '2px' },
    medium: { containerSize: '100px', barWidth: '3px', gap: '3px' },
    large: { containerSize: '140px', barWidth: '4px', gap: '4px' },
    xlarge: { containerSize: '180px', barWidth: '5px', gap: '4px' },
  };

  const { containerSize, barWidth, gap } = dimensionMap[size] || dimensionMap.medium;
  
  // Get color from theme
  const getColor = (colorName) => {
    if (colorName === 'primary') return theme.palette.primary.main;
    if (colorName === 'secondary') return theme.palette.secondary.main;
    if (colorName === 'accent') return theme.palette.error.main; // Using error as accent
    if (colorName === 'neutral') return theme.palette.text.secondary;
    return colorName; // Allow direct color values
  };

  // Setup and cleanup canvas animation if using particle effect
  useEffect(() => {
    if (animationType !== 'particle' || !containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = parseInt(containerSize);
    canvas.height = parseInt(containerSize);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.borderRadius = '50%';
    
    container.appendChild(canvas);
    
    // Create particles
    const particleCount = animationProps.particleCount;
    let particles = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: Math.random() * 3 + 1,
        color: getColor(animationProps.color),
        velocity: {
          x: (Math.random() - 0.5) * 2 * animationProps.particleSpeed,
          y: (Math.random() - 0.5) * 2 * animationProps.particleSpeed
        },
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    
    particlesRef.current = particles;
    
    // Animation function
    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Bounce of edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.velocity.x *= -1;
        }
        
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.velocity.y *= -1;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(particle.color)}, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    setIsInitialized(true);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, [animationType, containerSize, animationProps]);
  
  // Update particles based on state changes
  useEffect(() => {
    if (animationType !== 'particle' || !isInitialized) return;
    
    const currentColor = getColor(animationProps.color);
    
    // Update particle properties based on state
    particlesRef.current = particlesRef.current.map(particle => ({
      ...particle,
      color: currentColor,
      velocity: {
        x: particle.velocity.x * animationProps.particleSpeed,
        y: particle.velocity.y * animationProps.particleSpeed
      }
    }));
    
  }, [currentState, animationProps, isInitialized, animationType]);
  
  // Helper to convert hex to rgb
  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  };
  
  // Generate bars for waveform visualization
  const renderWaveformBars = () => {
    const numBars = 12;
    const bars = [];
    
    for (let i = 0; i < numBars; i++) {
      const height = waveformData 
        ? `${Math.max(10, waveformData[i % waveformData.length] * 100)}%`
        : `${animationProps.amplitude * 70 + 10}%`;
      
      bars.push(
        <Box
          key={i}
          className="visualizer-bar"
          sx={{
            width: barWidth,
            height: animationProps.patternType === 'reactive' 
              ? `${10 + Math.random() * 70}%` 
              : height,
            backgroundColor: '#fff',
            borderRadius: '2px',
            transition: 'height 0.2s ease',
            transform: animationProps.patternType === 'reactive'
              ? `translateY(${Math.sin(i * 0.5) * 5}px)` 
              : 'none',
            animation: stateAnimations.find(a => a.name === 'wave')
              ? `wave 1.5s ease-in-out infinite ${i * 0.1}s` 
              : 'none'
          }}
        />
      );
    }
    
    return bars;
  };
  
  // Generate ripple effect elements
  const renderRipples = () => {
    const ripples = [];
    const showRipple = isRecording || isSpeaking;
    
    if (showRipple) {
      for (let i = 0; i < 3; i++) {
        ripples.push(
          <Box
            key={`ripple-${i}`}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              backgroundColor: theme => theme.palette[color].main,
              opacity: 0.2 - (i * 0.05),
              animation: `ripple ${1.5 + (i * 0.5)}s infinite ease-out ${i * 0.5}s`,
              '@keyframes ripple': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 0.2,
                },
                '100%': {
                  transform: 'scale(1.5)',
                  opacity: 0,
                },
              }
            }}
          />
        );
      }
    }
    
    return ripples;
  };

  return (
    <Box
      ref={containerRef}
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
        boxShadow: (theme) => isRecording || isSpeaking || isProcessing
          ? `0 0 0 4px ${theme.palette[color].main}30, 0 0 20px ${theme.palette[color].main}70` 
          : 'none',
        animation: stateAnimations.find(a => a.name === 'pulse')
          ? 'pulse 1.5s infinite ease-in-out'
          : (stateAnimations.find(a => a.name === 'rotation')
            ? 'rotation 10s linear infinite'
            : 'none'),
        position: 'relative',
        transform: `scale(${animationProps.scale || 1})`,
        '--color-rgb': hexToRgb(getColor(color)),
        '&::after': animationProps.glow ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '50%',
          animation: 'glow 2s infinite ease-in-out',
        } : {},
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        '@keyframes rotation': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        '@keyframes glow': {
          '0%': { boxShadow: '0 0 5px rgba(var(--color-rgb), 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(var(--color-rgb), 0.8)' },
          '100%': { boxShadow: '0 0 5px rgba(var(--color-rgb), 0.5)' },
        },
      }}
      role="status"
      aria-label={`Assistant is ${currentState}`}
    >
      {/* Waveform visualization */}
      {animationType === 'wave' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70%',
            gap,
          }}
        >
          {renderWaveformBars()}
        </Box>
      )}
      
      {/* Ripple effects */}
      {animationType === 'ripple' && renderRipples()}
      
      {/* For particle visualization, the canvas is added via useEffect */}
    </Box>
  );
};

export default EnhancedVoiceVisualizer; 