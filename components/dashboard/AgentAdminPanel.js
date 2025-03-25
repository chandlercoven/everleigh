import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, 
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Switch, TextField, Button, IconButton, Chip,
  useTheme, useMediaQuery
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Memory as MemoryIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  VolumeUp as VoiceIcon
} from '@mui/icons-material';

/**
 * Agent Administration Panel Component
 * 
 * Allows viewing and editing agent configurations and personalities
 */
const AgentAdminPanel = ({ agents = [], onAgentUpdate, onAgentTest, onMemoryClear }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [editedName, setEditedName] = useState('');
  const [editedVoiceId, setEditedVoiceId] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Initialize with first agent when loaded
  useEffect(() => {
    if (agents && agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
      setEditedPrompt(agents[0].systemPrompt || '');
      setEditedName(agents[0].name || '');
      setEditedVoiceId(agents[0].voiceId || '');
    }
  }, [agents, selectedAgentId]);
  
  // Update form fields when agent selection changes
  useEffect(() => {
    if (selectedAgentId) {
      const agent = agents.find(a => a.id === selectedAgentId);
      if (agent) {
        setEditedPrompt(agent.systemPrompt || '');
        setEditedName(agent.name || '');
        setEditedVoiceId(agent.voiceId || '');
      }
    }
  }, [selectedAgentId, agents]);
  
  // Handle agent selection
  const handleAgentSelect = (agentId) => {
    setSelectedAgentId(agentId);
    setIsEditMode(false);
    setActiveTab(0);
    
    // Reset unsaved changes
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setEditedPrompt(agent.systemPrompt || '');
      setEditedName(agent.name || '');
      setEditedVoiceId(agent.voiceId || '');
    }
  };
  
  // Handle save of edited prompt
  const handlePromptSave = () => {
    if (!selectedAgentId) return;
    
    onAgentUpdate(selectedAgentId, {
      systemPrompt: editedPrompt
    });
    
    setIsEditMode(false);
  };
  
  // Handle saving all agent settings
  const handleSaveSettings = () => {
    if (!selectedAgentId) return;
    
    onAgentUpdate(selectedAgentId, {
      name: editedName,
      voiceId: editedVoiceId,
      systemPrompt: editedPrompt
    });
    
    setIsEditMode(false);
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };
  
  // Toggle agent active state
  const handleToggleActive = (event) => {
    if (!selectedAgentId) return;
    
    onAgentUpdate(selectedAgentId, {
      active: event.target.checked
    });
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Test the selected agent
  const handleTestAgent = () => {
    if (!selectedAgentId) return;
    
    onAgentTest(selectedAgentId);
  };
  
  // Clear the agent's memory
  const handleClearMemory = () => {
    if (!selectedAgentId) return;
    
    if (window.confirm(`Are you sure you want to clear ${currentAgent?.name}'s memory? This cannot be undone.`)) {
      onMemoryClear(selectedAgentId);
    }
  };
  
  // Get the current agent
  const currentAgent = agents?.find(a => a.id === selectedAgentId);
  
  // Show loading or no agents message if needed
  if (!agents || agents.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="body1">No agents available.</Typography>
      </Paper>
    );
  }
  
  if (!currentAgent) {
    return (
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="body1">Loading agents...</Typography>
      </Paper>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5">Agent Management</Typography>
          
          <Box>
            <IconButton 
              color={isEditMode ? 'primary' : 'default'}
              onClick={toggleEditMode}
              aria-label={isEditMode ? "Save changes" : "Edit agent"}
              sx={{ mr: 1 }}
            >
              {isEditMode ? <SaveIcon /> : <EditIcon />}
            </IconButton>
            
            <IconButton
              color="secondary"
              onClick={handleTestAgent}
              aria-label="Test agent"
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Agent List */}
          <Paper sx={{ width: isMobile ? '100%' : 250, p: 1 }}>
            <List>
              {agents.map(agent => (
                <ListItem 
                  key={agent.id}
                  button
                  selected={selectedAgentId === agent.id}
                  onClick={() => handleAgentSelect(agent.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: theme => 
                        theme.palette.primary.main + '20',
                    }
                  }}
                >
                  <ListItemIcon>
                    <PersonIcon 
                      color={agent.active ? 'primary' : 'disabled'} 
                    />
                  </ListItemIcon>
                  <ListItemText 
                    primary={agent.name}
                    secondary={agent.isActive ? 'Currently Active' : agent.description} 
                    primaryTypographyProps={{
                      fontWeight: agent.isActive ? 'bold' : 'normal'
                    }}
                  />
                  {agent.isActive && (
                    <Chip 
                      label="Active" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
          
          {/* Agent Details */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Settings" id="tab-0" aria-controls="tabpanel-0" />
                <Tab label="System Prompt" id="tab-1" aria-controls="tabpanel-1" />
                <Tab label="Stats" id="tab-2" aria-controls="tabpanel-2" />
                <Tab label="Memory" id="tab-3" aria-controls="tabpanel-3" />
              </Tabs>
            </Box>
            
            {/* Settings Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {activeTab === 0 && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {currentAgent.name} Settings
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Agent Name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    margin="normal"
                    disabled={!isEditMode}
                  />
                  
                  <TextField
                    fullWidth
                    label="Voice ID"
                    value={editedVoiceId}
                    onChange={(e) => setEditedVoiceId(e.target.value)}
                    margin="normal"
                    disabled={!isEditMode}
                    helperText="ElevenLabs Voice ID to use"
                  />
                  
                  <Box sx={{ 
                    mt: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2
                  }}>
                    <Typography>
                      Active
                    </Typography>
                    <Switch 
                      checked={currentAgent.active || false} 
                      onChange={handleToggleActive}
                      color="primary"
                    />
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2">
                      Domains:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {currentAgent.domains?.map(domain => (
                        <Chip 
                          key={domain} 
                          label={domain} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  {isEditMode && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleSaveSettings}
                        startIcon={<SaveIcon />}
                      >
                        Save Settings
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </div>
            
            {/* System Prompt Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {activeTab === 1 && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="body2" gutterBottom>
                    Edit the system prompt to adjust this agent's personality and capabilities:
                  </Typography>
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    variant="outlined"
                    sx={{ mt: 2 }}
                    disabled={!isEditMode}
                  />
                  
                  {isEditMode && (
                    <Box sx={{ 
                      mt: 2, 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      gap: 2
                    }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handlePromptSave}
                        startIcon={<SaveIcon />}
                      >
                        Save Prompt
                      </Button>
                      
                      <Button 
                        variant="outlined" 
                        color="secondary"
                        onClick={handleTestAgent}
                      >
                        Test Agent
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </div>
            
            {/* Stats Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 2}
              id="tabpanel-2"
              aria-labelledby="tab-2"
            >
              {activeTab === 2 && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Usage Statistics
                  </Typography>
                  
                  <Box sx={{ 
                    mt: 2, 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2
                  }}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Total Queries
                      </Typography>
                      <Typography variant="h4">
                        {currentAgent.stats?.totalQueries || 0}
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Last Used
                      </Typography>
                      <Typography variant="body1">
                        {currentAgent.stats?.lastUsed 
                          ? new Date(currentAgent.stats.lastUsed).toLocaleString() 
                          : 'Never'
                        }
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Avg Response Time
                      </Typography>
                      <Typography variant="h4">
                        {currentAgent.stats?.avgResponseTime 
                          ? `${Math.round(currentAgent.stats.avgResponseTime)}ms` 
                          : '0ms'
                        }
                      </Typography>
                    </Paper>
                    
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Completion Rate
                      </Typography>
                      <Typography variant="h4">
                        {currentAgent.stats?.completionRate 
                          ? `${Math.round(currentAgent.stats.completionRate * 100)}%` 
                          : '100%'
                        }
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              )}
            </div>
            
            {/* Memory Tab */}
            <div
              role="tabpanel"
              hidden={activeTab !== 3}
              id="tabpanel-3"
              aria-labelledby="tab-3"
            >
              {activeTab === 3 && (
                <Box sx={{ p: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Agent Memory Management
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" paragraph>
                      This agent has stored memories of previous conversations and learned information.
                      You can clear the agent's memory to reset its learned knowledge.
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearMemory}
                    >
                      Clear Agent Memory
                    </Button>
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Memory Stats:
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <MemoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Stored Facts" 
                        secondary={currentAgent.memory?.factCount || 0} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <VoiceIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Saved Conversations" 
                        secondary={currentAgent.memory?.conversationCount || 0} 
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AnalyticsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Memory Last Updated" 
                        secondary={currentAgent.memory?.lastUpdated 
                          ? new Date(currentAgent.memory.lastUpdated).toLocaleString() 
                          : 'Never'
                        } 
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </div>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AgentAdminPanel; 