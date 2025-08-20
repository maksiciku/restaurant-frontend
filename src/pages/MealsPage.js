import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './MealsPage.css';
import AnalyticsDashboard from './AnalyticsDashboard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddMealForm from '../components/AddMealForm';
import IngredientScanner from '../components/IngredientScanner';
import api from '../api';

const MealsPage = () => {
  const [meals, setMeals] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const role = localStorage.getItem('role');
  const isPremiumUser = role === 'manager' || role === 'admin';

  const fetchPlateCost = async (mealId) => {
    try {
      const res = await api.get(`/meals/${mealId}/cost`);
      return parseFloat(res?.data?.total_cost || 0);
    } catch (e) {
      console.error('❌ plate cost:', e?.response?.status || e.message);
      return 0;
    }
  };

  const fetchMeals = async (currentPage = 1) => {
    try {
      const res = await api.get(`/meals/paginated?page=${currentPage}&limit=${limit}`);
      const rawMeals = res?.data?.meals || [];

      if (isPremiumUser) {
        const withCosts = await Promise.all(
          rawMeals.map(async (meal) => {
            const plate_cost = await fetchPlateCost(meal.id);
            return { ...meal, plate_cost };
          })
        );
        setMeals(withCosts);
      } else {
        setMeals(rawMeals);
      }

      setPage(res?.data?.page || 1);
      setTotalPages(Math.ceil((res?.data?.total || 0) / (res?.data?.limit || limit)) || 1);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401 || code === 403) toast.error('Not authorized. Please log in again.');
      else toast.error('Error fetching meals.');
      setMeals([]);
    }
  };

  useEffect(() => {
    fetchMeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Meal deleted successfully!');
      fetchMeals(page);
    } catch {
      toast.error('Failed to delete meal.');
    }
  };

  const handleAddMeal = async (newMeal) => {
    try {
      await api.post('/meals', newMeal);
      toast.success('Meal added successfully!');
      fetchMeals(1);
    } catch {
      toast.error('Failed to add meal.');
    }
  };

  const placeOrder = async (meal) => {
    try {
      const resp = await api.post('/orders', {
        meal_name: meal.name.trim().toLowerCase(),
        quantity: 1,
        total_price: meal.price,
      });
      if (resp?.data?.success) toast.success(`✅ Order placed for ${meal.name}`);
      else toast.error(`❌ Order failed: ${resp?.data?.message || 'Unknown error'}`);
    } catch (e) {
      toast.error(`❌ Order request error: ${e?.response?.data?.message || 'Unknown error'}`);
    }
  };

  const displayIngredients = (ingredients) => {
    try {
      const parsed = JSON.parse(ingredients);
      if (Array.isArray(parsed)) return parsed.map((ing) => `${ing.name} (${ing.amount}g)`).join(', ');
    } catch {}
    return ingredients || '';
  };

  const displayAllergens = (allergens) => {
    if (!allergens || allergens.length === 0 || allergens === 'None') return 'No allergens detected';
    if (typeof allergens === 'string') return allergens.split(',').map((a) => a.trim()).join(', ');
    return allergens.join(', ');
  };

  return (
    <div className="page-card">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1>Meals</h1>

      <button onClick={() => setShowAnalytics(!showAnalytics)}>
        {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
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
          {meals.map((meal) => (
            <React.Fragment key={meal.id}>
              <tr>
                <td>{meal.name}</td>
                <td>{displayIngredients(meal.ingredients)}</td>
                <td>{displayAllergens(meal.allergens)}</td>
                <td>{meal.calories}</td>
                <td>{meal.price ? `£${Number(meal.price).toFixed(2)}` : 'No Price'}</td>
                <td><QRCodeCanvas value={JSON.stringify(meal)} size={50} /></td>
                <td>
                  <button onClick={() => handleDelete(meal.id)}>Delete</button>
                  <button onClick={() => placeOrder(meal)}>Order</button>
                </td>
              </tr>

              {isPremiumUser && (
                <tr>
                  <td colSpan="7">
                    <div className="bg-yellow-100 p-2 mt-2 rounded text-sm">
                      <p>Plate Cost: £{meal.plate_cost?.toFixed(2) || '0.00'}</p>
                      <p>Suggested Price (x3): £{meal.plate_cost ? (meal.plate_cost * 3).toFixed(2) : '0.00'}</p>
                      <p>
                        Estimated Profit: £
                        {meal.price && meal.plate_cost ? (meal.price - meal.plate_cost).toFixed(2) : '0.00'}
                      </p>
                      {meal.plate_cost > 0 && meal.price ? (
                        <>
                          <p>
                            Profit Margin:{' '}
                            {(((meal.price - meal.plate_cost) / meal.plate_cost) * 100).toFixed(2)}%
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
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <button disabled={page <= 1} onClick={() => fetchMeals(page - 1)}>Prev</button>
        <span style={{ margin: '0 8px' }}>Page {page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => fetchMeals(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default MealsPage;
