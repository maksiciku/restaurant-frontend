import React, { useState } from 'react';
import PosPage from './PosPage';
import './MainPOSPage.css'; // Make sure the CSS file exists and is in the same folder

const MainPOSPage = () => {
  const [activeTab, setActiveTab] = useState('tables');
  const [posMode, setPosMode] = useState(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'sales':
        return <div className="p-6 text-gray-600">📊 Sales Page (Coming soon)</div>;

      case 'delivery':
        return <div className="p-6 text-gray-600">🚚 Delivery Page (Coming soon)</div>;

      case 'tables':
        if (!posMode) {
          return (
            <div className="main-pos-center">
              <div className="inner-box">
                <h2 className="title">Start a New Order</h2>
                <p className="subtitle">Choose how you'd like to begin:</p>
                <div className="btn-row">
                  <button
  className="table-order-btn"
  onClick={() => window.location.href = '/table-map-editor?pos=true'}
>
   Table Order
</button>
                  <button className="takeaway-btn" onClick={() => setPosMode('takeaway')}>
                     Takeaway
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="flex-1 overflow-auto p-4">
            <div className="max-w-screen-xl mx-auto">
              <PosPage mode={posMode} />
            </div>
          </div>
        );

      case 'website':
        return <div className="p-6 text-gray-600">🌐 Website Management (Coming soon)</div>;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-16 bg-white border-r shadow flex flex-col items-center py-4 space-y-6">
        <button title="Home">🏠</button>
        <button title="Customers">👥</button>
        <button title="Tables">🍽️</button>
        <button title="Orders">📦</button>
        <button title="Reports">📊</button>
        <button title="Settings">⚙️</button>
        <button title="Logout">🚪</button>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Tabs */}
        <div className="bg-white px-6 py-3 shadow flex items-center justify-between">
          <div className="flex gap-4">
            {['sales', 'delivery', 'tables', 'website'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPosMode(null);
                }}
                className={`text-sm font-semibold px-4 py-2 rounded ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="text-sm font-semibold text-gray-600">Hello, Admin</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-2xl p-8">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default MainPOSPage;
