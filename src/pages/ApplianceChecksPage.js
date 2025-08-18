// src/pages/ApplianceChecksPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ApplianceChecksPage = () => {
  const [checks, setChecks] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [filters, setFilters] = useState({ date: '', applianceId: '', shift: '' });

  const API = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchChecks();
    fetchAppliances();
  }, []);

  const fetchChecks = async () => {
    try {
      const res = await axios.get(`${API}/appliance-checks`);
      setChecks(res.data);
    } catch (err) {
      console.error('Failed to fetch checks:', err.message);
    }
  };

  const fetchAppliances = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/appliances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppliances(res.data);
    } catch (err) {
      console.error('Failed to fetch appliances:', err.message);
    }
  };

  const filteredChecks = checks.filter(check => {
    const matchDate = !filters.date || check.time_recorded.startsWith(filters.date);
    const matchAppliance = !filters.applianceId || check.appliance_id === Number(filters.applianceId);
    const matchShift = !filters.shift || check.shift === filters.shift;
    return matchDate && matchAppliance && matchShift;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📋 Appliance Check Records</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="date"
          value={filters.date}
          onChange={e => setFilters({ ...filters, date: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={filters.applianceId}
          onChange={e => setFilters({ ...filters, applianceId: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Appliances</option>
          {appliances.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={filters.shift}
          onChange={e => setFilters({ ...filters, shift: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Shifts</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Appliance</th>
              <th className="px-4 py-2 border">Shift</th>
              <th className="px-4 py-2 border">Temp (°C)</th>
              <th className="px-4 py-2 border">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredChecks.map((check, index) => {
              const appliance = appliances.find(a => a.id === check.appliance_id);
              return (
                <tr key={index}>
                  <td className="border px-4 py-2">{appliance?.name || 'Unknown'}</td>
                  <td className="border px-4 py-2">{check.shift}</td>
                  <td className="border px-4 py-2">{check.temperature}</td>
                  <td className="border px-4 py-2">{check.time_recorded}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplianceChecksPage;
