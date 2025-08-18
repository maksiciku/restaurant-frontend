// src/components/Sidebar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const links = [
    { to: '/pos', label: 'POS' },
    { to: '/meals', label: 'Meals' },
    { to: '/drinks', label: 'Drinks' },
    { to: '/desserts', label: 'Desserts' },
    { to: '/kds', label: 'KDS' },
    { to: '/stock', label: 'Stock' },
    { to: '/analytics', label: 'Analytics' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/settings', label: 'Settings' }
  ];

  return (
    <div className="relative">
      <button
        className="fixed top-4 left-4 z-50 bg-teal-600 text-white p-2 rounded"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 text-xl font-bold border-b">MAKS</div>
        <nav className="flex flex-col p-4 gap-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-gray-800 hover:text-teal-600 transition-colors"
              onClick={toggleSidebar}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
