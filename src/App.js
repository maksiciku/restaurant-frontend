import React, { useState } from 'react';
import MealsPage from './pages/MealsPage';
import LoginPage from './pages/LoginPage';
import InvoiceScanner from './pages/InvoiceScanner';
import StockPage from './pages/StockPage';
import DrinksPage from './pages/DrinksPage';
import './App.css';
import { ToastContainer } from 'react-toastify';
import './index.css';
import './navbar.css';
import './global.css';
import PlateCalculatorPage from './pages/PlateCalculatorPage';
import { BrowserRouter as Router, Route, Routes, Navigate, NavLink, Link } from 'react-router-dom';
import PosPage from './pages/PosPage';
import LiveOrdersPage from './pages/LiveOrdersPage';
import DessertsPage from './pages/DessertsPage';
import Sidebar from './components/Sidebar';
import ChecklistFoldersPage from './pages/ChecklistFoldersPage';
import UKRegulationsPage from './pages/UKRegulationsPage';
import ChecklistsMainPage from './pages/ChecklistsMainPage';
import ChecklistFolderDetailPage from './pages/ChecklistFolderDetailPage';
import AddApplianceForm from './pages/AddApplianceForm';
import ApplianceChecksPage from './pages/ApplianceChecksPage';
import OrderingHubPage from './pages/OrderingHubPage';
import PreplistPage from './pages/PreplistPage';
import './styles/print.css';
import DailyPrepChecklistPage from './pages/DailyPrepChecklistPage';
import BookingsPage from './pages/BookingsPage';
import MenuBuilderPage from './pages/MenuBuilderPage';
import MenuPreviewPage from './pages/MenuPreviewPage';
import MenuFinalPage from './pages/MenuFinalPage';
import MainPOSPage from './pages/MainPOSPage'; // adjust path as needed
import TableMapEditorPage from './pages/TableMapEditorPage';
import NovaEntry from './pages/NovaEntry';
import ReceiptPage from './pages/ReceiptPage';

const App = () => {
    const [userRole, setUserRole] = useState(localStorage.getItem('role') || null);

    const handleLogin = (role) => {
        setUserRole(role);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setUserRole(null);
    };

    return (
        <Router>
            <div className="app-container min-h-screen bg-blue-50">
                {userRole && <Navbar handleLogout={handleLogout} />}
                <div className="content">
                    <Routes>
                        <Route path="/login" element={userRole ? <Navigate to="/meals" /> : <LoginPage onLogin={handleLogin} />} />
                        <Route path="/meals" element={userRole ? <MealsPage userRole={userRole} /> : <Navigate to="/login" />} />
                        <Route path="/drinks" element={userRole ? <DrinksPage /> : <Navigate to="/login" />} />
                        <Route path="/desserts" element={<DessertsPage />} />
                        <Route path="/scanner" element={userRole ? <InvoiceScanner /> : <Navigate to="/login" />} />
                        <Route path="/plate-calculator" element={userRole ? <PlateCalculatorPage /> : <Navigate to="/login" />} />
                        <Route path="/ordering-hub" element={<OrderingHubPage />} />
                        <Route path="/stock" element={userRole ? <StockPage /> : <Navigate to="/login" />} />
                        <Route path="/pos/:id" element={<PosPage />} />   {/*  NEW  */}
                        <Route path="/pos" element={<PosPage />} />
                        <Route path="/main-pos" element={<MainPOSPage />} />
                        <Route path="/orders-live" element={<LiveOrdersPage />} />
                        <Route path="/checklists" element={<ChecklistsMainPage />} />
                        <Route path="/checklists/folders" element={<ChecklistFoldersPage />} />
                        <Route path="/checklists/folder/:id" element={<ChecklistFolderDetailPage />} />
                        <Route path="/add-appliance" element={<AddApplianceForm />} />
                        <Route path="/preplist" element={<PreplistPage />} /> {/* <-- Add this line */}
                        <Route path="/daily-prep-checklist" element={<DailyPrepChecklistPage />} />
                        <Route path="/uk-regulations" element={<UKRegulationsPage />} />
                        <Route path="/appliance-checks" element={<ApplianceChecksPage />} />
                        <Route path="/bookings" element={<BookingsPage />} />
                        <Route path="/menu-builder" element={<MenuBuilderPage />} />
                        <Route path="/menu-preview" element={<MenuPreviewPage />} />
                        <Route path="/menu-final" element={<MenuFinalPage />} />
                        <Route path="/nova-entry" element={<NovaEntry />} />
                        <Route path="/receipt" element={<ReceiptPage />} />
                        <Route path="/table-map-editor" element={<TableMapEditorPage />} />
                        <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                </div>
                <ToastContainer position="top-right" autoClose={3000} />
            </div>
        </Router>
    );
};

const Navbar = ({ handleLogout }) => {
    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <h1 className="navbar-logo">MAKS OS</h1>
            </div>
            <ul className="navbar-links">
                <li><NavLink to="/meals">Meals</NavLink></li>
                <li><NavLink to="/drinks">Drinks</NavLink></li>
                <li><NavLink to="/desserts">Desserts</NavLink></li>
                <li><NavLink to="/scanner">Invoice Scanner</NavLink></li>
                <li><NavLink to="/plate-calculator">Plate Calculator</NavLink></li>
                <li><NavLink to="/ordering-hub" className="btn">Ordering Hub</NavLink></li>
                <li><NavLink to="/stock">Stock</NavLink></li>
                <li><NavLink to="/pos">POS</NavLink></li>
                <Link to="/main-pos" className="nav-link">POS</Link>
                <li><NavLink to="/orders-live">Live Orders</NavLink></li>
                <li><NavLink to="/checklists" className="text-white px-4 py-2 hover:bg-teal-700 rounded">Checklists</NavLink></li>
                <li><NavLink to="/preplist">Preplist</NavLink> {/* <-- Add this line */}</li>
                <li><NavLink to="/daily-prep-checklist">Daily Prep</NavLink></li>
                <Link to="/bookings">Bookings</Link>
                <Link to="/menu-builder"className="text-white hover:text-gray-300 px-4 py-2 transition">Menu Builder</Link>
                <NavLink to="/nova-entry" className="nav-link">
  Nova Entry
</NavLink>
            </ul>
            <div className="navbar-right">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
        </nav>
    );
};

export default App;
