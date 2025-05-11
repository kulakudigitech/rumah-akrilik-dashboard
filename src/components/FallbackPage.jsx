import React from 'react';
import { Link } from 'react-router-dom';

const FallbackPage = ({ title = "Halaman Belum Tersedia", message = "Maaf, halaman ini masih dalam pengembangan" }) => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.icon}>??</div>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttons}>
          <Link to="/" style={styles.button}>Kembali ke Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '500px',
    width: '100%'
  },
  title: {
    fontSize: '24px',
    margin: '0 0 20px',
    color: '#2c3e50'
  },
  icon: {
    fontSize: '60px',
    margin: '20px 0'
  },
  message: {
    fontSize: '16px',
    color: '#666',
    margin: '20px 0'
  },
  buttons: {
    marginTop: '25px'
  },
  button: {
    backgroundColor: '#4e73df',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-block',
    cursor: 'pointer'
  }
};

export default FallbackPage;