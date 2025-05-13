import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaMoneyBillWave, FaChartLine, FaUsers, FaChartPie, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { formatCurrency, formatDate, getStatusBadgeColor, getStatusLabel } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import CampaignForm from './CampaignForm';
import './MarketingDashboard.css';
import StatsCard from '../../components/dashboard/StatsCard';

// PENTING: Register Chart.js components!
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SPVMarketingDashboard = () => {
  // Tambahkan useNavigate untuk redirect
  const navigate = useNavigate();
  
  // State untuk menyimpan data tim marketing yang diambil dari API
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tambahkan state untuk data performance
  const [performanceData, setPerformanceData] = useState({
    teamPerformanceData: null,
    closingRateTrendData: null,
    sourceData: null,
    sourceConversionData: []
  });
  
  // State untuk kampanye
  const [campaigns, setCampaigns] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [campaignsError, setCampaignsError] = useState(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Ubah bagian tab menu dengan komponen custom yang lebih jelas
  const [activeTab, setActiveTab] = useState('overview');

  // Ganti tabs dengan komponen custom yang lebih kontras
  const renderTabMenu = () => (
    <div className="nav-tab-menu">
      <div 
        className={`nav-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        Overview
      </div>
      <div 
        className={`nav-tab-item ${activeTab === 'tim-marketing' ? 'active' : ''}`}
        onClick={() => setActiveTab('tim-marketing')}
      >
        Tim Marketing
      </div>
      <div 
        className={`nav-tab-item ${activeTab === 'kampanye' ? 'active' : ''}`}
        onClick={() => setActiveTab('kampanye')}
      >
        Kampanye
      </div>
      <div 
        className={`nav-tab-item ${activeTab === 'rencana-marketing' ? 'active' : ''}`}
        onClick={() => setActiveTab('rencana-marketing')}
      >
        Rencana Marketing
      </div>
    </div>
  );

  // Fungsi untuk menavigasi ke dashboard marketing tertentu
  const navigateToMemberDashboard = (memberId, role) => {
    let dashboardPath = '';
    
    // Tentukan path dashboard berdasarkan role
    if (role.toLowerCase().includes('cs online')) {
      dashboardPath = '/dashboard/marketing/cs-online';
    } else if (role.toLowerCase().includes('cs offline')) {
      dashboardPath = '/dashboard/marketing/cs-offline';
    } else if (role.toLowerCase().includes('retail') || role.toLowerCase().includes('representative')) {
      dashboardPath = '/dashboard/marketing/retail';
    } else {
      // Default path jika role tidak dikenali
      dashboardPath = '/dashboard/marketing';
    }
    
    // Tambahkan ID member ke query parameter
    navigate(`${dashboardPath}?id=${memberId}`);
  };
  
  // Fungsi untuk mengambil data tim marketing dari API
  const fetchMarketingTeamData = async () => {
    setIsLoading(true);
    try {
      // Coba akses endpoint khusus untuk data marketing team
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('https://rumahakrilik.id/api/marketing/team/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && Array.isArray(response.data)) {
        const marketingTeam = response.data;
        
        if (marketingTeam.length > 0) {
          console.log("Berhasil memuat data tim marketing dari API:", marketingTeam.length, "anggota");
          setTeamMembers(marketingTeam);
          
          // Cache data untuk penggunaan offline
          try {
            localStorage.setItem('marketingUsers', JSON.stringify(marketingTeam));
          } catch (cacheError) {
            console.warn("Gagal menyimpan data marketing di cache:", cacheError);
          }
          
          setError(null);
          return;
        }
      }
      
      // Jika tidak ada data, lempar error untuk pindah ke fallback
      throw new Error("Data tim marketing kosong dari API"); 
    } catch (err) {
      console.error("Error fetching marketing team data:", err);
      setError("Gagal memuat data tim marketing dari server, menggunakan data lokal.");
      
      // Coba ambil dari cache jika ada
      try {
        const cachedUsers = localStorage.getItem('marketingUsers');
        if (cachedUsers) {
          const parsedUsers = JSON.parse(cachedUsers);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            console.log("Menggunakan data marketing dari cache:", parsedUsers.length, "anggota");
            setTeamMembers(parsedUsers);
            return;
          }
        }
      } catch (cacheError) {
        console.error("Error parsing cached marketing users:", cacheError);
      }
      
      // Fallback ke data hardcoded
      console.log("Menggunakan data marketing hardcoded");
      const userProfiles = [
        { id: 1, username: 'meira', name: 'Meira', role: 'CS Online', phone: '0812-3436-0152', isActive: true },
        { id: 2, username: 'oktarina', name: 'Oktarina', role: 'CS Offline', phone: '0814-7667-4442', isActive: true },
        { id: 3, username: 'romita', name: 'Romita', role: 'CS Offline', phone: '0858-4859-1999', isActive: true },
        { id: 4, username: 'dedy', name: 'Dedy', role: 'Retail Representative', phone: '0899-7578-678', isActive: true }
      ];
      
      setTeamMembers(userProfiles);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fungsi untuk mengambil data performa marketing
  const fetchMarketingPerformanceData = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      // Ambil data order dengan filter berdasarkan periode (misalnya 30 hari terakhir)
      // Endpoint ini harusnya mengembalikan data order dengan info marketing-nya
      const response = await axios.get('https://rumahakrilik.id/api/marketing/performance/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Proses data untuk chart, misalkan:
        
        // 1. Data untuk performa tim (lead dan closing)
        const teamData = {
          labels: ['CS Online', 'CS Offline', 'Retail'],
          datasets: [
            {
              label: 'Lead',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              data: [
                response.data.cs_online?.leads || 0,
                response.data.cs_offline?.leads || 0, 
                response.data.retail?.leads || 0
              ]
            },
            {
              label: 'Closing',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              data: [
                response.data.cs_online?.closings || 0,
                response.data.cs_offline?.closings || 0,
                response.data.retail?.closings || 0
              ]
            }
          ]
        };
        
        // 2. Data closing rate trend
        // Asumsikan response.data.trends berisi data per bulan
        const trendData = {
          labels: ['Januari', 'Februari', 'Maret', 'April', 'Mei'],
          datasets: [
            {
              label: 'CS Online',
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              data: response.data.trends?.cs_online || [35, 40, 38, 45, 43],
              tension: 0.3,
              fill: true
            },
            {
              label: 'CS Offline',
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              data: response.data.trends?.cs_offline || [25, 28, 30, 29, 32],
              tension: 0.3,
              fill: true
            },
            {
              label: 'Retail',
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              data: [50, 55, 60, 58, 65],
              tension: 0.3,
              fill: true
            }
          ]
        };
        
        // 3. Data sumber order
        const sourceLabels = response.data.sources?.map(s => s.name) || 
                            ['Instagram', 'Website', 'Google', 'Facebook', 'Referral', 'Walk-in'];
        const sourceValues = response.data.sources?.map(s => s.count) || [45, 25, 10, 5, 10, 5];
        
        const sourceData = {
          labels: sourceLabels,
          datasets: [
            {
              data: sourceValues,
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        };
        
        // 4. Data sumber berdasarkan conversion rate
        const sourceConversionData = response.data.source_conversion || [
          { source: 'Instagram', leads: 245, orders: 98, convRate: 40.0, avgValue: 2850000 },
          { source: 'Website', leads: 185, orders: 67, convRate: 36.2, avgValue: 3120000 },
          { source: 'Walk-in', leads: 122, orders: 43, convRate: 35.2, avgValue: 4250000 },
          { source: 'Referral', leads: 87, orders: 29, convRate: 33.3, avgValue: 3750000 },
          { source: 'Google', leads: 65, orders: 18, convRate: 27.7, avgValue: 2950000 }
        ];
        
        // Update state dengan data yang sudah diproses
        setPerformanceData({
          teamPerformanceData: teamData,
          closingRateTrendData: trendData,
          sourceData: sourceData,
          sourceConversionData: sourceConversionData
        });
        
      } else {
        throw new Error("No performance data returned from API");
      }
    } catch (err) {
      console.error("Error fetching marketing performance data:", err);
      // Gunakan data default/dummy jika gagal ambil dari API
      
      // Set data default...
      setPerformanceData({
        teamPerformanceData: {
          labels: ['CS Online', 'CS Offline', 'Retail'],
          datasets: [
            {
              label: 'Lead',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
              data: [65, 48, 32]
            },
            {
              label: 'Closing',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
              data: [28, 12, 19]
            }
          ]
        },
        
        closingRateTrendData: {
          labels: ['Januari', 'Februari', 'Maret', 'April', 'Mei'],
          datasets: [
            {
              label: 'CS Online',
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              data: [35, 40, 38, 45, 43],
              tension: 0.3,
              fill: true
            },
            {
              label: 'CS Offline',
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              data: [25, 28, 30, 29, 32],
              tension: 0.3,
              fill: true
            },
            {
              label: 'Retail',
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              data: [50, 55, 60, 58, 65],
              tension: 0.3,
              fill: true
            }
          ]
        },
        
        sourceData: {
          labels: ['Instagram', 'Website', 'Google', 'Facebook', 'Referral', 'Walk-in'],
          datasets: [
            {
              data: [45, 25, 10, 5, 10, 5],
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }
          ]
        },
        
        sourceConversionData: [
          { source: 'Instagram', leads: 245, orders: 98, convRate: 40.0, avgValue: 2850000 },
          { source: 'Website', leads: 185, orders: 67, convRate: 36.2, avgValue: 3120000 },
          { source: 'Walk-in', leads: 122, orders: 43, convRate: 35.2, avgValue: 4250000 },
          { source: 'Referral', leads: 87, orders: 29, convRate: 33.3, avgValue: 3750000 },
          { source: 'Google', leads: 65, orders: 18, convRate: 27.7, avgValue: 2950000 }
        ]
      });
    }
  };

  const fetchCampaigns = useCallback(async () => {
    setIsLoadingCampaigns(true);
    setCampaignsError(null);
    
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('https://rumahakrilik.id/api/marketing/campaigns/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setCampaigns(response.data);
      } else {
        throw new Error('Invalid campaign data format');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaignsError('Gagal memuat data kampanye marketing');
      
      // Fallback data
      setCampaigns([
        {
          id: 1,
          name: 'Promo Lebaran 2025',
          description: 'Diskon 20% untuk semua produk akrilik',
          platform: 'Instagram',
          budget: 5000000,
          start_date: '2025-03-01',
          end_date: '2025-04-15',
          status: 'active'
        },
        {
          id: 2,
          name: 'Google Ads Q3 2025',
          description: 'Kampanye iklan Google untuk Q3',
          platform: 'Google',
          budget: 7500000,
          start_date: '2025-07-01',
          end_date: '2025-09-30',
          status: 'planned'
        }
      ]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, []);

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignForm(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.delete(`https://rumahakrilik.id/api/marketing/campaigns/${campaignId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchCampaigns();
    } catch (err) {
      console.error("Error deleting campaign:", err);
    }
  };

  // Ubah bagian status badge untuk kontras lebih baik
  const renderStatusBadge = (status) => {
    let badgeClass = "";
    let statusText = "";
    
    switch (status?.toLowerCase()) {
      case 'aktif':
      case 'active':
        badgeClass = "badge-aktif";
        statusText = "Aktif";
        break;
      case 'planned':
      case 'direncanakan':
        badgeClass = "badge-direncanakan";
        statusText = "Direncanakan";
        break;
      case 'completed':
      case 'selesai':
        badgeClass = "badge-selesai";
        statusText = "Selesai";
        break;
      default:
        badgeClass = "badge bg-secondary";
        statusText = status || "Unknown";
    }
    
    return <span className={`badge ${badgeClass}`}>{statusText}</span>;
  };

  // Panggil API saat komponen dimuat
  useEffect(() => {
    fetchMarketingTeamData();
    fetchMarketingPerformanceData();
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="spv-marketing-dashboard">
      <div className="mb-4">
        <h4 className="mb-2">Supervisor Marketing Dashboard</h4>
        <p className="text-muted small">Overview dan kontrol aktivitas marketing</p>
      </div>

      {/* Stats Row */}
      <Row className="mb-4">
        <Col md={3}>
          <StatsCard 
            icon={<FaMoneyBillWave className="text-primary" />}
            title="Total Penjualan"
            value="8.500.000"
            subtitle="Total keseluruhan"
          />
        </Col>
        <Col md={3}>
          <StatsCard 
            icon={<FaChartLine className="text-success" />}
            title="Target Tercapai"
            value="75%"
            subtitle="Dari target bulan ini"
          />
        </Col>
        <Col md={3}>
          <StatsCard 
            icon={<FaUsers className="text-warning" />}
            title="Customer Baru"
            value="12"
            subtitle="Bulan ini"
          />
        </Col>
        <Col md={3}>
          <StatsCard 
            icon={<FaChartPie className="text-info" />}
            title="Conversion Rate"
            value="25%"
            subtitle="Rata-rata konversi"
          />
        </Col>
      </Row>

      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-white py-3">
          {renderTabMenu()}
        </Card.Header>

        <Card.Body className="pt-4">
          {activeTab === 'overview' && (
            <div>
              {/* Konten overview */}
              <h5 className="mb-4">Performance Overview</h5>
              <p>Konten overview dashboard marketing</p>
            </div>
          )}

          {activeTab === 'tim-marketing' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Tim Marketing</h5>
                <Button variant="primary" size="sm">
                  <FaPlus className="me-1" /> Tambah Anggota
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Memuat data tim marketing...</p>
                </div>
              ) : error ? (
                <Alert variant="warning">{error}</Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Nama</th>
                        <th>Peran</th>
                        <th>No. Kontak</th>
                        <th>Status</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td>{member.name}</td>
                          <td>{member.role}</td>
                          <td>{member.phone}</td>
                          <td>
                            <Badge bg={member.isActive ? 'success' : 'secondary'}>
                              {member.isActive ? 'Aktif' : 'Non-aktif'}
                            </Badge>
                          </td>
                          <td className="text-center">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              className="me-2"
                              onClick={() => navigateToMemberDashboard(member.id, member.role)}
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kampanye' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4 marketing-campaign-title">
                <span>Kampanye Marketing</span>
                <button 
                  className="btn btn-primary d-flex align-items-center" 
                  style={{ 
                    backgroundColor: '#4e73df', 
                    border: 'none', 
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => setShowCampaignForm(true)}
                >
                  <FaPlus style={{ marginRight: '8px' }} /> Tambah Kampanye
                </button>
              </div>

              {isLoadingCampaigns ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Memuat data kampanye marketing...</p>
                </div>
              ) : campaignsError ? (
                <Alert variant="warning">{campaignsError}</Alert>
              ) : (
                <div className="table-responsive">
                  <Table hover className="align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Nama Kampanye</th>
                        <th>Platform</th>
                        <th>Periode</th>
                        <th>Budget</th>
                        <th>Status</th>
                        <th className="text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id}>
                          <td>{campaign.name}</td>
                          <td>{campaign.platform}</td>
                          <td>
                            {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                          </td>
                          <td>{formatCurrency(campaign.budget)}</td>
                          <td>{renderStatusBadge(campaign.status)}</td>
                          <td className="action-column">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              className="btn-icon me-1"
                              onClick={() => handleEditCampaign(campaign)}
                              title="Edit Kampanye"
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="btn-icon"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              title="Hapus Kampanye"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rencana-marketing' && (
            <div>
              <h5 className="mb-4">Rencana Marketing</h5>
              <p>Fitur ini akan segera tersedia.</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal Form Kampanye */}
      <Modal
        show={showCampaignForm}
        onHide={() => setShowCampaignForm(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCampaign ? 'Edit Kampanye' : 'Tambah Kampanye'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <CampaignForm 
            initialData={selectedCampaign}
            onSubmitted={(data) => {
              fetchCampaigns();
              setShowCampaignForm(false);
              setSelectedCampaign(null);
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default SPVMarketingDashboard;