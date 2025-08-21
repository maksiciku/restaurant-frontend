import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import api from '../api';
import jsPDF from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState({});
    const [dailyData, setDailyData] = useState([]);
    const userRole = localStorage.getItem('role');

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_API_URL}/analytics/daily`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })
            .then((response) => {
                setDailyData(response.data);
                console.log("✅ Daily Analytics Fetched:", response.data);
            })
            .catch((error) => {
                console.error("❌ Error fetching daily analytics:", error);
            });
    }, []);

    useEffect(() => {
        axios
            .get(`${process.env.REACT_APP_API_URL}/analytics`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })
            .then((response) => {
                setAnalytics(response.data);
                console.log("✅ Analytics Data Fetched:", response.data);
            })
            .catch((error) => {
                console.error("❌ Error fetching analytics:", error);
            });
    }, []);

    const chartData = {
        labels: dailyData.map((item) => item.date),
        datasets: [
            {
                label: 'Total Meals Per Day',
                data: dailyData.map((item) => item.totalMeals),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('📊 Analytics Dashboard', 10, 10);
        doc.text(`Role: ${userRole}`, 10, 20);
        doc.text(`Total Meals: ${analytics.totalMeals || 0}`, 10, 30);
        doc.text(`Average Calories: ${analytics.averageCalories || 0}`, 10, 40);
        doc.text('Most Common Ingredient:', 10, 50);
        doc.text(analytics.mostCommonIngredient || 'N/A', 10, 60);
        doc.save('analytics.pdf');
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>📈 Analytics Dashboard</h1>

            <p>👤 Role: {userRole === 'admin' ? 'Admin (All Meals)' : 'Staff (Your Meals Only)'}</p>
            <p>🍽️ Total Meals: {analytics.totalMeals || 0}</p>
            <p>🔥 Average Calories: {analytics.averageCalories || 0}</p>
            <p>🥣 Most Common Ingredient: {analytics.mostCommonIngredient || 'N/A'}</p>

            <div style={{ marginTop: '20px' }}>
                <h2>📅 Meals Added Per Day</h2>
                {dailyData.length ? (
                    <Bar data={chartData} />
                ) : (
                    <p>No data available to display.</p>
                )}
            </div>

            <button
                onClick={exportToPDF}
                style={{ marginTop: '20px' }}
                className="bg-blue-600 text-white px-4 py-2 rounded"
            >
                🧾 Export as PDF
            </button>
        </div>
    );
};

export default AnalyticsDashboard;
