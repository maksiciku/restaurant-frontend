import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ChecklistFolderDetailsPage = () => {
  const { id } = useParams(); // checklist folder ID
  const [appliances, setAppliances] = useState([]);
  const [applianceForm, setApplianceForm] = useState({
    type: 'Fridge',
    name: '',
    storage_number: '',
    supplier: '',
    notes: ''
  });
  const [checkData, setCheckData] = useState({});
  const [staffName, setStaffName] = useState('');

  const API = process.env.REACT_APP_API_URL;

  const [showForm, setShowForm] = useState(false);
  const [showApplianceList, setShowApplianceList] = useState(false);

  useEffect(() => {
    fetchAppliances();
    getLoggedInStaff();
  }, []);

  const fetchAppliances = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/appliances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const appliancesWithEditing = res.data.map(a => ({ ...a, editing: false }));
      setAppliances(appliancesWithEditing);
    } catch (err) {
      console.error('Error fetching appliances:', err.message);
    }
  };

  const getLoggedInStaff = () => {
    try {
      const tokenPayload = JSON.parse(atob(localStorage.getItem('token').split('.')[1]));
      setStaffName(tokenPayload.username || '');
    } catch (err) {
      console.error('Error decoding token:', err.message);
    }
  };

  const handleInputChange = (applianceId, shift, value) => {
    setCheckData(prev => ({
      ...prev,
      [`${applianceId}_${shift}`]: value
    }));
  };

  const handleSave = async (applianceId, shift) => {
    const temp = checkData[`${applianceId}_${shift}`];
    if (!temp) return alert('Please enter temperature.');

    try {
      await axios.post(`${API}/appliance-checks`, {
        appliance_id: applianceId,
        temperature: temp,
        shift,
        staff_name: staffName  // ✅ Include staff name
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });      
      alert('✅ Temperature recorded.');
    } catch (err) {
      console.error('Save failed:', err.message);
      alert('❌ Failed to save.');
    }
  };

  const createAppliance = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/appliances`, applianceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplianceForm({ type: 'Fridge', name: '', storage_number: '', supplier: '', notes: '' });
      fetchAppliances();
    } catch (err) {
      console.error('Error creating appliance:', err.message);
    }
  };

  const enterApplianceEdit = (index) => {
    setAppliances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], editing: true };
      return updated;
    });
  };

  const cancelApplianceEdit = () => {
    fetchAppliances();
  };

  const updateApplianceField = (index, field, value) => {
    setAppliances(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const saveApplianceEdit = async (appliance) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/appliances/${appliance.id}`, appliance, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppliances();
      alert('✅ Appliance updated.');
    } catch (err) {
      console.error('Error updating appliance:', err.message);
      alert('❌ Failed to update.');
    }
  };

  const deleteAppliance = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appliance?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/appliances/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppliances();
      alert('🗑️ Appliance deleted.');
    } catch (err) {
      console.error('Error deleting appliance:', err.message);
      alert('❌ Failed to delete.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Checklist Details</h1>

      {/* Toggle Form Visibility */}
      <div className="flex gap-4 mb-6">
  <button
    onClick={() => setShowForm(!showForm)}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  >
    {showForm ? 'Cancel' : '+ Add Appliance'}
  </button>

{/* Appliance Creation Form */}
{showForm && (
  <div className="bg-white p-4 rounded shadow mb-8">
    <div className="grid grid-cols-2 gap-4">
      <select
        value={applianceForm.type}
        onChange={e => setApplianceForm({ ...applianceForm, type: e.target.value })}
        className="border p-2 rounded"
      >
        <option value="Fridge">Fridge</option>
        <option value="Freezer">Freezer</option>
        <option value="Hot Hold">Hot Hold</option>
      </select>
      <input
        placeholder="Name (e.g. Fridge 1)"
        value={applianceForm.name}
        onChange={e => setApplianceForm({ ...applianceForm, name: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        placeholder="Storage Number (optional)"
        value={applianceForm.storage_number}
        onChange={e => setApplianceForm({ ...applianceForm, storage_number: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        placeholder="Supplier (optional)"
        value={applianceForm.supplier}
        onChange={e => setApplianceForm({ ...applianceForm, supplier: e.target.value })}
        className="border p-2 rounded"
      />
      <input
        placeholder="Notes (optional)"
        value={applianceForm.notes}
        onChange={e => setApplianceForm({ ...applianceForm, notes: e.target.value })}
        className="col-span-2 border p-2 rounded"
      />
    </div>
    <button
      onClick={createAppliance}
      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
    >
      Save Appliance
    </button>
  </div>
)}

    {/* Toggle Appliance List */}
    <button
    onClick={() => setShowApplianceList(prev => !prev)}
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
  >
    {showApplianceList ? 'Hide Appliances' : 'View Appliances'}
  </button>

{/* View Records Button */}
<a href="/appliance-checks">
    <button className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
      📋 View Records
    </button>
  </a>
</div>

{/* Appliance List */}
{showApplianceList && (
  <div className="mt-4">
    <h3 className="text-lg font-semibold mb-2">Appliances</h3>
    {appliances.map((ap, idx) => (
      <div key={ap.id} className="border-b py-3 flex flex-col gap-2">
        {ap.editing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={ap.type}
                onChange={e => updateApplianceField(idx, 'type', e.target.value)}
                className="border p-2 rounded"
              >
                <option value="Fridge">Fridge</option>
                <option value="Freezer">Freezer</option>
                <option value="Hot Hold">Hot Hold</option>
              </select>
              <input
                value={ap.name}
                onChange={e => updateApplianceField(idx, 'name', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Storage Number"
                value={ap.storage_number || ''}
                onChange={e => updateApplianceField(idx, 'storage_number', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Supplier"
                value={ap.supplier || ''}
                onChange={e => updateApplianceField(idx, 'supplier', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Notes"
                value={ap.notes || ''}
                onChange={e => updateApplianceField(idx, 'notes', e.target.value)}
                className="col-span-2 border p-2 rounded"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => saveApplianceEdit(ap)} className="bg-green-600 text-white px-4 py-1 rounded">Save</button>
              <button onClick={() => cancelApplianceEdit(idx)} className="bg-gray-500 text-white px-4 py-1 rounded">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div>
              <strong>{ap.type}</strong> – {ap.name}
              {ap.storage_number && <> | Storage #: {ap.storage_number}</>}
              {ap.supplier && <> | Supplier: {ap.supplier}</>}
              {ap.notes && <> | Notes: {ap.notes}</>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => enterApplianceEdit(idx)} className="bg-yellow-500 text-white px-3 py-1 rounded">Edit</button>
              <button onClick={() => deleteAppliance(ap.id)} className="bg-red-600 text-white px-3 py-1 rounded">Delete</button>
            </div>
          </>
        )}
      </div>
    ))}
  </div>
)}  

      {/* Temperature Table */}
      <div className="bg-white p-4 rounded shadow mt-8">
        <h2 className="text-xl font-semibold mb-4">Daily Appliance Checks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Appliance</th>
                <th className="px-4 py-2 border">Shift</th>
                <th className="px-4 py-2 border">Temperature (°C)</th>
                <th className="px-4 py-2 border">Time</th>
                <th className="px-4 py-2 border">Staff</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {appliances.map(appliance => (
                ['AM', 'PM'].map(shift => (
                  <tr key={`${appliance.id}_${shift}`}>
                    <td className="border px-4 py-2">{appliance.name}</td>
                    <td className="border px-4 py-2">{shift}</td>
                    <td className="border px-4 py-2">
                    <input
  type="text"
  value={checkData[`${appliance.id}_${shift}`] || ''}
  onChange={e => handleInputChange(appliance.id, shift, e.target.value)}
  onKeyDown={e => {
    if (e.key === 'Enter') {
      handleSave(appliance.id, shift);
    }
  }}
  onBlur={() => {
    if (checkData[`${appliance.id}_${shift}`]) {
      handleSave(appliance.id, shift);
    }
  }}
  placeholder="e.g. 5°C"
  className="border rounded p-1 w-24"
/> 
                    </td>
                    <td className="border px-4 py-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="border px-4 py-2">{staffName}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleSave(appliance.id, shift)}
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >Save</button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChecklistFolderDetailsPage;
