/**
 * Utility untuk mengirim pesan WhatsApp menggunakan API BalesOtomatis.id
 */

const API_KEY = "inSCXfENuT731p19KJ";
const NUMBER_ID = "BO-hpM2ZPfLO605iRyX";

/**
 * Fungsi untuk mengirim pesan WhatsApp ke nomor tertentu
 * @param {string} phoneNumber - Nomor tujuan format internasional (62xxxx)
 * @param {string} message - Isi pesan
 * @returns {Promise} Promise hasil pengiriman
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Format nomor telepon
    let formattedNumber = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedNumber = '62' + phoneNumber.substring(1);
    }
    
    const response = await fetch('https://api.balesotomatis.id/public/v1/send_personal_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: API_KEY,
        number_id: NUMBER_ID,
        enable_typing: "1",
        method_send: "async",
        phone_no: formattedNumber,
        country_code: "62",
        message: message
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      console.log('WhatsApp message sent successfully');
      return { success: true, data };
    } else {
      console.error('Failed to send WhatsApp message:', data);
      return { success: false, error: data.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Fungsi untuk mengirim notifikasi status order
 * @param {Object} order - Data order
 * @param {string} status - Status baru
 * @returns {Promise} Promise hasil pengiriman
 */
export const sendOrderStatusUpdate = async (order, status) => {
  if (!order || !order.customer || !order.customer.phone) {
    return { success: false, error: 'No customer phone number available' };
  }
  
  // Template pesan berdasarkan status
  const templates = {
    'baru': `Terima kasih atas pesanan Anda di Rumah Akrilik. Order #${order.id} sudah kami terima dan sedang diproses.`,
    'proses': `Order Anda #${order.id} sedang dalam proses produksi di workshop kami. Kami akan memberitahu Anda saat order sudah selesai.`,
    'selesai': `Kabar baik! Order Anda #${order.id} telah selesai dibuat dan siap untuk dikirim/diambil. Silakan hubungi customer service kami untuk informasi lebih lanjut.`,
    'kirim': `Order Anda #${order.id} sedang dalam proses pengiriman. Terima kasih telah berbelanja di Rumah Akrilik.`,
    'terpasang': `Order Anda #${order.id} telah terpasang dengan baik. Terima kasih telah mempercayai Rumah Akrilik.`
  };
  
  // Tentukan template pesan berdasarkan status
  const statusLower = status.toLowerCase();
  let message = '';
  
  for (const key in templates) {
    if (statusLower.includes(key)) {
      message = templates[key];
      break;
    }
  }
  
  // Jika tidak ada template yang cocok, gunakan template default
  if (!message) {
    message = `Status order Anda #${order.id} telah diperbarui menjadi: ${status}. Untuk informasi lebih lanjut, silakan hubungi customer service kami.`;
  }
  
  return await sendWhatsAppMessage(order.customer.phone, message);
};