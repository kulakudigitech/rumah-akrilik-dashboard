#!/bin/bash
# filepath: /root/rumah-akrilik/rumah-akrilik-dashboard/src/create-missing-components.sh

# Daftar komponen dari SimpleApp.js
declare -a components=(
  "pages/customer/CustomerList"
  "pages/dashboard/Dashboard"
  "pages/order/OrderList"
  "pages/order/OrderDetail"
  "pages/produksi/ProductionOrderList"
  "pages/produksi/ProductionOrderDetail"
  "pages/FormInputOrder"
  "pages/keuangan/DaftarPembayaranOrder"
  "pages/dashboard/DashboardAdminKeuangan"
  "pages/tools/InventarisGudang"
  "pages/laporan/LaporanOrderHarian"
  "pages/laporan/LaporanOrderBulanan"
)

# Buat placeholder untuk setiap komponen yang tidak ada
for component in "${components[@]}"
do
  # Pastikan folder ada
  dir=$(dirname "src/$component")
  mkdir -p "$dir"
  
  # Nama file komponen
  filename="src/$component.jsx"
  
  # Cek apakah file sudah ada
  if [ ! -f "$filename" ]; then
    # Ambil nama komponen dari path
    component_name=$(basename "$component")
    
    # Buat file placeholder
    echo "import React from 'react';
import { Container, Card } from 'react-bootstrap';

const $component_name = () => {
  return (
    <Container className=\"py-4\">
      <Card className=\"shadow-sm\">
        <Card.Body className=\"text-center py-5\">
          <h2>$component_name</h2>
          <p>Halaman ini sedang dalam pengembangan.</p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default $component_name;" > "$filename"
    
    echo "Created placeholder component: $filename"
  else
    echo "Component already exists: $filename"
  fi
done

echo "All missing components have been created!"
