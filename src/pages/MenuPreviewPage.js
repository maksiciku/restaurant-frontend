import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const templateOptions = [
  { id: 'classic', name: 'Classic B&W' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'modern', name: 'Bold Modern' },
  { id: 'image-grid', name: 'Image Grid' },
  { id: 'chalkboard', name: 'Chalkboard' }
];

const MenuPreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sections } = location.state || {};

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateClick = (templateId) => {
    setSelectedTemplate(templateId);
    toast.success(`Template "${templateId}" selected`);
  };

  const handleProceed = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first");
      return;
    }
    navigate('/menu-final', { state: { sections, selectedTemplate } });
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Select Your Menu Design Template</h2>
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        {templateOptions.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateClick(template.id)}
            style={{
              border: selectedTemplate === template.id ? '3px solid #007bff' : '1px solid #ccc',
              padding: 20,
              borderRadius: 10,
              cursor: 'pointer',
              width: 150,
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <strong>{template.name}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>Preview Here</div>
          </div>
        ))}
      </div>
      <button
        onClick={handleProceed}
        style={{ marginTop: 40, padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 6 }}
      >
        Continue to Customize
      </button>
    </div>
  );
};

export default MenuPreviewPage;
