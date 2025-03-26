// VoiceChatWorkflow component - handles workflow integration
import { useState } from 'react';
import { useVoiceChatStore, usePreferencesStore } from '../../lib/store';

const VoiceChatWorkflow = () => {
  // Use the Zustand store for state management
  const {
    showWorkflowPanel,
    selectedWorkflow,
    workflowData,
    isWorkflowTriggering,
    workflowStatus,
    toggleWorkflowPanel,
    setSelectedWorkflow,
    setWorkflowData,
    triggerWorkflow,
  } = useVoiceChatStore();
  
  // Get theme preferences
  const { theme } = usePreferencesStore();
  
  // Available workflow types
  const workflowTypes = ['weather', 'calendar', 'reminder', 'email'];
  
  // Local state for form inputs
  const [formData, setFormData] = useState({});
  
  // Handle workflow data input changes
  const handleWorkflowDataChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle workflow selection
  const handleWorkflowSelect = (type) => {
    setSelectedWorkflow(type);
    setFormData({});
    
    // Set default form data based on workflow type
    switch (type) {
      case 'weather':
        setFormData({
          location: '',
        });
        break;
      case 'calendar':
        setFormData({
          title: '',
          date: '',
          time: '',
        });
        break;
      case 'reminder':
        setFormData({
          text: '',
          time: '',
        });
        break;
      case 'email':
        setFormData({
          to: '',
          subject: '',
          body: '',
        });
        break;
      default:
        break;
    }
  };
  
  // Submit workflow trigger
  const handleTriggerWorkflow = () => {
    if (selectedWorkflow) {
      setWorkflowData(formData);
      triggerWorkflow(selectedWorkflow, formData);
    }
  };
  
  // If workflow panel is hidden, show a button to open it
  if (!showWorkflowPanel) {
    return (
      <div className="workflow-toggle mt-4 flex justify-center">
        <button
          onClick={toggleWorkflowPanel}
          className={`
            text-sm
            px-4
            py-2
            rounded-md
            bg-${theme === 'dark' ? 'gray-700' : 'gray-200'}
            hover:bg-${theme === 'dark' ? 'gray-600' : 'gray-300'}
            flex
            items-center
          `}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
          </svg>
          Show Workflows
        </button>
      </div>
    );
  }
  
  // Container styling based on theme
  const containerClasses = `
    workflow-panel
    mt-4
    p-4
    rounded-lg
    border
    border-${theme === 'dark' ? 'gray-700' : 'gray-200'}
    bg-${theme === 'dark' ? 'gray-800' : 'gray-50'}
  `.trim();
  
  // Render workflow form based on selected type
  const renderWorkflowForm = () => {
    if (!selectedWorkflow) {
      return (
        <div className="text-center text-gray-500 py-4">
          Select a workflow type to continue
        </div>
      );
    }
    
    switch (selectedWorkflow) {
      case 'weather':
        return (
          <div className="weather-form">
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleWorkflowDataChange}
                placeholder="e.g. New York"
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
          </div>
        );
        
      case 'calendar':
        return (
          <div className="calendar-form">
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Event Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleWorkflowDataChange}
                placeholder="e.g. Team Meeting"
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleWorkflowDataChange}
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time || ''}
                onChange={handleWorkflowDataChange}
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
          </div>
        );
        
      case 'reminder':
        return (
          <div className="reminder-form">
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Reminder Text</label>
              <textarea
                name="text"
                value={formData.text || ''}
                onChange={handleWorkflowDataChange}
                placeholder="e.g. Pick up groceries"
                rows="3"
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time || ''}
                onChange={handleWorkflowDataChange}
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
          </div>
        );
        
      case 'email':
        return (
          <div className="email-form">
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">To</label>
              <input
                type="email"
                name="to"
                value={formData.to || ''}
                onChange={handleWorkflowDataChange}
                placeholder="e.g. recipient@example.com"
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject || ''}
                onChange={handleWorkflowDataChange}
                placeholder="e.g. Meeting Agenda"
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
            
            <div className="form-group mb-3">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                name="body"
                value={formData.body || ''}
                onChange={handleWorkflowDataChange}
                placeholder="Enter email content here..."
                rows="4"
                className={`
                  w-full
                  px-3
                  py-2
                  rounded-md
                  border
                  border-${theme === 'dark' ? 'gray-600' : 'gray-300'}
                  bg-${theme === 'dark' ? 'gray-700' : 'white'}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                `}
              />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Workflows</h3>
        <button
          onClick={toggleWorkflowPanel}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close workflows panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      {/* Workflow type selector */}
      <div className="workflow-types flex flex-wrap gap-2 mb-4">
        {workflowTypes.map((type) => (
          <button
            key={type}
            onClick={() => handleWorkflowSelect(type)}
            className={`
              px-3
              py-1
              text-sm
              rounded-md
              ${selectedWorkflow === type
                ? `bg-blue-500 text-white`
                : `bg-${theme === 'dark' ? 'gray-700' : 'gray-200'} hover:bg-${theme === 'dark' ? 'gray-600' : 'gray-300'}`
              }
            `}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Workflow form */}
      <div className="workflow-form mb-4">
        {renderWorkflowForm()}
      </div>
      
      {/* Workflow status */}
      {workflowStatus && (
        <div className={`
          workflow-status
          p-3
          rounded-md
          mb-4
          ${workflowStatus.success 
            ? `bg-green-100 border border-green-200 text-green-800` 
            : `bg-red-100 border border-red-200 text-red-800`
          }
        `}>
          <div className="font-medium">
            {workflowStatus.success ? 'Success' : 'Error'}
          </div>
          <div className="text-sm mt-1">
            {workflowStatus.message}
          </div>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex justify-end">
        <button
          onClick={handleTriggerWorkflow}
          disabled={!selectedWorkflow || isWorkflowTriggering}
          className={`
            px-4
            py-2
            rounded-md
            bg-blue-500
            text-white
            hover:bg-blue-600
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:ring-offset-2
            disabled:opacity-50
            disabled:cursor-not-allowed
            flex
            items-center
          `}
        >
          {isWorkflowTriggering ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Trigger Workflow
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceChatWorkflow; 