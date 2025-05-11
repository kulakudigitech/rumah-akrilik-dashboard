// Jalankan file ini dengan Node.js untuk mendiagnosa masalah login
const fetch = require('node-fetch');

// Konfigurasi
const apiUrl = 'https://rumahakrilik.id/api/auth/login/';
const credentials = {
  username: 'admin', // Ganti dengan username yang valid
  password: 'password' // Ganti dengan password yang valid
};

// Fungsi untuk memeriksa endpoint login
async function checkLoginEndpoint() {
  try {
    console.log('Mencoba login ke:', apiUrl);
    console.log('Credentials:', { username: credentials.username, password: '********' });
    
    // Coba dengan POST langsung
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('Status code:', response.status);
    console.log('Status text:', response.statusText);
    console.log('Headers:', response.headers.raw());
    
    // Coba ambil response sebagai text dulu
    const responseText = await response.text();
    console.log('Response body (raw):', responseText.substring(0, 500) + '...');
    
    // Jika responsenya JSON valid, parse dan tampilkan
    try {
      const data = JSON.parse(responseText);
      console.log('Response parsed as JSON:', data);
    } catch (e) {
      console.log('Response is not valid JSON');
      
      // Cek apakah ini HTML (kemungkinan halaman error Django)
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
        console.log('Response appears to be HTML instead of JSON (possibly Django error page)');
      }
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Jalankan diagnosa
checkLoginEndpoint();