import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Button, Alert, Badge } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faBuilding, faSitemap } from '@fortawesome/free-solid-svg-icons';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const UserProfileDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Use mock data since this is a new component
        // In a real implementation, you would fetch user data from API
        setTimeout(() => {
          setUser({
            id: id || '1',
            username: 'user' + (id || ''),
            fullName: 'User ' + (id || ''),
            email: `user${id}@example.com`,
            phone: '08123456789',
            role: 'Staff',
            department: 'Production',
            joinDate: '2022-01-15',
            status: 'Active',
            roles: ['Staff', 'Production']
          });
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return <Container className="mt-5"><LoadingSpinner /></Container>;
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">User not found</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">User Profile Details</h2>
      
      <Card>
        <Card.Header className="bg-primary text-white">
          <FontAwesomeIcon icon={faUser} className="me-2" />
          {user.fullName}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p>
                <strong>Username:</strong> {user.username}
              </p>
              <p>
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <FontAwesomeIcon icon={faPhone} className="me-2" />
                <strong>Phone:</strong> {user.phone}
              </p>
              <p>
                <strong>Join Date:</strong> {new Date(user.joinDate).toLocaleDateString()}
              </p>
            </Col>
            <Col md={6}>
              <p>
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                <strong>Department:</strong> {user.department}
              </p>
              <p>
                <FontAwesomeIcon icon={faSitemap} className="me-2" />
                <strong>Role:</strong> {user.role}
              </p>
              <p>
                <strong>Status:</strong> <Badge bg="success">{user.status}</Badge>
              </p>
              <p>
                <strong>Roles:</strong>{' '}
                {user.roles.map((role, idx) => (
                  <Badge key={idx} bg="info" className="me-1">{role}</Badge>
                ))}
              </p>
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer>
          <div className="d-flex justify-content-between">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/user-profile/edit/${user.id}`)}
            >
              Edit Profile
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Container>
  );
};

export default UserProfileDetailView;