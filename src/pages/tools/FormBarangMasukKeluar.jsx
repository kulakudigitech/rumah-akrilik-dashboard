import React, { useState } from "react";
import axios from "axios";

const FormBarangMasukKeluar = () => {
  const [data, setData] = useState({
    nama_barang: "",
    jumlah: "",
    tanggal: "",
    gudang: "",
    jenis_transaksi: "masuk",
  });

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://45.77.252.39:8001/api/gudang/", data)
      .then(() => alert("Data barang berhasil disimpan!"))
      .catch(err => console.error("Gagal simpan data barang:", err));
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 40 }}>
      <h2>📦 Form Barang Masuk & Keluar Gudang</h2>

      <label>Nama Barang:</label>
      <input type="text" name="nama_barang" value={data.nama_barang} onChange={handleChange} required />

      <label>Jumlah:</label>
      <input type="number" name="jumlah" value={data.jumlah} onChange={handleChange} required />

      <label>Tanggal Transaksi:</label>
      <input type="date" name="tanggal" value={data.tanggal} onChange={handleChange} required />

      <label>Gudang Tujuan:</label>
      <input type="text" name="gudang" value={data.gudang} onChange={handleChange} required />

      <label>Jenis Transaksi:</label>
      <select name="jenis_transaksi" value={data.jenis_transaksi} onChange={handleChange} required>
        <option value="masuk">Barang Masuk</option>
        <option value="keluar">Barang Keluar</option>
      </select>

      <button type="submit" style={{ marginTop: 20 }}>💾 Simpan Transaksi</button>
    </form>
  );
};

export default FormBarangMasukKeluar;

