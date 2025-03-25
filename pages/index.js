import Head from 'next/head';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { 
  Mic as MicIcon, 
  History as HistoryIcon,
  WorkspacePremium as WorkflowIcon,
  Science as ScienceIcon
} from '@mui/icons-material';

// Components
import VoiceChat from '../components/VoiceChat';
import VoiceLabChat from '../components/VoiceLabChat';
import AgentWorkflow from '../components/AgentWorkflow';
import Header from '../components/ui/Header';
import ActionButton from '../components/ui/ActionButton';

export default function Home({ darkMode, setDarkMode }) {
  const { data: session } = useSession();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showLabChat, setShowLabChat] = useState(true);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleComponent = (component) => {
    if (component === 'lab') {
      setShowLabChat(!showLabChat);
      if (!showLabChat) {
        setShowVoiceChat(false);
        setShowWorkflow(false);
      }
    } else if (component === 'voice') {
      setShowVoiceChat(!showVoiceChat);
      if (!showVoiceChat) {
        setShowLabChat(false);
        setShowWorkflow(false);
      }
    } else if (component === 'workflow') {
      setShowWorkflow(!showWorkflow);
      if (!showWorkflow) {
        setShowVoiceChat(false);
        setShowLabChat(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>Everleigh - Voice AI Lab</title>
        <meta name="description" content="Voice AI project using LiveKit and Eleven Labs" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <Box className="min-h-screen bg-[var(--background-color)]">
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <Container maxWidth="lg" className="py-4 md:py-12">
          <Box className="text-center mb-4 md:mb-8">
            <Typography 
              variant={isMobile ? "h3" : "h2"} 
              component="h1" 
              gutterBottom 
              className="font-bold"
              sx={{
                fontSize: isMobile ? '2rem' : '3rem',
                lineHeight: 1.2,
                mb: isMobile ? 1 : 2
              }}
            >
              Everleigh Voice AI Lab
            </Typography>
            <Typography 
              variant={isMobile ? "body1" : "h5"} 
              color="textSecondary" 
              className="max-w-3xl mx-auto"
              sx={{
                fontSize: isMobile ? '1rem' : '1.5rem',
                px: isMobile ? 2 : 0
              }}
            >
              Test voice interactions with animated speaking visualizations
            </Typography>
          </Box>

          <Paper 
            elevation={0} 
            className="p-4 md:p-6 mb-4 md:mb-8 rounded-lg bg-opacity-50 backdrop-filter backdrop-blur-lg"
            sx={{
              position: isMobile ? 'sticky' : 'relative',
              top: isMobile ? 0 : 'auto',
              zIndex: isMobile ? 10 : 1,
              backgroundColor: theme => theme.palette.mode === 'dark' 
                ? 'rgba(0,0,0,0.8)' 
                : 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              borderBottom: isMobile ? 1 : 0,
              borderColor: theme => theme.palette.divider,
            }}
          >
            <Grid container spacing={isMobile ? 1 : 2} justifyContent="center">
              <Grid item xs={12} sm={6} md={3}>
                <ActionButton
                  onClick={() => toggleComponent('lab')}
                  active={showLabChat}
                  color="primary"
                  fullWidth
                  startIcon={<ScienceIcon />}
                  sx={{
                    height: isMobile ? 48 : 56,
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    '&:active': {
                      transform: 'scale(0.98)',
                      transition: 'transform 0.1s'
                    }
                  }}
                >
                  {showLabChat ? 'Hide Lab Interface' : 'Show Lab Interface'}
                </ActionButton>
              </Grid>
              
              {session && (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <ActionButton
                      onClick={() => toggleComponent('voice')}
                      active={showVoiceChat}
                      color="secondary"
                      fullWidth
                      startIcon={<MicIcon />}
                      sx={{
                        height: isMobile ? 48 : 56,
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        '&:active': {
                          transform: 'scale(0.98)',
                          transition: 'transform 0.1s'
                        }
                      }}
                    >
                      {showVoiceChat ? 'Hide Voice Chat' : 'Try Voice Chat'}
                    </ActionButton>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <ActionButton
                      onClick={() => toggleComponent('workflow')}
                      active={showWorkflow}
                      color="accent"
                      fullWidth
                      startIcon={<WorkflowIcon />}
                      sx={{
                        height: isMobile ? 48 : 56,
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        '&:active': {
                          transform: 'scale(0.98)',
                          transition: 'transform 0.1s'
                        }
                      }}
                    >
                      {showWorkflow ? 'Hide Workflow Test' : 'Try n8n Workflow'}
                    </ActionButton>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <ActionButton
                      onClick={() => router.push('/conversations')}
                      color="inherit"
                      variant="outlined"
                      fullWidth
                      startIcon={<HistoryIcon />}
                      sx={{
                        height: isMobile ? 48 : 56,
                        fontSize: isMobile ? '0.875rem' : '1rem',
                        '&:active': {
                          transform: 'scale(0.98)',
                          transition: 'transform 0.1s'
                        }
                      }}
                    >
                      Conversation History
                    </ActionButton>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>

          <Box 
            className="mt-4 md:mt-6"
            sx={{
              minHeight: isMobile ? 'calc(100vh - 400px)' : 'auto',
              position: 'relative',
              zIndex: 1
            }}
          >
            {showLabChat && (
              <Box className="transition-all duration-300 ease-in-out transform">
                <VoiceLabChat />
              </Box>
            )}
            
            {showVoiceChat && session && (
              <Box className="transition-all duration-300 ease-in-out transform">
                <VoiceChat />
              </Box>
            )}
            
            {showWorkflow && session && (
              <Box className="transition-all duration-300 ease-in-out transform">
                <AgentWorkflow />
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
} 