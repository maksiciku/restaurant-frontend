import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import './MealsPage.css';
import AnalyticsDashboard from './AnalyticsDashboard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddMealForm from '../components/AddMealForm';
import IngredientScanner from '../components/IngredientScanner';

const MealsPage = () => {
    const [meals, setMeals] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [showAnalytics, setShowAnalytics] = useState(false);

    // ✅ Get role & token from localStorage
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isPremiumUser = role === 'manager' || role === 'admin';

    const fetchPlateCost = async (mealId) => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/meals/${mealId}/cost`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return parseFloat(res.data.total_cost || 0);
        } catch (error) {
            console.error('❌ Failed to fetch plate cost:', error.message);
            return 0;
        }
    };

    const fetchMeals = async (currentPage = 1) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/meals/paginated?page=${currentPage}&limit=${limit}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const rawMeals = response.data.meals || [];

            if (isPremiumUser) {
                const enrichedMeals = await Promise.all(
                    rawMeals.map(async (meal) => {
                        const plateCost = await fetchPlateCost(meal.id);
                        return { ...meal, plate_cost: plateCost };
                    })
                );
                setMeals(enrichedMeals);
            } else {
                setMeals(rawMeals);
            }

            setPage(response.data.page || 1);
            setTotalPages(Math.ceil(response.data.total / response.data.limit) || 1);
        } catch (error) {
            toast.error('Error fetching meals.');
        }
    };

    useEffect(() => {
        fetchMeals();
    }, []);

    const handleDelete = (id) => {
        axios.delete(`${process.env.REACT_APP_API_URL}/meals/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(() => {
                toast.success('Meal deleted successfully!');
                fetchMeals();
            })
            .catch(() => toast.error('Failed to delete meal.'));
    };

    const handleAddMeal = (newMeal) => {
        axios.post(`${process.env.REACT_APP_API_URL}/meals`, newMeal, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(() => {
                toast.success('Meal added successfully!');
                fetchMeals();
            })
            .catch(() => toast.error('Failed to add meal.'));
    };

    const placeOrder = async (meal) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/orders`, {
                meal_name: meal.name.trim().toLowerCase(),
                quantity: 1,
                total_price: meal.price,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                toast.success(`✅ Order placed for ${meal.name}`);
            } else {
                toast.error(`❌ Order failed: ${response.data.message || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error(`❌ Order request error: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    const displayIngredients = (ingredients) => {
        try {
            const parsed = JSON.parse(ingredients);
            if (Array.isArray(parsed)) {
                return parsed.map(ing => `${ing.name} (${ing.amount}g)`).join(', ');
            }
        } catch (error) {
            console.error("Error parsing ingredients:", error);
        }
        return ingredients;
    };

    const displayAllergens = (allergens) => {
        if (!allergens || allergens.length === 0 || allergens === "None") return "No allergens detected";
        if (typeof allergens === "string") return allergens.split(',').map(a => a.trim()).join(', ');
        return allergens.join(', ');
    };

    return (
        <div className="page-card">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1>Meals</h1>

            <button onClick={() => setShowAnalytics(!showAnalytics)}>
                {showAnalytics ? "Hide Analytics" : "View Analytics"}
            </button>

            {showAnalytics && (
                <>
                    <h2>Analytics Dashboard</h2>
                    <AnalyticsDashboard />
                </>
            )}

            <input
                type="text"
                placeholder="Search by name or ingredients"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
            />

            <button onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Close Add Meal Form' : 'Add New Meal'}
            </button>

            {showAddForm && <AddMealForm onAddMeal={handleAddMeal} />}

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Ingredients</th>
                        <th>Allergens</th>
                        <th>Calories</th>
                        <th>Price (£)</th>
                        <th>QR Code</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {meals.map(meal => (
                        <tr key={meal.id}>
                            <td>{meal.name}</td>
                            <td>{displayIngredients(meal.ingredients)}</td>
                            <td>{displayAllergens(meal.allergens)}</td>
                            <td>{meal.calories}</td>
                            <td>{meal.price ? `£${meal.price.toFixed(2)}` : 'No Price'}</td>
                            <td>
                                <QRCodeCanvas value={JSON.stringify(meal)} size={50} />
                            </td>
                            <td>
                                <button onClick={() => handleDelete(meal.id)}>Delete</button>
                                <button onClick={() => placeOrder(meal)}>Order</button>
                                {isPremiumUser && (
  <tr>
    <td colSpan="7">
      <div className="bg-yellow-100 p-2 mt-2 rounded text-sm">
        <p>Plate Cost: £{meal.plate_cost?.toFixed(2) || "0.00"}</p>
        <p>Suggested Price (x3): £{(meal.plate_cost * 3).toFixed(2)}</p>
        <p>Estimated Profit: £{(meal.price - meal.plate_cost).toFixed(2)}</p>

        {meal.plate_cost > 0 && meal.price ? (
          <>
            <p>
              Profit Margin:{" "}
              {((meal.price - meal.plate_cost) / meal.plate_cost * 100).toFixed(2)}%
            </p>
            {meal.plate_cost > meal.price && (
              <p className="text-red-600 font-bold">⚠️ Cost exceeds selling price!</p>
            )}
          </>
        ) : (
          <p className="text-gray-500">Add price and ingredients for margin.</p>
        )}
      </div>
    </td>
  </tr>
)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MealsPage;
