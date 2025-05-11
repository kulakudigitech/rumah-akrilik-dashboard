// /root/rumah-akrilik/rumah-akrilik-dashboard/src/pages/produksi/ProductionOrderDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, ProgressBar, Form } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Add useNavigate here
import { FaArrowLeft, FaEdit, FaCheckCircle, FaExclamationTriangle, FaSave, FaUndoAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import { updateProductionTracking } from '../../services/productionService';
import { sendProductionStatusNotification } from '../../services/notificationService';

const ProductionOrderDetail = () => {
  const { id } = useParams(); // Use id instead of orderId consistently
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  const [debug, setDebug] = useState(false);
  const [stages, setStages] = useState({
    desain: false,
    operator_mesin: false,
    finishing: false,
    quality_control: false,
    packing: false,
    siap_kirim_pasang: false
  });
  const [editMode, setEditMode] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Add submitting state
  const [notifyCustomer, setNotifyCustomer] = useState(false); // State for notification checkbox
  const [prevStages, setPrevStages] = useState({});
  const [estimatedDates, setEstimatedDates] = useState({
    desain: '',
    operator_mesin: '',
    finishing: '',
    quality_control: '',
    packing: '',
    siap_kirim_pasang: ''
  });

  // Ganti state staffList dengan staffByRole
  const [staffByRole, setStaffByRole] = useState({
    designer: [],
    operator: [],
    finishing: [],
    quality_control: [],
    packing: [],
    shipping: []
  });

  // Tambahkan state untuk file upload
  const [stagePhotos, setStagePhotos] = useState({
    desain: null,
    operator_mesin: null,
    finishing: null,
    quality_control: null,
    packing: null,
    siap_kirim_pasang: null
  });

  // Tambahkan state untuk history
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Sebelum handleSubmit, tambahkan untuk menyimpan status sebelumnya
  useEffect(() => {
    setPrevStages({ ...stages });
  }, []);

  // Ganti fetchStaff dengan ini
  useEffect(() => {
    const fetchStaffByRole = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) throw new Error("Authentication required");
        
        // Ambil semua staff terlebih dahulu
        const response = await axios.get('https://rumahakrilik.id/api/users/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const allStaff = response.data.results || [];
        console.log("All staff:", allStaff);
        
        // Mapping role berdasarkan atribut role, job_title, atau department
        const designers = allStaff.filter(staff => 
          staff.role?.toLowerCase() === 'designer' || 
          staff.job_title?.toLowerCase().includes('design') ||
          staff.department?.toLowerCase().includes('design')
        );
        
        const operators = allStaff.filter(staff => 
          staff.role?.toLowerCase() === 'operator' ||
          staff.job_title?.toLowerCase().includes('operator') ||
          staff.department?.toLowerCase().includes('produksi')
        );
        
        const finishingStaff = allStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('finishing') ||
          staff.role?.toLowerCase() === 'finishing'
        );
        
        const qcStaff = allStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('quality') ||
          staff.job_title?.toLowerCase().includes('qc') ||
          staff.role?.toLowerCase() === 'quality'
        );
        
        const packingStaff = allStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('packing') ||
          staff.role?.toLowerCase() === 'packing'
        );
        
        const shippingStaff = allStaff.filter(staff => 
          staff.job_title?.toLowerCase().includes('shipping') ||
          staff.job_title?.toLowerCase().includes('courier') ||
          staff.role?.toLowerCase() === 'shipping'
        );

        // Jika tidak ada staff khusus untuk beberapa kategori, gunakan staff produksi umum
        const productionStaff = allStaff.filter(staff =>
          staff.department?.toLowerCase().includes('produksi') ||
          staff.department?.toLowerCase().includes('production')
        );

        // Set state dengan menggabungkan staff khusus dan staff produksi umum jika diperlukan
        setStaffByRole({
          designer: designers.length > 0 ? designers : productionStaff,
          operator: operators.length > 0 ? operators : productionStaff,
          finishing: finishingStaff.length > 0 ? finishingStaff : productionStaff, 
          quality_control: qcStaff.length > 0 ? qcStaff : productionStaff,
          packing: packingStaff.length > 0 ? packingStaff : productionStaff,
          shipping: shippingStaff.length > 0 ? shippingStaff : productionStaff
        });
        
        console.log("Staff by role:", {
          designers: designers.length,
          operators: operators.length,
          finishing: finishingStaff.length,
          qc: qcStaff.length,
          packing: packingStaff.length,
          shipping: shippingStaff.length
        });
        
      } catch (error) {
        console.error('Error fetching staff list by role:', error);
        // Gunakan data kosong jika gagal
        setStaffByRole({
          designer: [],
          operator: [],
          finishing: [],
          quality_control: [],
          packing: [],
          shipping: []
        });
      }
    };
    
    fetchStaffByRole();
  }, []);

  // Tambahkan useEffect untuk fetch tracking history
  useEffect(() => {
    const fetchTrackingHistory = async () => {
      if (!id) return;
      
      try {
        const token = localStorage.getItem('jwtToken');
        const response = await axios.get(`https://rumahakrilik.id/api/production-tracking/history/${id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setTrackingHistory(response.data || []);
      } catch (error) {
        console.error('Error fetching tracking history:', error);
      }
    };
    
    fetchTrackingHistory();
  }, [id]);

  // State untuk status stage saat ini (dari API atau default)
  const [stageStatus, setStageStatus] = useState({});
  // State untuk catatan produksi
  const [notes, setNotes] = useState("");
  const [stageResponsibles, setStageResponsibles] = useState({
    desain: '',
    operator_mesin: '',
    finishing: '',
    quality_control: '',
    packing: '',
    siap_kirim_pasang: ''
  });

  // Calculate progress percentage
  const calculateProgress = (trackings) => {
    if (!trackings || trackings.length === 0) return 0;
    
    const completedCount = trackings.filter(track => track.status === 'completed').length;
    return Math.round((completedCount / trackings.length) * 100);
  };

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`https://rumahakrilik.id/api/orders/${id}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        setOrderData(response.data);
        
        // Update stages from API data
        const trackings = response.data.production_trackings || [];
        const newStages = {
          desain: trackings.find(t => t.stage === 1)?.status === 'completed',
          operator_mesin: trackings.find(t => t.stage === 2)?.status === 'completed',
          finishing: trackings.find(t => t.stage === 3)?.status === 'completed',
          quality_control: trackings.find(t => t.stage === 4)?.status === 'completed',
          packing: trackings.find(t => t.stage === 5)?.status === 'completed',
          siap_kirim_pasang: trackings.find(t => t.stage === 6)?.status === 'completed'
        };
        
        setStages(newStages);
        setError(null);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Gagal memuat data order. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    }; 

    fetchOrderData();
  }, [id]);
  
  // Handle checkbox changes
  const handleStageChange = (stage, checked) => {
    setStages(prev => ({
      ...prev,
      [stage]: checked
    }));
  };

  // Tambahkan fungsi handle upload
  const handlePhotoUpload = (stage, files) => {
    if (files && files[0]) {
      setStagePhotos({
        ...stagePhotos,
        [stage]: files[0]
      });
    }
  };
  
  // Replace handleSubmit with this version that uses allowed methods
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error("Authentication required");

      // First get the current order data
      const orderResponse = await axios.get(`https://rumahakrilik.id/api/orders/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Order data retrieved:", orderResponse.data);
      
      // Check if tracking records exist
      const trackingRecords = orderResponse.data.production_trackings || [];
      console.log("Tracking records:", trackingRecords);
      
      if (trackingRecords.length === 0) {
        console.log("No tracking records found. Creating initial records...");
        
        // We need to create tracking records first
        const createPromises = [];
        
        // Create tracking records for each stage (1-6)
        for (let stageId = 1; stageId <= 6; stageId++) {
          // Determine initial status based on checkbox values
          let status = "pending";
          switch (stageId) {
            case 1: status = stages.desain ? "completed" : "pending"; break;
            case 2: status = stages.operator_mesin ? "completed" : "pending"; break;
            case 3: status = stages.finishing ? "completed" : "pending"; break;
            case 4: status = stages.quality_control ? "completed" : "pending"; break;
            case 5: status = stages.packing ? "completed" : "pending"; break;
            case 6: status = stages.siap_kirim_pasang ? "completed" : "pending"; break;
          }
          
          console.log(`Creating tracking record for stage ${stageId} with status ${status}`);
          
          createPromises.push(
            axios({
              method: 'post',
              url: `https://rumahakrilik.id/api/production-tracking/`,
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: {
                order: parseInt(id),
                stage: stageId,
                status: status,
                notes: notes || ""
              }
            }).catch(err => {
              console.error(`Failed to create tracking for stage ${stageId}:`, err);
              return { error: true, stageId, message: err.message };
            })
          );
        }
        
        // Execute all create operations
        const createResults = await Promise.all(createPromises);
        const createErrors = createResults.filter(r => r.error);
        
        if (createErrors.length > 0) {
          console.warn(`${createErrors.length} tracking records failed to create:`, createErrors);
          setError(`Gagal membuat ${createErrors.length} dari ${createPromises.length} tracking records. Coba lagi.`);
        } else {
          console.log("Successfully created all tracking records");
          toast.success("Tracking produksi berhasil dibuat");
          
          // Update order status to 'Produksi'
          await updateOrderStatus();

          // Refresh page to show new tracking records
          window.location.reload();
          return;
        }
      } else {
        // If tracking records exist, update them
        console.log("Updating existing tracking records...");
        
        // Create a map of stage IDs to tracking record IDs
        const trackingMap = {};
        trackingRecords.forEach(record => {
          trackingMap[record.stage] = record.id;
        });
        
        console.log("Stage to tracking ID mapping:", trackingMap);
        console.log("Current stages status:", stages);
        
        // Update each tracking record with a separate request
        const updatePromises = [];
        
        // Process each stage
        for (let stageId = 1; stageId <= 6; stageId++) {
          // Skip if we don't have a tracking ID for this stage
          if (!trackingMap[stageId]) {
            console.log(`No tracking record found for stage ${stageId}, will create one`);
            
            // Determine status based on checkbox values
            let newStatus = "pending";
            switch (stageId) {
              case 1: newStatus = stages.desain ? "completed" : "pending"; break;
              case 2: newStatus = stages.operator_mesin ? "completed" : "pending"; break;
              case 3: newStatus = stages.finishing ? "completed" : "pending"; break;
              case 4: newStatus = stages.quality_control ? "completed" : "pending"; break;
              case 5: newStatus = stages.packing ? "completed" : "pending"; break;
              case 6: newStatus = stages.siap_kirim_pasang ? "completed" : "pending"; break;
            }
            
            // Create a new tracking record for this stage
            updatePromises.push(
              axios({
                method: 'post',
                url: `https://rumahakrilik.id/api/production-tracking/`,
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                data: {
                  order: parseInt(id),
                  stage: stageId,
                  status: newStatus,
                  notes: notes || ""
                }
              }).catch(err => {
                console.error(`Failed to create tracking for stage ${stageId}:`, err);
                return { error: true, stageId, message: err.message };
              })
            );
            
            continue;
          }
          
          // Determine the new status based on stage ID
          let newStatus = "pending";
          switch (stageId) {
            case 1: newStatus = stages.desain ? "completed" : "pending"; break;
            case 2: newStatus = stages.operator_mesin ? "completed" : "pending"; break;
            case 3: newStatus = stages.finishing ? "completed" : "pending"; break;
            case 4: newStatus = stages.quality_control ? "completed" : "pending"; break;
            case 5: newStatus = stages.packing ? "completed" : "pending"; break;
            case 6: newStatus = stages.siap_kirim_pasang ? "completed" : "pending"; break;
          }
          
          // Get the tracking record ID
          const trackingId = trackingMap[stageId];
          
          // Check if the status needs to change before sending update
          try {
            const currentRecord = await axios.get(`https://rumahakrilik.id/api/production-tracking/${trackingId}/`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (currentRecord.data.status !== newStatus) {
              console.log(`Updating stage ${stageId} (tracking ID ${trackingId}) to ${newStatus}`);
              
              // Add the update promise
              updatePromises.push(
                axios({
                  method: 'patch',
                  url: `https://rumahakrilik.id/api/production-tracking/${trackingId}/`,
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  data: { status: newStatus }
                }).catch(err => {
                  console.error(`Failed to update stage ${stageId}:`, err);
                  return { error: true, stageId, message: err.message };
                })
              );
            } else {
              console.log(`Stage ${stageId} already has status ${newStatus}, skipping update`);
            }
          } catch (err) {
            console.error(`Error checking current status for stage ${stageId}:`, err);
            // Skip this update if we can't check current status
          }
        }
        
        // Execute all updates
        if (updatePromises.length > 0) {
          const results = await Promise.all(updatePromises);
          const errors = results.filter(r => r.error);
          
          if (errors.length > 0) {
            console.warn(`${errors.length} updates failed:`, errors);
            toast.warning(`Updated ${results.length - errors.length} of ${results.length} stages successfully`);
          } else {
            toast.success("Status produksi berhasil diperbarui");
          }
          
          // Tambahkan setelah berhasil update tracking records
          if (updatePromises.length > 0 && errors.length === 0) {
            // Cari stage yang baru saja ditandai completed
            let completedStages = [];
            if (stages.desain && !trackingRecords.find(t => t.stage === 1)?.status === 'completed') completedStages.push('desain');
            if (stages.operator_mesin && !trackingRecords.find(t => t.stage === 2)?.status === 'completed') completedStages.push('operator_mesin');
            if (stages.finishing && !trackingRecords.find(t => t.stage === 3)?.status === 'completed') completedStages.push('finishing');
            if (stages.quality_control && !trackingRecords.find(t => t.stage === 4)?.status === 'completed') completedStages.push('quality_control');
            if (stages.packing && !trackingRecords.find(t => t.stage === 5)?.status === 'completed') completedStages.push('packing');
            if (stages.siap_kirim_pasang && !trackingRecords.find(t => t.stage === 6)?.status === 'completed') completedStages.push('siap_kirim_pasang');
            
            // Tambahkan checkbox untuk pengiriman notifikasi
            if (completedStages.length > 0 && notifyCustomer) {
              try {
                // Update orderData dengan progress terbaru
                const updatedOrder = {...orderData, progress: calculateProgress(orderData.production_trackings)};
                await sendProductionStatusNotification(updatedOrder, completedStages[0]);
                toast.success("Notifikasi status produksi berhasil dikirim ke customer");
              } catch (notifError) {
                console.error("Error sending notification:", notifError);
                toast.warning("Perubahan disimpan, tapi gagal mengirim notifikasi");
              }
            }
          }

          // Update order status to 'Produksi'
          await updateOrderStatus();

          // Refresh the data
          const updatedOrder = await axios.get(`https://rumahakrilik.id/api/orders/${id}/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          setOrderData(updatedOrder.data);
        } else {
          toast.info("Tidak ada perubahan untuk disimpan");
        }
      }

      // Update status order jika diperlukan
      await updateOrderStatus();
      
      toast.success("Tracking produksi berhasil dibuat dan status order diperbarui");
      
    } catch (err) {
      console.error("Error updating production stages:", err);
      setError(`Gagal memperbarui status: ${err.message}. Coba lagi atau hubungi admin.`);
      toast.error("Terjadi kesalahan saat memperbarui status produksi");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Fetch data order dan stages saat komponen mount atau ID berubah
  useEffect(() => {
    fetchProductionStages(); // Ambil daftar stage dulu
  }, []); // Hanya sekali saat mount

  useEffect(() => {
    if (stages.length > 0) { // Hanya fetch order jika stages sudah ada
      fetchOrderDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, useMockData, stages]); // Jalankan jika id, mock, atau stages berubah

  // Call this function early in your component
  useEffect(() => {
    checkEndpoints();
  }, [id]);

  // Fungsi untuk mengambil daftar semua tahapan produksi
  const fetchProductionStages = async () => {
    console.log("[Fetch Stages] Fetching production stages...");
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error("Token tidak ditemukan.");

      const response = await fetch('https://rumahakrilik.id/api/production-stages/?is_active=true', { // Ambil yang aktif saja
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Error ${response.status}: Gagal mengambil daftar tahapan.`);

      const data = await response.json();
      const fetchedStages = data.results ? [...data.results].sort((a, b) => a.order - b.order) : [];
      if (fetchedStages.length === 0) {
          console.warn("[Fetch Stages] No active production stages found in API.");
          // Sediakan default jika API kosong agar UI tidak error
          setStages([
              { id: 1, name: 'Desain', order: 1 }, { id: 2, name: 'Operator Mesin', order: 2 },
              { id: 3, name: 'Finishing', order: 3 }, { id: 4, name: 'Quality Control', order: 4 },
              { id: 5, name: 'Packing', order: 5 }, { id: 6, name: 'Siap Kirim Pasang', order: 6 },
          ]);
      } else {
           setStages(fetchedStages);
      }
      console.log("[Fetch Stages] Production stages loaded:", fetchedStages);

    } catch (error) {
      console.error("[Fetch Stages] Error:", error);
      setError(`Gagal memuat daftar tahapan produksi: ${error.message}`);
       // Sediakan default jika API gagal
       setStages([
            { id: 1, name: 'Desain', order: 1 }, { id: 2, name: 'Operator Mesin', order: 2 },
            { id: 3, name: 'Finishing', order: 3 }, { id: 4, name: 'Quality Control', order: 4 },
            { id: 5, name: 'Packing', order: 5 }, { id: 6, name: 'Siap Kirim Pasang', order: 6 },
        ]);
    }
  };

  // Fungsi untuk mengambil detail order dan data trackingnya
  const fetchOrderDetails = async () => {
    console.log(`[Fetch Order] Fetching details for order ID: ${id}`);
    setLoading(true);
    setError(null);
      
    if (useMockData) {
      console.log("Using mock data for development");
      const mockData = getMockData();
      setOrderData(mockData);
      setNotes(mockData.production?.notes || "");
      initializeStageStatus(mockData.production?.steps || {});
      setLoading(false);
      return;
    }
      
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error("Anda perlu login untuk mengakses data.");

      // Gunakan endpoint orders (bukan order) untuk konsistensi dengan API lainnya
      console.log(`[Fetch Order] API Call: GET /api/orders/${id}/`);
      const orderResponse = await axios.get(`https://rumahakrilik.id/api/orders/${id}/`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        }
      });

      if (!orderResponse.data) throw new Error("Gagal memuat detail order");
      const orderDataResult = orderResponse.data;
      console.log("[Fetch Order] Order data received:", orderDataResult);
      
      // Pengambilan tracking langsung dari respons order
      const trackingRecords = orderDataResult.production_trackings || [];
      console.log("[Fetch Tracking] Production tracking data:", trackingRecords);
      
      // Mapping status tracking ke checkbox
      const updatedStages = {
        desain: trackingRecords.find(t => t.stage === 1)?.status === 'completed',
        operator_mesin: trackingRecords.find(t => t.stage === 2)?.status === 'completed',
        finishing: trackingRecords.find(t => t.stage === 3)?.status === 'completed',
        quality_control: trackingRecords.find(t => t.stage === 4)?.status === 'completed',
        packing: trackingRecords.find(t => t.stage === 5)?.status === 'completed',
        siap_kirim_pasang: trackingRecords.find(t => t.stage === 6)?.status === 'completed'
      };
      
      console.log("[Fetch Tracking] Updated stages from API:", updatedStages);
      setStages(updatedStages);
      setOrderData(orderDataResult);
      setNotes(trackingRecords[0]?.notes || "");

    } catch (error) {
      console.error("[Fetch Order/Tracking] Error:", error);
      setError(`${error.message || "Gagal memuat detail order/produksi"}. Coba lagi.`);
      if (!useMockData) { console.log("Falling back to mock data after error"); setUseMockData(true); }
    } finally {
      setLoading(false);
    }
  };
  
  // Fungsi inisialisasi status stage lokal
  const initializeStageStatus = (steps) => {
    console.log("[Init Status] Initializing local stage status with:", steps);
    setStageStatus(steps || {});
  };

  // Handler perubahan checkbox status stage
  const handleStageStatusChange = (stageName, completed) => {
    setStageStatus(prev => ({ ...prev, [stageName]: completed }));
  };

  const saveProductionTracking = async () => {
    setUpdateLoading(true);
    setUpdateSuccess(false);
    setError(null);
  
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error("Autentikasi diperlukan");
  
      console.log("[Save Tracking] Current stages list:", stages);
      console.log("[Save Tracking] Current stageStatus state:", stageStatus);
  
      // Create the correct payload based on what your API expects
      const payload = {
        order: parseInt(id),
        notes: notes,
        stages: {}
      };
  
      // Convert stages to the format expected by API
      Object.entries(stageStatus).forEach(([stageName, completed]) => {
        const stage = stages.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === stageName);
        if (stage) {
          payload.stages[stage.id] = completed ? "completed" : "pending";
        }
      });
  
      console.log("[Save Tracking] Payload:", JSON.stringify(payload, null, 2));
  
      const baseURL = 'https://rumahakrilik.id';
      
      try {
        // Use the correct URL endpoint - this is the endpoint that exists in your Django URLs
        const updateResponse = await axios({
          method: 'post', // Use POST for the update_production_stages endpoint
          url: `${baseURL}/api/production-tracking/update/`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: payload
        });
        
        console.log("[Save Tracking] Success response from update:", updateResponse.data);
        setUpdateSuccess(true);
        toast.success("Status produksi berhasil diperbarui");
        
        // Refresh data after successful update
        fetchOrderDetails();
      } catch (error) {
        console.error("[Save Tracking] Update failed:", error);
        
        // If the update failed, try creating individual records for each stage
        // This is a fallback approach
        const createPromises = [];
        
        // Create an array of promises for creating each stage tracking record
        for (const [stageName, completed] of Object.entries(stageStatus)) {
          const stage = stages.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === stageName);
          if (!stage) continue;
          
          // For each stage, create a tracking record
          createPromises.push(
            axios({
              method: 'post',
              url: `${baseURL}/api/production-tracking/`,
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              data: {
                order: parseInt(id),
                stage: stage.id,
                status: completed ? "completed" : "pending",
                notes: notes
              }
            }).catch(error => {
              // Ignore errors for individual create operations
              console.log(`[Save Tracking] Error creating stage ${stage.name}:`, error);
              return null;
            })
          );
        }
        
        // Execute all the create operations in parallel
        await Promise.all(createPromises);
        
        console.log("[Save Tracking] Completed individual stage updates");
        setUpdateSuccess(true);
        toast.success("Status produksi berhasil diperbarui");
        
        // Refresh data after successful update
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("[Save Tracking] Error:", error);
      
      let errorMessage = error.message;
      if (error.response) {
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        
        if (typeof error.response.data === 'object') {
          errorMessage = JSON.stringify(error.response.data);
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else {
          errorMessage = `Error ${error.response.status}`;
        }
      }
      
      setError(`Gagal menyimpan update: ${errorMessage}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Add this debugging function to your ProductionOrderDetail.jsx
  const checkEndpoints = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    
    // Try multiple possible endpoints
    const possibleEndpoints = [
      "production-tracking/update/",
      "production-tracking/by-order/${id}/update/",
      "production-tracking/",
      "production-tracking/by-order/${id}/",
      "production-stages/",
      "production-tracking/${id}/update/"
    ];
    
    for (const endpoint of possibleEndpoints) {
      try {
        const url = `https://rumahakrilik.id/api/${endpoint.replace('${id}', id)}`;
        console.log(`[Debug] Testing endpoint: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[Debug] ${url} -> Status: ${response.status}`);
        if (response.ok) {
          console.log(`[Debug] Endpoint ${url} works!`);
        }
      } catch (e) {
        console.log(`[Debug] ${endpoint} failed:`, e);
      }
    }
  };

  // Fungsi helper untuk data mock jika diperlukan
  const getMockData = () => {
    return {
      id: id,
      order_number: `ORD-${id}`,
      order_date: new Date().toISOString(),
      calculated_total: 2500000,
      status: { name: "Produksi", id: 7 },
      customer: { name: "Customer Demo", phone: "08123456789", email: "customer@example.com" },
      items: [
        { nama_produk: "Plakat Akrilik A4", quantity: 2, unit_price: 750000 },
        { nama_produk: "Standing Display", quantity: 1, unit_price: 1000000 }
      ],
      production: {
        start_date: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: "Operator 1",
        notes: "Pesanan urgent, prioritaskan",
        steps: {
          desain: true,
          operator_mesin: true,
          finishing: false,
          quality_control: false,
          packing: false,
          siap_kirim_pasang: false
        }
      }
    };
  };

  // Perbaikan pada fungsi updateOrderStatus
  const updateOrderStatus = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error("Authentication required");
      
      // 1. Cek status order saat ini
      const orderResponse = await axios.get(`https://rumahakrilik.id/api/orders/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // 2. Jika status masih 'Baru' (id=1) atau status belum diset, update ke 'Produksi'
      if (!orderResponse.data.status || orderResponse.data.status.id === 1) {
        console.log("Updating order status from 'Baru' to 'Produksi'");
        
        await axios({
          method: 'patch',
          url: `https://rumahakrilik.id/api/orders/${id}/`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { 
            status: 7 // ID status untuk Produksi
          }
        });
        
        console.log("Order status successfully updated to Produksi");
        
        // 3. Cek apakah sudah ada tracking records
        const trackingRecords = orderResponse.data.production_trackings || [];
        
        // 4. Jika belum ada tracking records, buat inisial tracking
        if (trackingRecords.length === 0) {
          console.log("Creating initial tracking records for stages 1-6");
          
          // Kita buat tracking untuk semua 6 stage dengan status pending
          const createPromises = [];
          for (let stageId = 1; stageId <= 6; stageId++) {
            createPromises.push(
              axios({
                method: 'post',
                url: `https://rumahakrilik.id/api/production-tracking/`,
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                data: {
                  order: parseInt(id),
                  stage: stageId,
                  status: "pending",
                  notes: notes || ""
                }
              }).catch(err => {
                console.error(`Error creating tracking for stage ${stageId}:`, err);
                return null;
              })
            );
          }
          
          await Promise.all(createPromises);
          console.log("Created initial tracking records");
        }
        
        // 5. Refresh data untuk menampilkan status terbaru
        await fetchOrderDetails();
        
        toast.success("Status order berhasil diubah menjadi Produksi");
        // Tambahkan timeout untuk memastikan toast muncul sebelum reload
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log(`Order already has status: ${orderResponse.data.status.name}`);
        toast.info(`Order sudah berstatus: ${orderResponse.data.status.name}`);
      }
      
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error(`Gagal mengupdate status: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const completeOrder = async (id) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }
      
      console.log(`Attempting to complete order ${id}`);
      
      const response = await axios.post(
        `/api/orders/${id}/update-status/`,
        {}, // Empty body if you don't need to send data
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Response:", response.data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Reload data
        fetchOrderDetails();
      }
    } catch (error) {
      console.error("Error completing order:", error.response || error);
      toast.error("Gagal menyelesaikan order: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Memuat data...</p>
        </div>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/produksi')}>
            Kembali ke Daftar Produksi
          </Button>
        </Alert>
      </Container>
    );
  }
  
  if (!orderData) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <p>Order tidak ditemukan</p>
          <Button variant="outline-primary" onClick={() => navigate('/produksi')}>
            Kembali ke Daftar Produksi
          </Button>
        </Alert>
      </Container>
    );
  }
  
  const progress = calculateProgress(orderData.production_trackings);
  const isAllStagesCompleted = Object.values(stages).every(stage => stage);

  return (
    <Container className="mt-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate('/produksi/daftar-order')}
      >
        ← Kembali ke Daftar Produksi
      </Button>
      
      <Card className="mb-4">
        <Card.Header as="h5">
          Detail Produksi: Order #{orderData.order_number}
        </Card.Header>
        
        <Card.Body>
          <Row className="mb-4">
            <Col sm={6}>
              <h6 className="mb-3">Informasi Order</h6>
              <p><strong>Customer:</strong> {orderData.customer?.name || 'N/A'}</p>
              <p><strong>Order Date:</strong> {orderData.order_date}</p>
              <p><strong>Status:</strong> {orderData.status?.name || 'N/A'}</p>
              <p><strong>Notes:</strong> {orderData.notes || '-'}</p>
              <p><strong>Total:</strong> Rp {parseFloat(orderData.total).toLocaleString('id-ID')}</p>
            </Col>
            
            <Col sm={6}>
              <h6 className="mb-3">Progress Produksi</h6>
              <ProgressBar now={progress} label={`${progress}%`} className="mb-3" />
              
              <p><strong>Start Date:</strong> {orderData.order_date}</p>
              <p><strong>Estimated Completion:</strong> {orderData.due_date || 'Belum ditentukan'}</p>
              <p><strong>Responsible Person:</strong> {orderData.sales_person?.username || 'Belum ditugaskan'}</p>
            </Col>
          </Row>
          
          <Form onSubmit={handleSubmit}>
            <h6 className="mb-3">Tracking Produksi</h6>

            <div className="mb-4">
              <Form.Check
                type="checkbox"
                id="stage-desain"
                label="Desain"
                checked={stages.desain}
                onChange={e => handleStageChange('desain', e.target.checked)}
                className={stages.desain ? "text-success" : ""}
              />
              <div className="mt-2 mb-3 ps-4">
                {stages.desain && (
                  <>
                    <Form.Group>
                      <Form.Label>Upload Bukti Desain</Form.Label>
                      <Form.Control 
                        type="file" 
                        accept="image/*"
                        onChange={e => handlePhotoUpload('desain', e.target.files)}
                      />
                    </Form.Group>
                    {stagePhotos.desain && (
                      <div className="mt-2">
                        <img 
                          src={URL.createObjectURL(stagePhotos.desain)} 
                          alt="Bukti Desain" 
                          style={{maxWidth: '100%', maxHeight: '200px'}}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <Form.Check
                type="checkbox"
                id="stage-operator"
                label="Operator Mesin"
                checked={stages.operator_mesin}
                onChange={e => handleStageChange('operator_mesin', e.target.checked)}
                className={stages.operator_mesin ? "text-success" : ""}
              />
              
              <Form.Check
                type="checkbox"
                id="stage-finishing"
                label="Finishing"
                checked={stages.finishing}
                onChange={e => handleStageChange('finishing', e.target.checked)}
                className={stages.finishing ? "text-success" : ""}
              />
              
              <Form.Check
                type="checkbox"
                id="stage-qc"
                label="Quality Control"
                checked={stages.quality_control}
                onChange={e => handleStageChange('quality_control', e.target.checked)}
                className={stages.quality_control ? "text-success" : ""}
              />

              <Form.Check
                type="checkbox"
                id="stage-packing"
                label="Packing"
                checked={stages.packing}
                onChange={e => handleStageChange('packing', e.target.checked)}
                className={stages.packing ? "text-success" : ""}
              />
              
              <Form.Check
                type="checkbox"
                id="stage-shipping"
                label="Siap Kirim/Pasang"
                checked={stages.siap_kirim_pasang}
                onChange={e => handleStageChange('siap_kirim_pasang', e.target.checked)}
                className={stages.siap_kirim_pasang ? "text-success" : ""}
              />
            </div>
            
            <h6 className="mt-4 mb-3">Estimasi Penyelesaian per Tahap</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Desain</Form.Label>
                  <Form.Control 
                    type="date" 
                    value={estimatedDates.desain}
                    onChange={e => setEstimatedDates({...estimatedDates, desain: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Operator Mesin</Form.Label>
                  <Form.Control 
                    type="date"
                    value={estimatedDates.operator_mesin}
                    onChange={e => setEstimatedDates({...estimatedDates, operator_mesin: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Finishing</Form.Label>
                  <Form.Control 
                    type="date"
                    value={estimatedDates.finishing}
                    onChange={e => setEstimatedDates({...estimatedDates, finishing: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quality Control</Form.Label>
                  <Form.Control 
                    type="date"
                    value={estimatedDates.quality_control}
                    onChange={e => setEstimatedDates({...estimatedDates, quality_control: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Packing</Form.Label>
                  <Form.Control 
                    type="date"
                    value={estimatedDates.packing}
                    onChange={e => setEstimatedDates({...estimatedDates, packing: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Siap Kirim/Pasang</Form.Label>
                  <Form.Control 
                    type="date"
                    value={estimatedDates.siap_kirim_pasang}
                    onChange={e => setEstimatedDates({...estimatedDates, siap_kirim_pasang: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-4 mb-3">Penanggung Jawab per Tahap</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Desain</Form.Label>
                  <Form.Select
                    value={stageResponsibles.desain}
                    onChange={e => setStageResponsibles({...stageResponsibles, desain: e.target.value})}
                  >
                    <option value="">-- Pilih Staff Desain --</option>
                    {staffByRole.designer.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username} {staff.job_title ? `(${staff.job_title})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Operator Mesin</Form.Label>
                  <Form.Select
                    value={stageResponsibles.operator_mesin}
                    onChange={e => setStageResponsibles({...stageResponsibles, operator_mesin: e.target.value})}
                  >
                    <option value="">-- Pilih Operator Mesin --</option>
                    {staffByRole.operator.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username} {staff.job_title ? `(${staff.job_title})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Finishing</Form.Label>
                  <Form.Select
                    value={stageResponsibles.finishing}
                    onChange={e => setStageResponsibles({...stageResponsibles, finishing: e.target.value})}
                  >
                    <option value="">-- Pilih Staff Finishing --</option>
                    {staffByRole.finishing.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username} {staff.job_title ? `(${staff.job_title})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quality Control</Form.Label>
                  <Form.Select
                    value={stageResponsibles.quality_control}
                    onChange={e => setStageResponsibles({...stageResponsibles, quality_control: e.target.value})}
                  >
                    <option value="">-- Pilih Staff QC --</option>
                    {staffByRole.quality_control.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username} {staff.job_title ? `(${staff.job_title})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Packing</Form.Label>
                  <Form.Select
                    value={stageResponsibles.packing}
                    onChange={e => setStageResponsibles({...stageResponsibles, packing: e.target.value})}
                  >
                    <option value="">-- Pilih Staff Packing --</option>
                    {staffByRole.packing.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username} {staff.job_title ? `(${staff.job_title})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Siap Kirim/Pasang</Form.Label>
                  <Form.Select
                    value={stageResponsibles.siap_kirim_pasang}
                    onChange={e => setStageResponsibles({...stageResponsibles, siap_kirim_pasang: e.target.value})}
                  >
                    <option value="">-- Pilih Staff Pengiriman --</option>
                    {staffByRole.shipping.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name || staff.username} {staff.job_title ? `(${staff.job_title})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Catatan Produksi</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Tambahkan catatan produksi di sini..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                id="notify-customer"
                label="Kirim notifikasi ke customer tentang perubahan status"
                checked={notifyCustomer}
                onChange={e => setNotifyCustomer(e.target.checked)}
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              id="notify-customer"
              label="Kirim notifikasi ke customer"
              checked={notifyCustomer}
              onChange={e => setNotifyCustomer(e.target.checked)}
              className="mb-3"
            />
            
            {error && (
              <Alert variant="danger" className="mt-3 mb-3">
                <strong>Error:</strong> {error}
                <div className="mt-2">
                  <small className="text-muted">Silahkan coba refresh halaman ini dan coba lagi.</small>
                </div>
              </Alert>
            )}
            
            <div className="d-flex justify-content-between">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/produksi/daftar-order')}
              >
                Batal
              </Button>

              <div>
                {/* Pisahkan tombol update status dari tombol submit form */}
                <Button 
                  variant="warning"
                  className="me-2"
                  onClick={updateOrderStatus}
                  disabled={submitting}
                >
                  {orderData.status?.id === 7 ? 'Segarkan Status Produksi' : 'Update Status ke Produksi'}
                </Button>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </div>
            </div>
          </Form>

          <hr className="my-4" />

          <div className="mb-3">
            <Button 
              variant="outline-secondary"
              onClick={() => setShowHistory(!showHistory)}
              className="mb-3"
            >
              {showHistory ? 'Sembunyikan Histori' : 'Tampilkan Histori Perubahan'}
            </Button>
            
            {showHistory && (
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Tahap</th>
                    <th>Status</th>
                    <th>Oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-3">Belum ada data histori</td>
                    </tr>
                  ) : (
                    trackingHistory.map((item, idx) => (
                      <tr key={idx}>
                        <td>{new Date(item.created_at).toLocaleString('id-ID')}</td>
                        <td>{item.stage_name}</td>
                        <td>
                          <Badge bg={item.status === 'completed' ? 'success' : 'warning'}>
                            {item.status === 'completed' ? 'Selesai' : 'Pending'}
                          </Badge>
                        </td>
                        <td>{item.updated_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </div>
          <Button 
            variant="success" 
            className="mt-3"
            onClick={() => completeOrder(id)}
            disabled={submitting}
          >
            Selesaikan Order
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductionOrderDetail;
