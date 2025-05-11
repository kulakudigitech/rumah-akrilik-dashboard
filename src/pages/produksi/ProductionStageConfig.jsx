import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Modal, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const ProductionStageConfig = () => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState({ name: '', description: '', order: 0, is_active: true });
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error("Anda perlu login untuk mengakses data.");
      }
      
      const response = await fetch('https://rumahakrilik.id/api/production-stages/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Sort stages by order
      const sortedStages = data.results ? [...data.results].sort((a, b) => a.order - b.order) : [];
      setStages(sortedStages);
    } catch (error) {
      console.error("Error fetching production stages:", error);
      setError(`Gagal memuat data tahapan produksi. ${error.message || "Coba lagi nanti."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = () => {
    setCurrentStage({
      name: '',
      description: '',
      order: stages.length > 0 ? stages[stages.length - 1].order + 1 : 1,
      is_active: true
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditStage = (stage) => {
    setCurrentStage({ ...stage });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteStage = async (stageId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tahapan produksi ini?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      const response = await fetch(`https://rumahakrilik.id/api/production-stages/${stageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Remove stage from state
      setStages(stages.filter(s => s.id !== stageId));
      setSuccessMessage('Tahapan produksi berhasil dihapus!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error deleting stage:", error);
      setError(`Gagal menghapus tahapan. ${error.message || "Coba lagi nanti."}`);
    }
  };

  const handleSaveStage = async () => {
    // Validate form
    if (!currentStage.name.trim()) {
      setError("Nama tahapan tidak boleh kosong!");
      return;
    }
    
    setSaveLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing 
        ? `https://rumahakrilik.id/api/production-stages/${currentStage.id}/`
        : 'https://rumahakrilik.id/api/production-stages/';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(currentStage)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      const savedStage = await response.json();
      
      if (isEditing) {
        setStages(stages.map(s => s.id === savedStage.id ? savedStage : s));
      } else {
        setStages([...stages, savedStage]);
      }
      
      setSuccessMessage(`Tahapan produksi berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}!`);
      setShowModal(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error saving stage:", error);
      setError(`Gagal menyimpan tahapan. ${error.message || "Coba lagi nanti."}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMoveStage = async (stageId, direction) => {
    // Find the stage index
    const index = stages.findIndex(s => s.id === stageId);
    if (index === -1) return;
    
    // Don't move if at the end
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stages.length - 1) return;
    
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap order values
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Update current stage
      const currentStageUpdate = {
        ...stages[index],
        order: stages[otherIndex].order
      };
      
      // Update other stage
      const otherStageUpdate = {
        ...stages[otherIndex],
        order: stages[index].order
      };
      
      // Update both stages
      const promises = [
        fetch(`https://rumahakrilik.id/api/production-stages/${currentStageUpdate.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order: currentStageUpdate.order })
        }),
        fetch(`https://rumahakrilik.id/api/production-stages/${otherStageUpdate.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order: otherStageUpdate.order })
        })
      ];
      
      await Promise.all(promises);
      
      // Update local state
      const newStages = [...stages];
      [newStages[index], newStages[otherIndex]] = [newStages[otherIndex], newStages[index]];
      setStages(newStages);
    } catch (error) {
      console.error("Error reordering stages:", error);
      setError(`Gagal mengubah urutan tahapan. ${error.message || "Coba lagi nanti."}`);
    }
  };

  return (
    <Container fluid className="py-4">
      <h2>Konfigurasi Tahapan Produksi</h2>
      <p className="text-muted">
        Tetapkan tahapan produksi yang akan digunakan untuk melacak proses produksi.
      </p>
      
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Daftar Tahapan Produksi</span>
          <Button variant="primary" onClick={handleAddStage}>
            <FaPlus className="me-1" /> Tambah Tahapan
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading stages...</p>
            </div>
          ) : stages.length === 0 ? (
            <Alert variant="info">
              Belum ada tahapan produksi. Klik "Tambah Tahapan" untuk menambahkan.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>No.</th>
                  <th style={{ width: '20%' }}>Nama Tahapan</th>
                  <th style={{ width: '40%' }}>Deskripsi</th>
                  <th style={{ width: '10%' }}>Urutan</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '15%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {[...stages].sort((a, b) => a.order - b.order).map((stage, index) => (
                  <tr key={stage.id}>
                    <td>{index + 1}</td>
                    <td>{stage.name}</td>
                    <td>{stage.description || '-'}</td>
                    <td>{stage.order}</td>
                    <td>
                      <span className={`badge ${stage.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {stage.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleMoveStage(stage.id, 'up')}
                          disabled={index === 0}
                        >
                          <FaArrowUp />
                        </Button>
                        
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleMoveStage(stage.id, 'down')}
                          disabled={index === stages.length - 1}
                        >
                          <FaArrowDown />
                        </Button>
                        
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => handleEditStage(stage)}
                        >
                          <FaEdit />
                        </Button>
                        
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDeleteStage(stage.id)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Header>Panduan Penggunaan</Card.Header>
        <Card.Body>
          <ol>
            <li>Tambahkan tahapan produksi untuk alur kerja produk Anda.</li>
            <li>Urutan tahapan menentukan alur produksi dari awal sampai akhir.</li>
            <li>Gunakan tombol panah untuk mengubah urutan tahapan.</li>
            <li>Tahapan yang tidak aktif tidak akan digunakan dalam pelacakan produksi.</li>
          </ol>
        </Card.Body>
      </Card>
      
      {/* Modal for adding/editing stages */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Tahapan Produksi' : 'Tambah Tahapan Produksi'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Tahapan</Form.Label>
              <Form.Control 
                type="text" 
                value={currentStage.name} 
                onChange={(e) => setCurrentStage({...currentStage, name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                value={currentStage.description || ''} 
                onChange={(e) => setCurrentStage({...currentStage, description: e.target.value})}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Urutan</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1"
                    value={currentStage.order} 
                    onChange={(e) => setCurrentStage({...currentStage, order: Number(e.target.value)})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Check 
                    type="switch"
                    id="is-active-switch"
                    label="Aktif"
                    checked={currentStage.is_active}
                    onChange={(e) => setCurrentStage({...currentStage, is_active: e.target.checked})}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveStage}
            disabled={saveLoading}
          >
            {saveLoading ? (
              <>
                <Spinner size="sm" animation="border" className="me-1" /> 
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductionStageConfig;
