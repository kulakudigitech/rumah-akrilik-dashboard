/**
 * Database lokal untuk menyimpan data produksi
 */
export default class ProductionDatabase {
  static DB_KEY = 'production_data';
  
  /**
   * Menyimpan data order produksi
   */
  static saveOrder(orderId, data) {
    const db = this.getDatabase();
    db.orders[orderId] = {
      ...data,
      updatedAt: Date.now()
    };
    this.saveDatabase(db);
  }
  
  /**
   * Mengambil data order produksi
   * Dengan opsi fallback ke data dummy jika tidak ditemukan
   */
  static getOrder(orderId, useDummyIfNotFound = true) {
    const db = this.getDatabase();
    
    // Coba cari di database lokal
    if (db.orders[orderId]) {
      return db.orders[orderId];
    }
    
    // Jika tidak ditemukan dan fallback diaktifkan, kembalikan data dummy
    if (useDummyIfNotFound) {
      // Generate dummy data
      const dummyOrder = this.generateMockOrder(orderId);
      
      // Save to database for consistency
      this.saveOrder(orderId, dummyOrder);
      
      return dummyOrder;
    }
    
    return null;
  }
  
  /**
   * Mendapatkan semua orders
   */
  static getAllOrders() {
    const db = this.getDatabase();
    return db.orders;
  }
  
  /**
   * Menyimpan progress tahapan produksi
   */
  static saveStageProgress(orderId, stageName, progress, username) {
    const db = this.getDatabase();
    
    // Inisialisasi jika belum ada
    if (!db.progress[orderId]) {
      db.progress[orderId] = {};
    }
    
    const normalizedStageName = stageName.toLowerCase().replace(/\s+/g, '_');
    
    db.progress[orderId][normalizedStageName] = {
      progress,
      updatedAt: Date.now(),
      updatedBy: username,
    };
    
    this.saveDatabase(db);
    return true;
  }
  
  /**
   * Mendapatkan progress tahapan produksi
   */
  static getStageProgress(orderId, stageName) {
    const db = this.getDatabase();
    const normalizedStageName = stageName.toLowerCase().replace(/\s+/g, '_');
    
    if (db.progress[orderId] && db.progress[orderId][normalizedStageName]) {
      return db.progress[orderId][normalizedStageName].progress;
    }
    
    return 0;
  }
  
  /**
   * Mendapatkan seluruh progress suatu order
   */
  static getOrderProgress(orderId) {
    const db = this.getDatabase();
    return db.progress[orderId] || {};
  }
  
  /**
   * Menyimpan daftar tugas saya
   */
  static saveMyTasks(username, tasks) {
    const db = this.getDatabase();
    db.myTasks[username] = {
      tasks,
      updatedAt: Date.now()
    };
    this.saveDatabase(db);
  }
  
  /**
   * Mendapatkan daftar tugas user
   */
  static getMyTasks(username) {
    const db = this.getDatabase();
    return db.myTasks[username]?.tasks || [];
  }
  
  /**
   * Mendapatkan semua database
   */
  static getDatabase() {
    try {
      const data = localStorage.getItem(this.DB_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading production database:', error);
    }
    
    // Default database structure
    return {
      orders: {},
      progress: {},
      myTasks: {},
      availableTasks: {},
      lastSync: null
    };
  }
  
  /**
   * Menyimpan database ke localStorage
   */
  static saveDatabase(db) {
    try {
      localStorage.setItem(this.DB_KEY, JSON.stringify(db));
    } catch (error) {
      console.error('Error saving production database:', error);
      
      // Jika error karena quota, coba bersihkan data lama
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldData();
        try {
          localStorage.setItem(this.DB_KEY, JSON.stringify(db));
        } catch (retryError) {
          console.error('Still failed to save database after cleanup:', retryError);
        }
      }
    }
  }
  
  /**
   * Membersihkan data lama untuk menghemat ruang
   */
  static cleanupOldData() {
    const db = this.getDatabase();
    const now = Date.now();
    const threeMonthsAgo = now - (90 * 24 * 60 * 60 * 1000);
    
    // Hapus order lama
    Object.keys(db.orders).forEach(orderId => {
      if (db.orders[orderId].updatedAt < threeMonthsAgo) {
        delete db.orders[orderId];
        delete db.progress[orderId];
      }
    });
    
    this.saveDatabase(db);
  }
  
  /**
   * Sync dengan server jika memungkinkan
   */
  static async syncWithServer() {
    // Logic untuk sync dengan server
    // Mengirim data lokal ke server
    // Dan mengambil data terbaru dari server
  }
  
  // Tambahkan method untuk menghasilkan mock/dummy data yang lebih baik
  static generateMockOrder(orderId) {
    const orderIdNum = parseInt(orderId) || Math.floor(Math.random() * 1000);
    
    // Format tanggal sebagai YYYYMMDD
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Buat order number dengan format yang proper
    const orderNum = String(orderIdNum).padStart(4, '0');
    const orderNumber = `INV-${dateStr}-${orderNum}`;
    
    // List produk dan customer untuk data dummy
    const products = [
      'Neonbox', 'Plakat Akrilik', 'Letter Timbul', 'Signage', 'Display Akrilik',
      'Papan Nama', 'Trophy Akrilik', 'Name Tag', 'Souvenir Akrilik'
    ];
    
    const customers = [
      'Sumbodo Malik', 'Andi Susanto', 'PT Maju Jaya', 'Toko Sentosa', 
      'Rumah Makan Padang', 'CV Bahagia', 'Salon Cantik', 'Klinik Sehat'
    ];
    
    // Pilih produk dan customer secara random untuk variasi
    const randomProduct = products[orderIdNum % products.length];
    const randomCustomer = customers[orderIdNum % customers.length];
    
    // Tambahkan 3-14 hari untuk due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3 + (orderIdNum % 12));
    
    // Buat dummy data dengan struktur yang lengkap
    return {
      id: orderIdNum,
      order_id: orderIdNum,
      order_number: orderNumber,
      customer: { 
        id: orderIdNum * 10,
        name: randomCustomer,
        phone: `08123456${orderIdNum.toString().padStart(4, '0')}`,
      },
      items: [{
        id: orderIdNum * 100,
        nama_produk: randomProduct,
        quantity: 1 + (orderIdNum % 5),
        specifications: {
          bahan: ['3mm', '5mm', '2mm', 'Premium', 'Standard'][orderIdNum % 5],
          ukuran: [`${20 + (orderIdNum % 30)}x${30 + (orderIdNum % 20)}`, '30x40cm', 'A3', 'A4', 'Custom'][orderIdNum % 5]
        },
        notes: ['1 sisi', '2 sisi', 'Full color', 'Glossy', 'Matte', ''][orderIdNum % 6]
      }],
      status: { name: 'Produksi' },
      order_date: new Date(Date.now() - (24 * 60 * 60 * 1000 * (orderIdNum % 30))).toISOString(),
      due_date: dueDate.toISOString(),
      total: 250000 + (orderIdNum * 10000),
      notes: 'Data dummy - API tidak menemukan order',
      production_trackings: [
        {
          id: `tracking-${orderIdNum}-1`,
          stage_name: 'Desain',
          status: 'completed',
          progress: 100,
          start_time: new Date(Date.now() - (24 * 60 * 60 * 1000 * 2)).toISOString(),
          end_time: new Date(Date.now() - (24 * 60 * 60 * 1000 * 1)).toISOString(),
        },
        {
          id: `tracking-${orderIdNum}-2`,
          stage_name: 'Operator Mesin',
          status: 'in_progress',
          progress: 50,
          start_time: new Date(Date.now() - (24 * 60 * 60 * 1000 * 1)).toISOString(),
          end_time: null,
        },
        {
          id: `tracking-${orderIdNum}-3`,
          stage_name: 'Finishing',
          status: 'pending',
          progress: 0,
          start_time: null,
          end_time: null,
        },
        {
          id: `tracking-${orderIdNum}-4`,
          stage_name: 'Quality Control',
          status: 'pending',
          progress: 0,
          start_time: null,
          end_time: null,
        },
        {
          id: `tracking-${orderIdNum}-5`,
          stage_name: 'Packing',
          status: 'pending',
          progress: 0,
          start_time: null,
          end_time: null,
        }
      ],
      updatedAt: Date.now(),
      isDummyData: true
    };
  }
}