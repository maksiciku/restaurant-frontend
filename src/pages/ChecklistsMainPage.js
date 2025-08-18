// src/pages/ChecklistsMainPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ChecklistsMainPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">🧾 Checklists & Compliance</h1>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-8">
  <button
    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md w-64"
    onClick={() => navigate('/checklists/folders')}
  >
    📁 Checklist Folders
  </button>

  <button
    className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-md w-64"
    onClick={() => navigate('/uk-regulations')}
  >
    📜 UK Regulations
  </button>
</div>
    </div>
  );
};

export default ChecklistsMainPage;
