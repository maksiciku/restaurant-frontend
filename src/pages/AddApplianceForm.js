import React, { useState } from 'react';
import axios from 'axios';

const AddApplianceForm = ({ onApplianceCreated }) => {
  const [type, setType] = useState('Fridge');
  const [name, setName] = useState('');
  const [storageNumber, setStorageNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/appliances',
        { type, name, storage_number: storageNumber, supplier, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('✅ Appliance added successfully!');
      if (onApplianceCreated) onApplianceCreated();
      setType('Fridge');
      setName('');
      setStorageNumber('');
      setSupplier('');
      setNotes('');
    } catch (error) {
      console.error('❌ Error adding appliance:', error);
      setMessage('❌ Failed to add appliance');
    }
  };

  return (
    <div className="p-4 border rounded max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">➕ Add New Appliance</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block font-semibold">Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="Fridge">Fridge</option>
            <option value="Freezer">Freezer</option>
            <option value="Hot Hold">Hot Hold</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Name:</label>
          <input
            type="text"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Storage Number (optional):</label>
          <input
            type="text"
            value={storageNumber}
            onChange={(e) => setStorageNumber(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Supplier (optional):</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label className="block font-semibold">Notes (optional):</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
        >
          Save Appliance
        </button>

        {message && <p className="mt-2 font-semibold">{message}</p>}
      </form>
    </div>
  );
};

export default AddApplianceForm;
