// src/pages/ChecklistFoldersPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ChecklistFoldersPage = () => {
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const navigate = useNavigate();

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/checklists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFolders(response.data);
    } catch (error) {
      console.error('❌ Error fetching folders:', error);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Create folder
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/checklists', 
        { name: newFolderName }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Instantly add the new folder to list without refetch
      const newFolder = {
        id: response.data.id,
        name: newFolderName,
        created_by: null, // You can adjust if you need
      };
      setFolders((prev) => [newFolder, ...prev]);
      setNewFolderName('');
    } catch (error) {
      console.error('❌ Error creating folder:', error);
    }
  };

  // Delete folder
  const deleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/checklists/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Instantly remove from local list
      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
    } catch (error) {
      console.error('❌ Error deleting folder:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">📁 Checklist Folders</h1>

      <div className="flex justify-center mb-6">
        <input
          type="text"
          className="border rounded-l-lg p-2 w-64"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
        <button
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-r-lg"
          onClick={createFolder}
        >
          ➕ Add
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="relative border p-4 rounded-xl shadow-md hover:bg-gray-100 cursor-pointer"
          >
            <h2
              className="text-xl font-semibold"
              onClick={() => navigate(`/checklists/folder/${folder.id}`)}
            >
              📁 {folder.name}
            </h2>
            <button
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation(); // prevent opening folder when clicking delete
                deleteFolder(folder.id);
              }}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistFoldersPage;
