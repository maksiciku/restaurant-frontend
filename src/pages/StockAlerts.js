import { useState, useEffect } from "react";

const StockAlerts = () => {
    const [alerts, setAlerts] = useState([]);

    const fetchStockAlerts = async () => {
        try {
            const response = await fetch("http://localhost:5000/stock/alerts");
            const data = await response.json();

            if (data.success && data.alerts.length > 0) {
                console.log("📢 Stock Alerts:", data.alerts);
                setAlerts(data.alerts);  // ✅ Save alerts to state
            } else {
                console.log("ℹ️ No stock alerts.");
                setAlerts([]);  // Clear if no alerts
            }
        } catch (error) {
            console.error("❌ Error fetching stock alerts:", error);
        }
    };

    useEffect(() => {
        fetchStockAlerts();  // ✅ Fetch alerts when component loads
    }, []);

    return (
        <div className="page-card">
            <h2>⚠️ Low Stock Alerts</h2>
            {alerts.length > 0 ? (
                <ul>
                    {alerts.map((alert, index) => (
                        <li key={index}>
                            <strong>{alert.ingredient}</strong> - {alert.alert_message}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No low-stock alerts.</p>
            )}
        </div>
    );
};

export default StockAlerts;
