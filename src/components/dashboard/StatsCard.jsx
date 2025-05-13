import React from 'react';
import { Card } from 'react-bootstrap';

const StatsCard = ({ icon, title, value, subtitle, color = "primary" }) => {
  const cardStyles = {
    card: {
      borderTop: `4px solid var(--bs-${color})`,
      boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.1)',
      marginBottom: '1.5rem'
    },
    iconContainer: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '4rem',
      height: '4rem',
      backgroundColor: `var(--bs-${color})`,
      color: 'white',
      borderRadius: '50%',
      fontSize: '1.75rem',
      marginRight: '1rem'
    },
    title: {
      fontSize: '0.8rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      marginBottom: '0.25rem',
      color: 'var(--bs-secondary)'
    },
    value: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: 'var(--bs-dark)',
      marginBottom: '0.25rem',
      lineHeight: 1
    },
    subtitle: {
      fontSize: '0.8rem',
      color: 'var(--bs-secondary)'
    }
  };

  return (
    <Card style={cardStyles.card}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-center">
          <div style={cardStyles.iconContainer}>
            {icon}
          </div>
          <div>
            <h6 style={cardStyles.title}>{title}</h6>
            <div style={cardStyles.value}>{value}</div>
            <div style={cardStyles.subtitle}>{subtitle}</div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default StatsCard;