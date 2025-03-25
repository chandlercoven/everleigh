import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled button component for consistent styling across the app
const StyledButton = styled(Button)(({ theme, color = 'primary', variant = 'contained', active }) => ({
  padding: '0.75rem 1.5rem',
  borderRadius: theme.shape.borderRadius,
  fontWeight: 500,
  fontSize: '1rem',
  transition: 'all 0.2s',
  textTransform: 'none',
  boxShadow: 'none',
  ...(active && {
    boxShadow: `0 0 0 2px ${theme.palette[color].main}`,
  }),
  '&:hover': {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
}));

const ActionButton = ({ 
  children, 
  onClick, 
  active, 
  disabled, 
  color = 'primary', 
  variant = 'contained',
  className = '',
  startIcon,
  endIcon,
  fullWidth,
  size = 'medium',
  ...props 
}) => {
  return (
    <StyledButton
      onClick={onClick}
      disabled={disabled}
      color={color}
      variant={variant}
      active={active}
      startIcon={startIcon}
      endIcon={endIcon}
      fullWidth={fullWidth}
      size={size}
      className={`action-button ${active ? 'active' : ''} ${className}`}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

export default ActionButton; 