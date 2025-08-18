// src/pages/ApplianceCheckRecordsPage.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApplianceCheckRecordsPage = () => {
  const [records, setRecords] = useState([]);
  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/appliance-checks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch records:', err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧾 Appliance Check Records</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Appliance</th>
              <th className="px-4 py-2 border">Temperature</th>
              <th className="px-4 py-2 border">Shift</th>
              <th className="px-4 py-2 border">Time</th>
              <th className="px-4 py-2 border">Staff</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td className="border px-4 py-2">{record.appliance_name}</td>
                <td className="border px-4 py-2">{record.temperature}</td>
                <td className="border px-4 py-2">{record.shift}</td>
                <td className="border px-4 py-2">
                  {new Date(record.time_recorded).toLocaleString()}
                </td>
                <td className="border px-4 py-2">{record.staff_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplianceCheckRecordsPage;
