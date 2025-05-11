import React, { useState } from "react";
import axios from "axios";

const FormPembelianBahanBaku = () => {
  const [data, setData] = useState({
    vendor: "",
    nomor_transaksi: "",
    tanggal_transaksi: "",
    tanggal_jatuh_tempo: "",
    termin: "",
    gudang: "",
    referensi: "",
    produk: [{ nama_produk: "", deskripsi: "", kuantitas: 0, harga: 0, diskon: 0, pajak: 0 }],
  });

  const handleChange = (e, index, field) => {
    if (index !== undefined) {
      const produkBaru = [...data.produk];
      produkBaru[index][field] = e.target.value;
      setData({ ...data, produk: produkBaru });
    } else {
      setData({ ...data, [e.target.name]: e.target.value });
    }
  };

  const tambahProduk = () => {
    setData({ ...data, produk: [...data.produk, { nama_produk: "", deskripsi: "", kuantitas: 0, harga: 0, diskon: 0, pajak: 0 }] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://45.77.252.39:8001/api/pembelian-bahan-baku/", data)
      .then(() => alert("Pembelian bahan baku berhasil disimpan!"))
      .catch(err => console.error("Gagal simpan pembelian:", err));
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 40 }}>
      <h2>📦 Form Pembelian Bahan Baku</h2>

      <label>Vendor:</label>
      <input type="text" name="vendor" value={data.vendor} onChange={handleChange} required />

      <label>Nomor Transaksi:</label>
      <input type="text" name="nomor_transaksi" value={data.nomor_transaksi} onChange={handleChange} required />

      <label>Tanggal Transaksi:</label>
      <input type="date" name="tanggal_transaksi" value={data.tanggal_transaksi} onChange={handleChange} required />

      <label>Tanggal Jatuh Tempo:</label>
      <input type="date" name="tanggal_jatuh_tempo" value={data.tanggal_jatuh_tempo} onChange={handleChange} required />

      <label>Termin:</label>
      <input type="text" name="termin" value={data.termin} onChange={handleChange} required />

      <label>Gudang:</label>
      <input type="text" name="gudang" value={data.gudang} onChange={handleChange} required />

      <label>Referensi:</label>
      <input type="text" name="referensi" value={data.referensi} onChange={handleChange} />

      <h3>Rincian Produk Dibeli</h3>
      {data.produk.map((p, i) => (
        <div key={i}>
          <input placeholder="Nama Produk" value={p.nama_produk} onChange={(e) => handleChange(e, i, "nama_produk")} required />
          <input placeholder="Deskripsi" value={p.deskripsi} onChange={(e) => handleChange(e, i, "deskripsi")} />
          <input type="number" placeholder="Kuantitas" value={p.kuantitas} onChange={(e) => handleChange(e, i, "kuantitas")} required />
          <input type="number" placeholder="Harga" value={p.harga} onChange={(e) => handleChange(e, i, "harga")} required />
          <input type="number" placeholder="Diskon (%)" value={p.diskon} onChange={(e) => handleChange(e, i, "diskon")} />
          <input type="number" placeholder="Pajak (%)" value={p.pajak} onChange={(e) => handleChange(e, i, "pajak")} />
        </div>
      ))}

      <button type="button" onClick={tambahProduk}>➕ Tambah Produk</button>
      <button type="submit" style={{ marginTop: 20 }}>💾 Simpan Pembelian</button>
    </form>
  );
};

export default FormPembelianBahanBaku;

