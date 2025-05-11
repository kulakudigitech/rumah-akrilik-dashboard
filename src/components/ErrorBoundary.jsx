import React from 'react';
import { Button, Container, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-5 text-center">
          <Alert variant="danger">
            <Alert.Heading>Terjadi kesalahan saat menampilkan konten</Alert.Heading>
            <p>Silakan kembali ke halaman dashboard atau coba muat ulang halaman.</p>
            
            <div className="mt-3">
              <Link to="/">
                <Button variant="primary" className="me-2">Kembali ke Dashboard</Button>
              </Link>
              <Button 
                variant="secondary" 
                onClick={() => window.location.reload()}
              >
                Muat Ulang Halaman
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-start">
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  <summary>Detail Error</summary>
                  <p>{this.state.error && this.state.error.toString()}</p>
                  <p>{this.state.errorInfo && this.state.errorInfo.componentStack}</p>
                </details>
              </div>
            )}
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;