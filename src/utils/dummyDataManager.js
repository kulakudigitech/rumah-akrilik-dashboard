/**
 * Utility untuk mengelola data dummy saat API tidak tersedia
 */
export default class DummyDataManager {
  static DUMMY_FLAG_KEY = 'using_dummy_data';
  static DUMMY_DATA_KEY = 'dummy_data_store';
  
  /**
   * Memeriksa apakah saat ini menggunakan data dummy
   */
  static isUsingDummyData() {
    return localStorage.getItem(this.DUMMY_FLAG_KEY) === 'true';
  }
  
  /**
   * Menandai bahwa saat ini menggunakan data dummy
   */
  static setUsingDummyData(value = true) {
    localStorage.setItem(this.DUMMY_FLAG_KEY, value.toString());
    
    // Tampilkan notifikasi jika dalam mode development
    if (process.env.NODE_ENV !== 'production' && value) {
      console.warn('⚠️ PERHATIAN: Aplikasi menggunakan data dummy karena API tidak tersedia');
    }
  }
  
  /**
   * Menyimpan data dummy ke storage untuk konsistensi
   */
  static saveDummyData(key, data) {
    try {
      const dummyStore = this.getDummyStore();
      dummyStore[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(this.DUMMY_DATA_KEY, JSON.stringify(dummyStore));
    } catch (error) {
      console.error('Error saving dummy data:', error);
    }
  }
  
  /**
   * Mengambil data dummy yang tersimpan
   */
  static getDummyData(key) {
    try {
      const dummyStore = this.getDummyStore();
      return dummyStore[key]?.data || null;
    } catch (error) {
      console.error('Error getting dummy data:', error);
      return null;
    }
  }
  
  /**
   * Mendapatkan seluruh dummy store
   */
  static getDummyStore() {
    try {
      const store = localStorage.getItem(this.DUMMY_DATA_KEY);
      return store ? JSON.parse(store) : {};
    } catch (error) {
      console.error('Error reading dummy store:', error);
      return {};
    }
  }
  
  /**
   * Menghasilkan data order dummy konsisten dengan ID
   */
  static generateDummyOrder(orderId) {
    // Cek apakah sudah ada data dummy untuk order ini
    const existingOrder = this.getDummyData(`order_${orderId}`);
    if (existingOrder) return existingOrder;
    
    // Generate random tanggal dalam rentang +/- 14 hari dari sekarang
    const randomDays = Math.floor(Math.random() * 28) - 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + randomDays);
    
    // Pilih customer secara random
    const customerNames = [
      'Budi Santoso', 'Dewi Lestari', 'Ahmad Fauzi', 
      'Siti Aminah', 'Rizki Pratama', 'Anita Wijaya',
      'Eko Prasetyo', 'Maya Indah', 'Dian Permata', 'Hadi Sucipto'
    ];
    
    // Pilih product secara random
    const products = [
      'Plakat Akrilik', 'Neonbox', 'Signage', 'Stand Display', 
      'Trophy Akrilik', 'Name Tag', 'Papan Nama', 'Kotak Saran'
    ];
    
    // Generate order dummy
    const dummyOrder = {
      id: orderId,
      order_number: `RA${String(orderId).padStart(4, '0')}`,
      customer: {
        name: customerNames[Math.floor(Math.random() * customerNames.length)]
      },
      items: [
        {
          nama_produk: products[Math.floor(Math.random() * products.length)],
          specifications: {
            ukuran: ['25x15', '30x20', '40x30', '50x40'][Math.floor(Math.random() * 4)],
            bahan: ['Akrilik 3mm', 'Akrilik 5mm', 'Akrilik Susu', 'Akrilik Bening'][Math.floor(Math.random() * 4)]
          },
          notes: Math.random() > 0.5 ? 'Warna custom sesuai logo' : ''
        }
      ],
      due_date: dueDate.toISOString().split('T')[0],
      status: { name: 'Produksi' },
      production_trackings: this.generateDummyTrackings(orderId),
      notes: 'Data dummy - API tidak menemukan order'
    };
    
    // Simpan agar konsisten
    this.saveDummyData(`order_${orderId}`, dummyOrder);
    
    return dummyOrder;
  }
  
  /**
   * Generate dummy tracking data untuk suatu order
   */
  static generateDummyTrackings(orderId) {
    const stages = [
      { id: 1, name: 'Desain' },
      { id: 2, name: 'Operator Mesin' },
      { id: 3, name: 'Finishing' },
      { id: 4, name: 'Quality Control' },
      { id: 5, name: 'Packing' },
      { id: 6, name: 'Siap Kirim/Pasang' }
    ];
    
    // Jika order ID dibagi 10 = 0 (kelipatan 10), semua tahapan selesai
    const allCompleted = orderId % 10 === 0;
    
    // Jika order ID dibagi 5 = 0 (kelipatan 5), order progess 50%
    const halfCompleted = !allCompleted && orderId % 5 === 0;
    
    // Jika order ID ganjil, progress random
    const randomProgress = !allCompleted && !halfCompleted && orderId % 2 === 1;
    
    return stages.map((stage, index) => {
      // Tentukan status berdasarkan pola
      let status, progress;
      if (allCompleted) {
        status = 'completed';
        progress = 100;
      } else if (halfCompleted && index < 3) {
        status = 'completed';
        progress = 100;
      } else if (halfCompleted && index === 3) {
        status = 'in_progress';
        progress = 50;
      } else if (randomProgress) {
        if (index === 0) {
          status = 'completed';
          progress = 100;
        } else if (index === 1) {
          status = Math.random() > 0.5 ? 'completed' : 'in_progress';
          progress = status === 'completed' ? 100 : 50;
        } else {
          status = 'pending';
          progress = 0;
        }
      } else {
        if (index === 0) {
          status = 'in_progress';
          progress = 50;
        } else {
          status = 'pending';
          progress = 0;
        }
      }
      
      return {
        id: `${orderId}${stage.id}`,
        order_id: orderId,
        stage_id: stage.id,
        stage_name: stage.name,
        status,
        progress,
        start_time: status !== 'pending' ? new Date(Date.now() - 86400000).toISOString() : null,
        end_time: status === 'completed' ? new Date().toISOString() : null
      };
    });
  }
  
  /**
   * Reset data dummy dan kembali ke mode API
   */
  static resetDummyMode() {
    localStorage.removeItem(this.DUMMY_FLAG_KEY);
    localStorage.removeItem(this.DUMMY_DATA_KEY);
    console.log('Mode dummy data dimatikan, akan menggunakan API');
  }
}