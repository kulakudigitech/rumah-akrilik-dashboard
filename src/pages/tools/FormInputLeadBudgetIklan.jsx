import React, { useState, useEffect } from "react";
import axios from "axios";

const FormInputLeadBudgetIklan = () => {
  const [form, setForm] = useState({ tanggal: "", nama_produk: "", sumber_iklan: "", jumlah_lead: 0, jumlah_budget: 0 });
  const [produk, setProduk] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/produk/")
      .then(res => setProduk(res.data))
      .catch(err => console.error("Gagal ambil data produk:", err));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://45.77.252.39:8001/api/marketing/online/lead-budget/", form)
      .then(() => alert("Data lead dan budget iklan berhasil disimpan!"))
      .catch(err => console.error("Gagal simpan data:", err));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎯 Form Input Lead & Budget Iklan Harian</h2>
      <form onSubmit={handleSubmit}>
        <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} required />

        <select name="nama_produk" value={form.nama_produk} onChange={handleChange} required>
          <option value="">-- Pilih Produk Iklan --</option>
          {produk.map((item) => (
            <option key={item.id} value={item.nama_produk}>{item.nama_produk}</option>
          ))}
        </select>

        <select name="sumber_iklan" value={form.sumber_iklan} onChange={handleChange} required>
          <option value="">-- Pilih Sumber Iklan --</option>
          <option value="Facebook Ads">Facebook Ads</option>
          <option value="Instagram Ads">Instagram Ads</option>
          <option value="Google Ads">Google Ads</option>
          <option value="Lainnya">Lainnya</option>
        </select>

        <input type="number" name="jumlah_lead" placeholder="Jumlah Lead" onChange={handleChange} required />
        <input type="number" name="jumlah_budget" placeholder="Jumlah Budget (Harian)" onChange={handleChange} required />

        <button type="submit">💾 Simpan Lead & Budget Harian</button>
      </form>
    </div>
  );
};

export default FormInputLeadBudgetIklan;

