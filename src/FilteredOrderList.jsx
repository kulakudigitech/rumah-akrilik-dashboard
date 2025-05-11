import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const FilteredOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

useEffect(() => {
  axios.get("order/") // Pastikan path relatif "order/"
.then((res) => {
    // Handle pagination
    if (res.data && Array.isArray(res.data.results)) {
        setOrders(res.data.results);
        // Jika Anda ingin filtered langsung diisi data awal:
        // setFiltered(res.data.results);
    } else if (Array.isArray(res.data)) {
        setOrders(res.data);
        // setFiltered(res.data);
    } else {
        console.error("Error fetch orders (FilteredOrderList): Data structure unknown", res.data);
        setOrders([]);
        // setFiltered([]);
    }
})
    .catch((err) => {
         console.error("Error fetch orders (FilteredOrderList):", err.response?.data || err.message || err);
         setOrders([]); // Set ke array kosong jika error
    });
}, []);

  useEffect(() => {
    if (startDate && endDate) {
      const result = orders.filter(order => {
        const tgl = new Date(order.tanggal_order);
        return tgl >= new Date(startDate) && tgl <= new Date(endDate);
      });
      setFiltered(result);
    } else {
      setFiltered(orders);
    }
  }, [startDate, endDate, orders]);

  const exportToExcel = (data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, "data-order.xlsx");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🔍 Filter Order Berdasarkan Tanggal</h2>
      <label>
        Dari: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </label>
      <label style={{ marginLeft: 20 }}>
        Sampai: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </label>

      <br />
      <button style={{ marginTop: 10 }} onClick={() => exportToExcel(filtered)}>Export ke Excel</button>

<table border="1" cellPadding="5" style={{ marginTop: 20, width: "100%", borderCollapse: "collapse" }}>
  <thead>
    <tr>
      <th>Tanggal</th>
      <th>Nama Customer</th>
      <th>Produk</th>
      <th>Qty</th>
      <th>Harga</th>
      <th>Sumber</th>
    </tr>
  </thead>
  <tbody>
    {filtered.map(order => (
      <tr key={order.id}>
        <td>{order.tanggal_order}</td>
        <td>{order.nama_customer}</td>
        <td>{order.nama_produk}</td>
        <td>{order.quantity}</td>
        <td>{order.harga_produk}</td>
        <td>{order.sumber_order}</td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
};

export default FilteredOrderList;

