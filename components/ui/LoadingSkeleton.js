import { Skeleton, Box } from '@mui/material';

const LoadingSkeleton = ({ type = 'text', lines = 1, height, width, animation = 'pulse', variant = 'rounded', ...props }) => {
  if (type === 'text') {
    return (
      <Box sx={{ width: '100%', ...props.sx }}>
        {Array.from(new Array(lines)).map((_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            height={height || 20}
            width={width || (index === lines - 1 ? '80%' : '100%')}
            animation={animation}
            sx={{ my: 1, ...props.skeletonSx }}
          />
        ))}
      </Box>
    );
  }

  if (type === 'avatar') {
    return (
      <Skeleton
        variant="circular"
        width={width || 40}
        height={height || 40}
        animation={animation}
        {...props}
      />
    );
  }

  if (type === 'button') {
    return (
      <Skeleton
        variant={variant}
        width={width || 100}
        height={height || 40}
        animation={animation}
        {...props}
      />
    );
  }

  if (type === 'card') {
    return (
      <Box sx={{ width: '100%', ...props.sx }}>
        <Skeleton
          variant={variant}
          width={width || '100%'}
          height={height || 200}
          animation={animation}
          sx={{ mb: 1, ...props.skeletonSx }}
        />
      </Box>
    );
  }

  // Default case
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      {...props}
    />
  );
};

export default LoadingSkeleton; 