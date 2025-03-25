import { Chip, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * SuggestionChips component displays tappable suggestion chips for quick voice commands
 * 
 * @param {Object} props Component props
 * @param {Array} props.suggestions Array of suggestion strings to display as chips
 * @param {Function} props.onSuggestionClick Callback when a suggestion is clicked
 * @param {string} props.title Optional title for the suggestions section
 * @param {boolean} props.animate Whether to animate the chips entrance
 */
const SuggestionChips = ({ 
  suggestions = [], 
  onSuggestionClick,
  title = "Try saying...",
  animate = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visibleChips, setVisibleChips] = useState([]);
  
  // Animate chips entrance if enabled
  useEffect(() => {
    if (!animate || !suggestions.length) {
      setVisibleChips(suggestions);
      return;
    }
    
    // Clear current chips
    setVisibleChips([]);
    
    // Animate in each chip with a delay
    const timeouts = [];
    suggestions.forEach((suggestion, index) => {
      const timeout = setTimeout(() => {
        setVisibleChips(prev => [...prev, suggestion]);
      }, 100 + (index * 150)); // Stagger the animations
      
      timeouts.push(timeout);
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [suggestions, animate]);
  
  if (!suggestions.length) return null;
  
  return (
    <Box
      sx={{
        mt: 2,
        width: '100%',
      }}
    >
      {title && (
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ 
            mb: 1,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            opacity: 0.7
          }}
        >
          {title}
        </Typography>
      )}
      
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          maxWidth: '100%',
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.3)' 
              : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
        role="region"
        aria-label="Voice command suggestions"
      >
        {visibleChips.map((suggestion, index) => (
          <Chip
            key={suggestion}
            label={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            clickable
            color="primary"
            variant="outlined"
            sx={{
              borderRadius: '9999px',
              px: 1,
              transition: 'all 0.2s ease',
              animation: animate ? `chipAppear 0.3s ease forwards` : 'none',
              opacity: animate ? 0 : 1,
              transform: animate ? 'translateY(10px)' : 'none',
              animationDelay: `${index * 0.15}s`,
              '&:hover': {
                backgroundColor: theme => theme.palette.primary.main,
                color: 'white',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
              '@keyframes chipAppear': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(10px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
            role="button"
            tabIndex={0}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SuggestionChips; 