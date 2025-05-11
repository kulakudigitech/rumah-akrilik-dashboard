import React, { useState, useEffect } from "react";
import axios from "axios";

const FormPlanKunjungan = () => {
  const [form, setForm] = useState({ marketing: "", tanggal: "", tujuan_kunjungan: "", kecamatan: "", kelurahan: "", kontak: "", catatan: "" });
  const [kecamatan, setKecamatan] = useState([]);
  const [kelurahan, setKelurahan] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/wilayah/kecamatan/")
      .then(res => setKecamatan(res.data))
      .catch(err => console.error("Gagal ambil data kecamatan:", err));
  }, []);

  const handleKecamatanChange = (e) => {
    setForm({ ...form, kecamatan: e.target.value, kelurahan: "" });
    axios.get(`http://45.77.252.39:8001/api/wilayah/kelurahan/${e.target.value}`)
      .then(res => setKelurahan(res.data))
      .catch(err => console.error("Gagal ambil data kelurahan:", err));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://45.77.252.39:8001/api/marketing/offline/kunjungan/", form)
      .then(() => alert("Rencana kunjungan berhasil disimpan!"))
      .catch(err => console.error("Gagal simpan rencana kunjungan:", err));
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 20 }}>
      <h2>📅 Form Plan Kunjungan Marketing Offline</h2>

      <input type="text" name="marketing" placeholder="Nama Marketing" onChange={handleChange} required />
      <input type="date" name="tanggal" onChange={handleChange} required />
      <input type="text" name="tujuan_kunjungan" placeholder="Tujuan Kunjungan (Toko, Instansi, Notaris, dll.)" onChange={handleChange} required />

      <select name="kecamatan" value={form.kecamatan} onChange={handleKecamatanChange} required>
        <option value="">-- Pilih Kecamatan --</option>
        {kecamatan.map(kec => (
          <option key={kec.id} value={kec.id}>{kec.nama}</option>
        ))}
      </select>

      <select name="kelurahan" value={form.kelurahan} onChange={handleChange} required>
        <option value="">-- Pilih Kelurahan/Desa --</option>
        {kelurahan.map(kel => (
          <option key={kel.id} value={kel.id}>{kel.nama}</option>
        ))}
      </select>

      <input type="text" name="kontak" placeholder="Kontak Calon Customer" onChange={handleChange} required />
      <textarea name="catatan" placeholder="Catatan Tambahan (opsional)" onChange={handleChange} />

      <button type="submit">💾 Simpan Rencana Kunjungan</button>
    </form>
  );
};

export default FormPlanKunjungan;

