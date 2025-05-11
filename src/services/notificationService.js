import axios from 'axios';

/**
 * Layanan untuk mengirim notifikasi ke customer
 */
export const sendProductionStatusNotification = async (order, stageCompleted) => {
  try {
    const token = localStorage.getItem('jwtToken');
    
    // Mapping nama stage untuk pesan yang lebih user-friendly
    const stageNames = {
      desain: "Desain",
      operator_mesin: "Produksi Mesin",
      finishing: "Finishing",
      quality_control: "Quality Control", 
      packing: "Pengemasan",
      siap_kirim_pasang: "Siap Kirim"
    };
    
    // Format pesan WhatsApp
    const stageName = stageNames[stageCompleted] || stageCompleted;
    const message = `Halo ${order.customer?.name || "Bapak/Ibu"},\n\n`
      + `Kami ingin menginformasikan bahwa pesanan Anda dengan nomor *${order.order_number}* `
      + `telah memasuki/menyelesaikan tahap *${stageName}*.\n\n`
      + `Progress produksi saat ini sudah mencapai ${order.progress || "50"}%.\n\n`
      + `Terima kasih atas kepercayaan Anda pada Rumah Akrilik.\n\n`
      + `Salam,\nTim Rumah Akrilik`;
    
    // Kirim notifikasi via API
    const response = await axios.post('https://rumahakrilik.id/api/notifications/whatsapp/', {
      order_id: order.id,
      customer_phone: order.customer?.phone,
      message: message,
      notification_type: 'production_update'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};