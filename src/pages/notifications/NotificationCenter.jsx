import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Badge, Tab, Tabs } from 'react-bootstrap';
import { FaWhatsapp, FaBell, FaCalendarAlt, FaHistory } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { sendWhatsAppMessage } from '../../utils/whatsappUtil';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    message: '',
    schedule: '',
    template: ''
  });
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('send');
  
  useEffect(() => {
    // Load notification history
    const loadNotificationHistory = async () => {
      try {
        setLoading(true);
        
        // For now, use mock data. In production, this would be an API call
        const mockHistory = [
          { 
            id: 1, 
            recipient: '628123456789', 
            message: 'Your order ORD001 has been shipped!',
            sentAt: new Date().toISOString(),
            status: 'delivered'
          },
          { 
            id: 2, 
            recipient: '628987654321', 
            message: 'Thank you for your order! Your order ORD002 has been confirmed.',
            sentAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            status: 'delivered'
          }
        ];
        
        setSentNotifications(mockHistory);
        
        // Load templates
        const mockTemplates = [
          { id: 1, name: 'Order Confirmation', content: 'Thank you for your order! Your order {{order_id}} has been confirmed.' },
          { id: 2, name: 'Shipping Update', content: 'Your order {{order_id}} has been shipped! It should arrive within {{days}} days.' },
          { id: 3, name: 'Production Update', content: 'Good news! Your order {{order_id}} is now in the {{stage}} stage of production.' }
        ];
        setTemplates(mockTemplates);
        
        // Load scheduled notifications
        const mockScheduled = [
          { 
            id: 1, 
            recipient: '628123456789', 
            message: 'Reminder: Your order ORD003 is ready for pickup!',
            scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            status: 'pending'
          }
        ];
        setScheduledNotifications(mockScheduled);
      } catch (error) {
        console.error('Error loading notification data:', error);
        toast.error('Failed to load notification data');
      } finally {
        setLoading(false);
      }
    };
    
    loadNotificationHistory();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMessage({
      ...newMessage,
      [name]: value
    });
    
    // If template is selected, populate the message
    if (name === 'template' && value) {
      const selectedTemplate = templates.find(t => t.id === parseInt(value));
      if (selectedTemplate) {
        setNewMessage(prev => ({
          ...prev,
          message: selectedTemplate.content
        }));
      }
    }
  };
  
  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      // Validate form
      if (!newMessage.recipient || !newMessage.message) {
        toast.error('Please provide both recipient and message');
        return;
      }
      
      // Format phone number if needed
      let formattedNumber = newMessage.recipient;
      if (formattedNumber.startsWith('0')) {
        formattedNumber = '62' + formattedNumber.substring(1);
      }
      
      // If scheduled, add to scheduled notifications
      if (newMessage.schedule) {
        const scheduled = {
          id: Date.now(),
          recipient: formattedNumber,
          message: newMessage.message,
          scheduledFor: new Date(newMessage.schedule).toISOString(),
          status: 'pending'
        };
        
        setScheduledNotifications([...scheduledNotifications, scheduled]);
        toast.success('Notification scheduled successfully');
      } else {
        // Send immediately
        const result = await sendWhatsAppMessage(formattedNumber, newMessage.message);
        
        if (result.success) {
          toast.success('Message sent successfully');
          
          // Add to sent notifications
          const sent = {
            id: Date.now(),
            recipient: formattedNumber,
            message: newMessage.message,
            sentAt: new Date().toISOString(),
            status: 'delivered'
          };
          
          setSentNotifications([...sentNotifications, sent]);
        } else {
          toast.error(`Failed to send message: ${result.error}`);
        }
      }
      
      // Reset form
      setNewMessage({
        recipient: '',
        message: '',
        schedule: '',
        template: ''
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };
  
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const previewTemplate = (content) => {
    let preview = content;
    const messageVariables = content.match(/{{(.*?)}}/g) || [];
    
    messageVariables.forEach(variable => {
      const varName = variable.replace(/{{|}}/g, '');
      preview = preview.replace(
        variable, 
        `<span style="background-color: #e9f5ff; padding: 2px 5px; border-radius: 3px; color: #0066cc; font-weight: 600;">${varName}</span>`
      );
    });
    
    return preview;
  };
  
  const getStatusBadge = (status) => {
    switch(status) {
      case 'delivered':
        return <Badge bg="success">Delivered</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">
        <FaBell className="me-2" /> Notification Center
      </h2>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="send" title={<span><FaWhatsapp className="me-2" />Send Notification</span>}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Send New Notification</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSendNotification}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Recipient Phone Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="recipient"
                        value={newMessage.recipient}
                        onChange={handleInputChange}
                        placeholder="e.g. 08123456789 or 628123456789"
                        required
                      />
                      <Form.Text className="text-muted">
                        Enter Indonesian format (08xxx or 628xxx)
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Template (Optional)</Form.Label>
                      <Form.Select 
                        name="template"
                        value={newMessage.template}
                        onChange={handleInputChange}
                      >
                        <option value="">Select a template</option>
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Schedule (Optional)</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="schedule"
                        value={newMessage.schedule}
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        Leave empty to send immediately
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Message</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={8}
                        name="message"
                        value={newMessage.message}
                        onChange={handleInputChange}
                        placeholder="Type your message here..."
                        required
                      />
                      <Form.Text className="text-muted">
                      Use {'{'}{'{'}{'}'}variable_name{'}'}{'}'} for dynamic content
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="d-flex justify-content-end mt-3">
                  <Button variant="primary" type="submit">
                    {newMessage.schedule ? 'Schedule Message' : 'Send Now'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="scheduled" title={<span><FaCalendarAlt className="me-2" />Scheduled</span>}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Scheduled Notifications</h5>
            </Card.Header>
            <Card.Body>
              {scheduledNotifications.length === 0 ? (
                <p className="text-center text-muted py-4">No scheduled notifications</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Message</th>
                      <th>Scheduled For</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledNotifications.map(notification => (
                      <tr key={notification.id}>
                        <td>{notification.recipient}</td>
                        <td>{notification.message.substring(0, 50)}...</td>
                        <td>{formatDateTime(notification.scheduledFor)}</td>
                        <td>{getStatusBadge(notification.status)}</td>
                        <td>
                          <Button variant="outline-danger" size="sm">
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="history" title={<span><FaHistory className="me-2" />History</span>}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Notification History</h5>
              <Button variant="outline-secondary" size="sm">
                Export Log
              </Button>
            </Card.Header>
            <Card.Body>
              {sentNotifications.length === 0 ? (
                <p className="text-center text-muted py-4">No notification history</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Message</th>
                      <th>Sent At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentNotifications.map(notification => (
                      <tr key={notification.id}>
                        <td>{notification.recipient}</td>
                        <td>{notification.message.substring(0, 50)}...</td>
                        <td>{formatDateTime(notification.sentAt)}</td>
                        <td>{getStatusBadge(notification.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default NotificationCenter;