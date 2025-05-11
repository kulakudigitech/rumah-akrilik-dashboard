import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal } from 'react-bootstrap';
import { FaSave, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState({
    id: null,
    name: '',
    content: '',
    variables: []
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load templates
    const loadTemplates = async () => {
      try {
        setLoading(true);
        
        // Mock data for now
        const mockTemplates = [
          { 
            id: 1, 
            name: 'Order Confirmation', 
            content: 'Terima kasih atas pesanan Anda di Rumah Akrilik. Pesanan {{order_id}} sudah kami terima dan sedang diproses.',
            variables: ['order_id'] 
          },
          { 
            id: 2, 
            name: 'Shipping Update', 
            content: 'Pesanan Anda {{order_id}} telah dikirim! Estimasi tiba dalam {{days}} hari.',
            variables: ['order_id', 'days']
          },
          { 
            id: 3, 
            name: 'Production Update', 
            content: 'Kabar baik! Pesanan Anda {{order_id}} saat ini berada dalam tahap {{stage}} produksi.',
            variables: ['order_id', 'stage']
          }
        ];
        
        setTemplates(mockTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
        toast.error('Failed to load notification templates');
      } finally {
        setLoading(false);
      }
    };
    
    loadTemplates();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTemplate({
      ...currentTemplate,
      [name]: value
    });
    
    // Extract variables from content
    if (name === 'content') {
      const variableRegex = /{{(.*?)}}/g;
      const matches = [...value.matchAll(variableRegex)];
      const extractedVars = matches.map(match => match[1].trim());
      
      // Remove duplicates
      const uniqueVars = [...new Set(extractedVars)];
      
      setCurrentTemplate(prev => ({
        ...prev,
        variables: uniqueVars
      }));
    }
  };
  
  const handleSaveTemplate = () => {
    if (!currentTemplate.name || !currentTemplate.content) {
      toast.error('Please provide both template name and content');
      return;
    }
    
    try {
      if (isEditing) {
        // Update existing template
        const updatedTemplates = templates.map(template => 
          template.id === currentTemplate.id ? currentTemplate : template
        );
        setTemplates(updatedTemplates);
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const newTemplate = {
          ...currentTemplate,
          id: Date.now()
        };
        setTemplates([...templates, newTemplate]);
        toast.success('Template created successfully');
      }
      
      // Reset form and close modal
      handleCloseModal();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };
  
  const handleDeleteTemplate = (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const filteredTemplates = templates.filter(template => template.id !== id);
        setTemplates(filteredTemplates);
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };
  
  const handleEditTemplate = (template) => {
    setCurrentTemplate(template);
    setIsEditing(true);
    setShowModal(true);
  };
  
  const handleNewTemplate = () => {
    setCurrentTemplate({
      id: null,
      name: '',
      content: '',
      variables: []
    });
    setIsEditing(false);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentTemplate({
      id: null,
      name: '',
      content: '',
      variables: []
    });
    setIsEditing(false);
  };
  
  const previewTemplate = (content) => {
    let preview = content;
    const variables = content.match(/{{(.*?)}}/g) || [];
    
    variables.forEach(variable => {
      // Replace {{variable}} with a styled version
      const varName = variable.replace(/{{|}}/g, '');
      preview = preview.replace(
        variable, 
        `<span style="background-color: #e9f5ff; padding: 2px 5px; border-radius: 3px; color: #0066cc; font-weight: 600;">${varName}</span>`
      );
    });
    
    return preview;
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Notification Templates</h2>
        <Button variant="primary" onClick={handleNewTemplate}>
          <FaPlus className="me-2" /> New Template
        </Button>
      </div>
      
      <Card>
        <Card.Header>
          <h5 className="mb-0">Available Templates</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <p className="text-center py-3">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-center py-3">No templates available. Create your first template!</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Content</th>
                  <th>Variables</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(template => (
                  <tr key={template.id}>
                    <td style={{ width: '20%' }}>{template.name}</td>
                    <td style={{ width: '50%' }}>
                      <div dangerouslySetInnerHTML={{ __html: previewTemplate(template.content) }} />
                    </td>
                    <td style={{ width: '15%' }}>
                      {template.variables.map(variable => (
                        <span 
                          key={variable}
                          className="me-2 badge bg-light text-dark"
                          style={{ borderRadius: '12px' }}
                        >
                          {variable}
                        </span>
                      ))}
                    </td>
                    <td style={{ width: '15%' }}>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <FaEdit /> Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <FaTrash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* Template Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Template' : 'Create New Template'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Template Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={currentTemplate.name}
                onChange={handleInputChange}
                placeholder="e.g. Order Confirmation"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Template Content</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5}
                name="content"
                value={currentTemplate.content}
                onChange={handleInputChange}
                placeholder="Type your template content here. Use {{variable_name}} for dynamic content."
                required
              />
              <Form.Text className="text-muted">
                Use {'{variable_name}'} syntax for dynamic content. Example: "Hello {'{customer_name}'}, your order {'{order_id}'} is ready."
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Detected Variables</Form.Label>
              <div>
                {currentTemplate.variables.length === 0 ? (
                  <p className="text-muted">No variables detected. Use {'{variable_name}'} in your template.</p>
                ) : (
                  currentTemplate.variables.map(variable => (
                    <span 
                      key={variable}
                      className="me-2 mb-2 badge bg-light text-dark"
                      style={{ borderRadius: '12px', fontSize: '14px' }}
                    >
                      {variable}
                    </span>
                  ))
                )}
              </div>
            </Form.Group>
            
            <div className="mt-4">
              <h6>Preview:</h6>
              <Card body className="bg-light">
                <div dangerouslySetInnerHTML={{ __html: previewTemplate(currentTemplate.content) }} />
              </Card>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveTemplate}>
            <FaSave className="me-2" /> {isEditing ? 'Update Template' : 'Save Template'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default NotificationTemplates;