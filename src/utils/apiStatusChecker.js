/**
 * Utilitas untuk memeriksa status API dan memilih strategi yang tepat
 */
export default class ApiStatusChecker {
  static STATUS_KEY = 'api_status_cache';
  static TIMEOUT = 5000; // 5 detik timeout
  
  /**
   * Memeriksa apakah API berfungsi
   */
  static async isApiAvailable(forceCheck = false) {
    // Cek cache status API untuk menghindari pengecekan berlebihan
    if (!forceCheck) {
      const statusCache = this.getStatusCache();
      if (statusCache && (Date.now() - statusCache.timestamp < 60000)) { // Cache valid selama 1 menit
        return statusCache.available;
      }
    }
    
    // Coba panggil endpoint health-check
    try {
      const endpoints = [
        'https://rumahakrilik.id/api/health/',
        'https://rumahakrilik.id/api/status/'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { 
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            timeout: this.TIMEOUT
          });
          
          if (response.ok) {
            this.updateStatusCache(true);
            return true;
          }
        } catch (innerError) {
          console.warn(`API check failed for ${endpoint}:`, innerError.message);
        }
      }
      
      // Jika semua endpoint gagal, coba endpoint umum seperti orders
      const token = localStorage.getItem('jwtToken');
      if (token) {
        const response = await fetch('https://rumahakrilik.id/api/orders/?limit=1', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: this.TIMEOUT
        });
        
        if (response.ok) {
          this.updateStatusCache(true);
          return true;
        }
      }
      
      // Semua cara gagal
      this.updateStatusCache(false);
      return false;
    } catch (error) {
      console.error('Error checking API status:', error);
      this.updateStatusCache(false);
      return false;
    }
  }
  
  /**
   * Menyimpan status API ke localStorage
   */
  static updateStatusCache(available) {
    try {
      localStorage.setItem(this.STATUS_KEY, JSON.stringify({
        available,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving API status to cache:', error);
    }
  }
  
  /**
   * Mengambil status API dari cache
   */
  static getStatusCache() {
    try {
      const cache = localStorage.getItem(this.STATUS_KEY);
      return cache ? JSON.parse(cache) : null;
    } catch (error) {
      console.error('Error reading API status from cache:', error);
      return null;
    }
  }
  
  /**
   * Strategi untuk pengambilan data dengan fallback
   * @param {Function} apiCall - Fungsi async yang melakukan API call
   * @param {Function} fallbackFn - Fungsi yang mengembalikan data dummy
   * @param {Function} cacheKey - Key untuk menyimpan di localStorage
   */
  static async fetchWithFallback(apiCall, fallbackFn, cacheKey = null) {
    try {
      // Cek apakah API tersedia
      const apiAvailable = await this.isApiAvailable();
      
      // Jika API tidak tersedia, langsung gunakan fallback
      if (!apiAvailable) {
        console.log('API tidak tersedia, menggunakan fallback data');
        return fallbackFn();
      }
      
      // Coba panggil API
      const data = await apiCall();
      
      // Jika data berhasil didapat dan cache key tersedia, simpan ke localStorage
      if (data && cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));
        } catch (cacheError) {
          console.warn('Error caching API data:', cacheError);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchWithFallback:', error);
      
      // Jika ada cache key, coba ambil dari localStorage
      if (cacheKey) {
        try {
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            console.log(`Menggunakan data cache untuk ${cacheKey}`);
            return parsed.data;
          }
        } catch (cacheError) {
          console.warn('Error reading cached data:', cacheError);
        }
      }
      
      // Jika tidak ada cache atau cache error, gunakan fallback
      return fallbackFn();
    }
  }

  // Tambahkan method baru untuk menangani kasus spesifik "order not found"
  static async orderExists(orderId) {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return false;
      
      // Coba beberapa endpoint untuk memverifikasi keberadaan order
      const endpoints = [
        `https://rumahakrilik.id/api/orders/${orderId}/`,
        `https://rumahakrilik.id/api/order/${orderId}/`,
        `https://rumahakrilik.id/api/production-orders/${orderId}/`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: this.TIMEOUT
          });
          
          if (response.ok) {
            return true;
          }
        } catch (innerError) {
          console.warn(`Error checking order existence at ${endpoint}:`, innerError);
        }
      }
      
      // Semua endpoint gagal, asumsi order tidak ditemukan
      return false;
    } catch (error) {
      console.error('Error checking order existence:', error);
      return false;
    }
  }

  // Tambahkan method untuk mendapatkan data order dari local terlebih dahulu
  static async getOrder(orderId, defaultData = null) {
    // Periksa cache lokal terlebih dahulu
    try {
      // Impor dari utils/productionDatabase tanpa circular dependency
      const localData = localStorage.getItem('production_data');
      if (localData) {
        const db = JSON.parse(localData);
        if (db.orders && db.orders[orderId]) {
          console.log(`Menggunakan data order ${orderId} dari cache lokal`);
          return db.orders[orderId];
        }
      }
    } catch (error) {
      console.warn('Error getting order from local cache:', error);
    }
    
    // Jika tidak ada di cache, cek API
    try {
      const apiAvailable = await this.isApiAvailable();
      if (!apiAvailable) {
        console.log('API tidak tersedia, menggunakan data default');
        return defaultData;
      }
      
      const token = localStorage.getItem('jwtToken');
      if (!token) return defaultData;
      
      const endpoints = [
        `https://rumahakrilik.id/api/orders/${orderId}/`,
        `https://rumahakrilik.id/api/order/${orderId}/`,
        `https://rumahakrilik.id/api/production-orders/${orderId}/`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: this.TIMEOUT
          });
          
          if (response.ok) {
            const data = await response.json();
            // Cache hasil untuk penggunaan selanjutnya
            try {
              const localData = localStorage.getItem('production_data') || '{"orders":{}}';
              const db = JSON.parse(localData);
              if (!db.orders) db.orders = {};
              db.orders[orderId] = data;
              db.orders[orderId].updatedAt = Date.now();
              localStorage.setItem('production_data', JSON.stringify(db));
            } catch (cacheError) {
              console.warn('Error caching order data:', cacheError);
            }
            return data;
          }
        } catch (innerError) {
          console.warn(`Error fetching order from ${endpoint}:`, innerError);
        }
      }
      
      // Jika semua endpoint gagal, gunakan data default
      console.log(`Order ${orderId} tidak ditemukan di API, menggunakan data default`);
      return defaultData;
    } catch (error) {
      console.error('Error getting order data:', error);
      return defaultData;
    }
  }
}