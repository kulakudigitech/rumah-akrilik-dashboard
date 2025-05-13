/**
 * Generate dummy orders dengan data yang bermakna
 * @param {number} count - Jumlah order dummy yang ingin dibuat
 */
export const generateDummyOrders = (count = 10) => {
  const orders = [];
  
  for (let i = 0; i < count; i++) {
    const id = 100 + i;
    orders.push({
      id,
      order_number: `INV-20250501-${String(id).padStart(4, '0')}`,
      customer: { name: `Customer ${id}` },
      items: [{
        nama_produk: ['Neonbox', 'Plakat Akrilik', 'Letter Timbul'][i % 3],
        specifications: {
          bahan: ['3mm', '5mm', '2mm'][i % 3],
          ukuran: [`${20 + i}x${30 + i}`, 'A3', 'A4'][i % 3]
        },
        notes: ['1 sisi', '2 sisi', 'Full color'][i % 3]
      }],
      status: { name: 'Produksi' },
      order_date: new Date(Date.now() - (24 * 60 * 60 * 1000 * i)).toISOString(),
      due_date: new Date(Date.now() + (24 * 60 * 60 * 1000 * (7 - (i % 7)))).toISOString(),
      production_trackings: [
        {
          id: `tracking-${id}-1`,
          stage_name: 'Desain',
          status: 'completed',
          progress: 100
        },
        {
          id: `tracking-${id}-2`,
          stage_name: 'Operator Mesin',
          status: i < 3 ? 'completed' : 'in_progress',
          progress: i < 3 ? 100 : 50
        },
        {
          id: `tracking-${id}-3`,
          stage_name: 'Finishing',
          status: i < 2 ? 'completed' : 'pending',
          progress: i < 2 ? 100 : 0
        },
        {
          id: `tracking-${id}-4`,
          stage_name: 'Quality Control',
          status: i < 1 ? 'completed' : 'pending',
          progress: i < 1 ? 100 : 0
        },
        {
          id: `tracking-${id}-5`,
          stage_name: 'Packing',
          status: 'pending',
          progress: 0
        }
      ],
      notes: 'Data dummy - API tidak menemukan order',
      isDummy: true
    });
  }
  
  return orders;
};

/**
 * Generate dummy tasks untuk user tertentu
 * @param {string} username - Username pengguna
 * @param {number} count - Jumlah tasks yang ingin dibuat
 */
export const generateDummyTasks = (username, count = 5) => {
  const tasks = [];
  const stages = ['Desain', 'Operator Mesin', 'Finishing', 'Quality Control', 'Packing'];
  const products = ['Neonbox', 'Plakat Akrilik', 'Letter Timbul', 'Signage', 'Display Akrilik'];
  const customers = ['Sumbodo Malik', 'Andi Susanto', 'PT Maju Jaya', 'Toko Sentosa', 'Rumah Makan Padang'];
  
  for (let i = 0; i < count; i++) {
    const id = 200 + i;
    const orderId = 100 + i;
    const stageIndex = i % stages.length;
    
    tasks.push({
      id: `tracking-${id}`,
      order_id: orderId,
      order_number: `INV-20250501-${String(orderId).padStart(4, '0')}`,
      customer_name: customers[i % customers.length],
      product_name: products[i % products.length],
      stage_name: stages[stageIndex],
      deadline: new Date(Date.now() + (24 * 60 * 60 * 1000 * (7 - (i % 7)))).toISOString(),
      status: i < 2 ? 'completed' : i < 4 ? 'in_progress' : 'pending',
      progress: i < 2 ? 100 : i < 4 ? 50 : 0,
      claimed_date: new Date(Date.now() - (24 * 60 * 60 * 1000 * i)).toISOString(),
      completed_date: i < 2 ? new Date().toISOString() : null,
      specifications: {
        bahan: ['3mm', '5mm', '2mm'][i % 3],
        ukuran: [`${20 + i}x${30 + i}`, '30x40cm', 'A3'][i % 3]
      },
      notes: ['1 sisi', '2 sisi', 'Full color', 'Glossy', 'Matte'][i % 5],
      assignedTo: username,
      isDummy: true
    });
  }
  
  return tasks;
};

/**
 * Menghasilkan data dummy yang konsisten berdasarkan ID
 * @param {string|number} id - ID yang digunakan sebagai seed
 */
export const generateConsistentDummyData = (id) => {
  // Menggunakan ID sebagai seed untuk menghasilkan data yang konsisten
  const numericId = parseInt(id) || Math.floor(Math.random() * 1000);
  
  // List produk dan customer untuk data dummy yang konsisten
  const products = [
    'Neonbox', 'Plakat Akrilik', 'Letter Timbul', 'Signage', 'Display Akrilik',
    'Papan Nama', 'Trophy Akrilik', 'Name Tag', 'Souvenir Akrilik'
  ];
  
  const customers = [
    'Sumbodo Malik', 'Andi Susanto', 'PT Maju Jaya', 'Toko Sentosa', 
    'Rumah Makan Padang', 'CV Bahagia', 'Salon Cantik', 'Klinik Sehat'
  ];
  
  // Pilih produk dan customer berdasarkan ID (konsisten)
  const productName = products[numericId % products.length];
  const customerName = customers[numericId % customers.length];
  
  return {
    productName,
    customerName,
    specifications: {
      bahan: ['3mm', '5mm', '2mm', 'Premium', 'Standard'][numericId % 5],
      ukuran: [`${20 + (numericId % 30)}x${30 + (numericId % 20)}`, '30x40cm', 'A3', 'A4'][numericId % 4]
    },
    notes: ['1 sisi', '2 sisi', 'Full color', 'Glossy', 'Matte'][numericId % 5]
  };
};