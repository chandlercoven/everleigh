import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { StyledEngineProvider } from '@mui/material/styles';
import ErrorBoundary from '../components/ErrorBoundary';
import { useState, useEffect } from 'react';
import { theme, darkTheme } from '../lib/theme';
import { EverleighProvider } from '../lib/EverleighProvider';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check system preference for dark mode
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
    setMounted(true);
  }, []);

  // Avoid rendering with incorrect theme
  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SessionProvider session={session}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={darkMode ? darkTheme : theme}>
            <CssBaseline />
            <EverleighProvider>
              <Component {...pageProps} darkMode={darkMode} setDarkMode={setDarkMode} />
            </EverleighProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default MyApp; 