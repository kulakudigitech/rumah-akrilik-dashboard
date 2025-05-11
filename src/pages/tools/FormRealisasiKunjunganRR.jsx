import React, { useState, useEffect } from "react";
import axios from "axios";

const FormRealisasiKunjunganRR = () => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [namaRR, setNamaRR] = useState("");
  const [tujuanKunjungan, setTujuanKunjungan] = useState("");
  const [status, setStatus] = useState("Berhasil");
  const [keterangan, setKeterangan] = useState("");
  const [produkList, setProdukList] = useState([]);
  const [selectedProduk, setSelectedProduk] = useState("");
  const [kategoriProduk, setKategoriProduk] = useState("");
  const [harga, setHarga] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [biayaPasang, setBiayaPasang] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/produk/")
      .then(res => setProdukList(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleProdukChange = (e) => {
    const selected = produkList.find(p => p.id === parseInt(e.target.value));
    setSelectedProduk(selected.id);
    setKategoriProduk(selected.kategori);
    if (selected.kategori === "non-custom") {
      setHarga(selected.harga);
    } else {
      setHarga("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      tanggal,
      namaRR,
      tujuanKunjungan,
      status,
      keterangan: status === "Gagal" ? keterangan : "-",
      produk: selectedProduk,
      kategoriProduk,
      harga: parseFloat(harga),
      ukuran,
      biayaPasang: parseFloat(biayaPasang),
      qty: parseInt(qty),
      areaSesuaiPlan: true, // nanti cek otomatis di backend
    };

    axios.post("http://45.77.252.39:8001/api/realisasi-kunjungan-rr/", data)
      .then(res => {
        alert("Realisasi berhasil disimpan!");
        window.location.reload();
      })
      .catch(err => {
        console.error(err);
        alert("Gagal menyimpan data!");
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>📝 Realisasi Kunjungan RR</h2>

      <label>Tanggal Realisasi:</label>
      <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} required />

      <label>Nama RR:</label>
      <input type="text" value={namaRR} onChange={e => setNamaRR(e.target.value)} required />

      <label>Tujuan Kunjungan:</label>
      <input type="text" value={tujuanKunjungan} onChange={e => setTujuanKunjungan(e.target.value)} required />

      <label>Status Kunjungan:</label>
      <select value={status} onChange={e => setStatus(e.target.value)}>
        <option value="Berhasil">Berhasil</option>
        <option value="Follow-up">Follow-up</option>
        <option value="Gagal">Gagal</option>
      </select>

      {status === "Gagal" && (
        <>
          <label>Keterangan (Alasan gagal):</label>
          <textarea value={keterangan} onChange={e => setKeterangan(e.target.value)} required />
        </>
      )}

      {status === "Berhasil" && (
        <>
          <label>Produk:</label>
          <select value={selectedProduk} onChange={handleProdukChange} required>
            <option value="">Pilih Produk</option>
            {produkList.map(p => (
              <option key={p.id} value={p.id}>{p.nama_produk}</option>
            ))}
          </select>

          {kategoriProduk === "custom" && (
            <>
              <label>Harga (Custom):</label>
              <input type="number" value={harga} onChange={e => setHarga(e.target.value)} required />

              <label>Ukuran:</label>
              <input type="text" value={ukuran} onChange={e => setUkuran(e.target.value)} required />

              <label>Biaya Pasang:</label>
              <input type="number" value={biayaPasang} onChange={e => setBiayaPasang(e.target.value)} />
            </>
          )}

          {kategoriProduk === "non-custom" && (
            <>
              <label>Harga (Non-custom):</label>
              <input type="number" value={harga} readOnly />

              <label>Biaya Pasang:</label>
              <input type="number" value={biayaPasang} onChange={e => setBiayaPasang(e.target.value)} />
            </>
          )}

          <label>Jumlah (QTY):</label>
          <input type="number" value={qty} onChange={e => setQty(e.target.value)} required />
        </>
      )}

      <button type="submit">Simpan Realisasi</button>
    </form>
  );
};

export default FormRealisasiKunjunganRR;

