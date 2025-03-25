import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Tabs, Tab, 
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Switch, TextField, Button, IconButton, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, useTheme,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  Code as CodeIcon,
  Api as ApiIcon,
  FlowChart as FlowIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as TestIcon,
  FilterList as FilterIcon,
  Assignment as LogIcon
} from '@mui/icons-material';

/**
 * Skills Manager Dashboard Component
 * 
 * Provides UI for:
 * - Viewing registered skills
 * - Testing skills
 * - Managing skill configurations
 * - Creating new skills
 */
const SkillsManager = ({ 
  skills = [], 
  categories = [],
  onSkillTest, 
  onSkillUpdate, 
  onSkillCreate,
  onSkillDelete
}) => {
  const theme = useTheme();
  
  // State for UI
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testParameters, setTestParameters] = useState({});
  const [testResults, setTestResults] = useState(null);
  
  // Edit dialog state
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    category: '',
    parameters: []
  });
  
  // Create dialog state
  const [createFormData, setCreateFormData] = useState({
    id: '',
    name: '',
    description: '',
    type: 'function',
    category: categories[0] || 'productivity',
    enabled: true,
    parameters: []
  });
  
  // Set selected skill when changed
  useEffect(() => {
    if (selectedSkill) {
      const skill = skills.find(s => s.id === selectedSkill);
      if (skill) {
        setEditFormData({
          name: skill.name || '',
          description: skill.description || '',
          enabled: skill.enabled !== false,
          category: skill.category || '',
          parameters: skill.parameters || []
        });
      }
    }
  }, [selectedSkill, skills]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle category filter change
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };
  
  // Handle search query change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Filter skills based on category and search
  const filteredSkills = skills.filter(skill => {
    // Category filter
    if (selectedCategory !== 'all' && skill.category !== selectedCategory) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        skill.name.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query) ||
        skill.id.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Get icon for skill type
  const getSkillTypeIcon = (type) => {
    switch (type) {
      case 'function':
        return <CodeIcon />;
      case 'api':
        return <ApiIcon />;
      case 'n8n':
        return <FlowIcon />;
      default:
        return <CodeIcon />;
    }
  };
  
  // Open edit dialog
  const handleEditSkill = (skillId) => {
    setSelectedSkill(skillId);
    setIsEditDialogOpen(true);
  };
  
  // Save skill edits
  const handleSaveSkill = () => {
    if (!selectedSkill) return;
    
    onSkillUpdate(selectedSkill, editFormData);
    setIsEditDialogOpen(false);
  };
  
  // Toggle skill enabled state
  const handleToggleSkill = (skillId, enabled) => {
    onSkillUpdate(skillId, { enabled });
  };
  
  // Open create dialog
  const handleOpenCreateDialog = () => {
    setCreateFormData({
      id: '',
      name: '',
      description: '',
      type: 'function',
      category: categories[0] || 'productivity',
      enabled: true,
      parameters: []
    });
    setIsCreateDialogOpen(true);
  };
  
  // Create new skill
  const handleCreateSkill = () => {
    onSkillCreate(createFormData);
    setIsCreateDialogOpen(false);
  };
  
  // Open test dialog
  const handleTestSkill = (skillId) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;
    
    // Initialize test parameters based on skill definition
    const initialParams = {};
    if (skill.parameters) {
      skill.parameters.forEach(param => {
        initialParams[param.name] = param.defaultValue || '';
      });
    }
    
    setSelectedSkill(skillId);
    setTestParameters(initialParams);
    setTestResults(null);
    setIsTestDialogOpen(true);
  };
  
  // Run skill test
  const handleRunTest = async () => {
    if (!selectedSkill) return;
    
    const results = await onSkillTest(selectedSkill, testParameters);
    setTestResults(results);
  };
  
  // Handle delete skill
  const handleDeleteSkill = (skillId) => {
    if (window.confirm('Are you sure you want to delete this skill? This cannot be undone.')) {
      onSkillDelete(skillId);
    }
  };
  
  // Handle parameter field change in test dialog
  const handleTestParamChange = (paramName, value) => {
    setTestParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };
  
  // Handle parameter field change in edit dialog
  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle parameter field change in create dialog
  const handleCreateFormChange = (field, value) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add parameter to skill
  const handleAddParameter = (isCreate = false) => {
    const newParam = {
      name: '',
      type: 'string',
      description: '',
      required: false,
      defaultValue: ''
    };
    
    if (isCreate) {
      setCreateFormData(prev => ({
        ...prev,
        parameters: [...(prev.parameters || []), newParam]
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        parameters: [...(prev.parameters || []), newParam]
      }));
    }
  };
  
  // Update parameter
  const handleUpdateParameter = (index, field, value, isCreate = false) => {
    if (isCreate) {
      const newParams = [...createFormData.parameters];
      newParams[index] = {
        ...newParams[index],
        [field]: value
      };
      
      setCreateFormData(prev => ({
        ...prev,
        parameters: newParams
      }));
    } else {
      const newParams = [...editFormData.parameters];
      newParams[index] = {
        ...newParams[index],
        [field]: value
      };
      
      setEditFormData(prev => ({
        ...prev,
        parameters: newParams
      }));
    }
  };
  
  // Remove parameter
  const handleRemoveParameter = (index, isCreate = false) => {
    if (isCreate) {
      setCreateFormData(prev => ({
        ...prev,
        parameters: prev.parameters.filter((_, i) => i !== index)
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        parameters: prev.parameters.filter((_, i) => i !== index)
      }));
    }
  };
  
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h5">Skills Management</Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add Skill
          </Button>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              value={selectedCategory}
              onChange={handleCategoryChange}
              label="Category"
              size="small"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            placeholder="Search skills..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ width: 200 }}
          />
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="All Skills" id="tab-0" />
            <Tab label="Function" id="tab-1" />
            <Tab label="API" id="tab-2" />
            <Tab label="n8n Workflows" id="tab-3" />
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <List>
            {filteredSkills
              .filter(skill => {
                if (activeTab === 0) return true;
                if (activeTab === 1) return skill.type === 'function';
                if (activeTab === 2) return skill.type === 'api';
                if (activeTab === 3) return skill.type === 'n8n';
                return true;
              })
              .map(skill => (
                <ListItem 
                  key={skill.id}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <ListItemIcon>
                    {getSkillTypeIcon(skill.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">{skill.name}</Typography>
                        <Chip 
                          label={skill.category} 
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {skill.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" >
                          ID: {skill.id}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleTestSkill(skill.id)}
                      title="Test Skill"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <TestIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditSkill(skill.id)}
                      title="Edit Skill"
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteSkill(skill.id)}
                      title="Delete Skill"
                      size="small"
                      sx={{ mr: 1 }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <Switch
                      checked={skill.enabled !== false}
                      onChange={(e) => handleToggleSkill(skill.id, e.target.checked)}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
            {filteredSkills.length === 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No skills found matching your criteria.
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Paper>
      
      {/* Edit Skill Dialog */}
      <Dialog 
        open={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Skill</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={editFormData.name}
            onChange={(e) => handleEditFormChange('name', e.target.value)}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Description"
            value={editFormData.description}
            onChange={(e) => handleEditFormChange('description', e.target.value)}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={editFormData.category}
              onChange={(e) => handleEditFormChange('category', e.target.value)}
              label="Category"
            >
              {categories.map(category => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Parameters</Typography>
              <Button 
                onClick={() => handleAddParameter(false)} 
                startIcon={<AddIcon />}
                size="small"
              >
                Add Parameter
              </Button>
            </Box>
            
            {editFormData.parameters && editFormData.parameters.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell width={80}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editFormData.parameters.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            value={param.name}
                            onChange={(e) => handleUpdateParameter(index, 'name', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={param.type || 'string'}
                            onChange={(e) => handleUpdateParameter(index, 'type', e.target.value)}
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="string">String</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="boolean">Boolean</MenuItem>
                            <MenuItem value="object">Object</MenuItem>
                            <MenuItem value="array">Array</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={param.description || ''}
                            onChange={(e) => handleUpdateParameter(index, 'description', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={param.required || false}
                            onChange={(e) => handleUpdateParameter(index, 'required', e.target.checked)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={param.defaultValue || ''}
                            onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveParameter(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No parameters defined.
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography>Enabled</Typography>
            <Switch
              checked={editFormData.enabled}
              onChange={(e) => handleEditFormChange('enabled', e.target.checked)}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveSkill} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Skill Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Skill</DialogTitle>
        <DialogContent>
          <TextField
            label="Skill ID"
            value={createFormData.id}
            onChange={(e) => handleCreateFormChange('id', e.target.value)}
            fullWidth
            required
            margin="normal"
            helperText="Unique identifier for the skill (e.g., send_email)"
          />
          
          <TextField
            label="Name"
            value={createFormData.name}
            onChange={(e) => handleCreateFormChange('name', e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            label="Description"
            value={createFormData.description}
            onChange={(e) => handleCreateFormChange('description', e.target.value)}
            fullWidth
            multiline
            rows={2}
            margin="normal"
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={createFormData.type}
                onChange={(e) => handleCreateFormChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="function">JavaScript Function</MenuItem>
                <MenuItem value="api">External API</MenuItem>
                <MenuItem value="n8n">n8n Workflow</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={createFormData.category}
                onChange={(e) => handleCreateFormChange('category', e.target.value)}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {/* Conditional fields based on type */}
          {createFormData.type === 'api' && (
            <TextField
              label="API Endpoint"
              value={createFormData.endpoint || ''}
              onChange={(e) => handleCreateFormChange('endpoint', e.target.value)}
              fullWidth
              margin="normal"
              placeholder="https://api.example.com/endpoint"
            />
          )}
          
          {createFormData.type === 'n8n' && (
            <TextField
              label="n8n Workflow ID"
              value={createFormData.workflowId || ''}
              onChange={(e) => handleCreateFormChange('workflowId', e.target.value)}
              fullWidth
              margin="normal"
            />
          )}
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Parameters</Typography>
              <Button 
                onClick={() => handleAddParameter(true)} 
                startIcon={<AddIcon />}
                size="small"
              >
                Add Parameter
              </Button>
            </Box>
            
            {createFormData.parameters && createFormData.parameters.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Required</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell width={80}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {createFormData.parameters.map((param, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            value={param.name}
                            onChange={(e) => handleUpdateParameter(index, 'name', e.target.value, true)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={param.type || 'string'}
                            onChange={(e) => handleUpdateParameter(index, 'type', e.target.value, true)}
                            size="small"
                            fullWidth
                          >
                            <MenuItem value="string">String</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="boolean">Boolean</MenuItem>
                            <MenuItem value="object">Object</MenuItem>
                            <MenuItem value="array">Array</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={param.description || ''}
                            onChange={(e) => handleUpdateParameter(index, 'description', e.target.value, true)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={param.required || false}
                            onChange={(e) => handleUpdateParameter(index, 'required', e.target.checked, true)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={param.defaultValue || ''}
                            onChange={(e) => handleUpdateParameter(index, 'defaultValue', e.target.value, true)}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveParameter(index, true)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No parameters defined.
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Typography>Enabled</Typography>
            <Switch
              checked={createFormData.enabled}
              onChange={(e) => handleCreateFormChange('enabled', e.target.checked)}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateSkill} 
            variant="contained" 
            color="primary"
            disabled={!createFormData.id || !createFormData.name}
          >
            Create Skill
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Test Skill Dialog */}
      <Dialog 
        open={isTestDialogOpen} 
        onClose={() => setIsTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Test Skill</DialogTitle>
        <DialogContent>
          {selectedSkill && (
            <Box>
              <Typography variant="h6">
                {skills.find(s => s.id === selectedSkill)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {skills.find(s => s.id === selectedSkill)?.description}
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Parameters</Typography>
              
              {skills.find(s => s.id === selectedSkill)?.parameters?.map((param, index) => (
                <TextField
                  key={index}
                  label={`${param.name}${param.required ? ' *' : ''}`}
                  value={testParameters[param.name] || ''}
                  onChange={(e) => handleTestParamChange(param.name, e.target.value)}
                  fullWidth
                  margin="normal"
                  helperText={param.description}
                  type={param.type === 'number' ? 'number' : 'text'}
                />
              ))}
              
              {(!skills.find(s => s.id === selectedSkill)?.parameters || 
                skills.find(s => s.id === selectedSkill)?.parameters.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  This skill has no parameters.
                </Typography>
              )}
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Button 
                  onClick={handleRunTest}
                  variant="contained"
                  color="primary"
                  startIcon={<TestIcon />}
                >
                  Run Test
                </Button>
              </Box>
              
              {testResults && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1">Test Results</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      mt: 1, 
                      backgroundColor: theme.palette.background.default,
                      maxHeight: 300,
                      overflow: 'auto',
                      fontFamily: 'monospace'
                    }}
                  >
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {testResults.success ? (
                        <span style={{ color: theme.palette.success.main }}>SUCCESS</span>
                      ) : (
                        <span style={{ color: theme.palette.error.main }}>ERROR: {testResults.error}</span>
                      )}
                    </Typography>
                    
                    {testResults.success && testResults.result && (
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', mt: 2 }}>
                        {typeof testResults.result === 'object' 
                          ? JSON.stringify(testResults.result, null, 2)
                          : testResults.result
                        }
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.secondary }}>
                      Execution time: {testResults.executionTime}ms
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SkillsManager; 