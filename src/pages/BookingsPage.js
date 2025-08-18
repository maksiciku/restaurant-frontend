import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);

  // 🧠 Booking form states
  const [customer_name, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [number_of_people, setNumberOfPeople] = useState('');
  const [table_number, setTableNumber] = useState('');
  const [booking_time, setBookingTime] = useState('');

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setNumberOfPeople('');
    setTableNumber('');
    setBookingTime('');
    fetchBookings();
  };

  const fetchBookings = () => {
    axios.get('http://localhost:5000/bookings', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setBookings(res.data))
    .catch(err => console.error("❌ Failed to load bookings:", err));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const formatTime = datetime => new Date(datetime).toLocaleString();

  const cancelBooking = (id) => {
    axios.delete(`http://localhost:5000/bookings/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => fetchBookings());
  };

  const markAsArrived = (id) => {
    axios.put(`http://localhost:5000/bookings/arrived/${id}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => fetchBookings());
  };

  const grouped = {
    today: [],
    upcoming: [],
    past: []
  };

  bookings.forEach(b => {
    const date = b.booking_time.split('T')[0];
    if (date === today) grouped.today.push(b);
    else if (date > today) grouped.upcoming.push(b);
    else grouped.past.push(b);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/bookings', {
        customer_name,
        phone,
        number_of_people,
        table_number,
        booking_time,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      toast.success(response.data.message || "✅ Booking created successfully.");
      resetForm();

    } catch (error) {
      if (error.response?.status === 409 && error.response.data?.conflict) {
        const suggestions = await suggestAlternativeTables(booking_time);
        toast.error(`${error.response.data.message} 🧠 Suggestions: ${suggestions.join(', ')}`);
      } else {
        toast.error("❌ Failed to create booking.");
      }
    }
  };

  const suggestAlternativeTables = async (bookingTime) => {
    try {
      const res = await axios.get(`http://localhost:5000/bookings/conflicts?time=${encodeURIComponent(bookingTime)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return res.data.available_tables || [];
    } catch (err) {
      console.error("❌ Error fetching alternative tables:", err);
      return [];
    }
  };

  const renderGroup = (label, items) => (
    <div>
      <h2>{label} ({items.length})</h2>
      {items.map(b => (
        <div key={b.id} style={{ border: '1px solid #ccc', padding: 10, margin: 10 }}>
          <strong>{b.customer_name}</strong> | {b.phone} | Table {b.table_number} | {b.number_of_people} people<br />
          <small>{formatTime(b.booking_time)}</small><br />
          <em>Status: {b.status}</em><br />
          {b.status !== 'arrived' && (
            <button onClick={() => markAsArrived(b.id)} style={{ marginRight: 10 }}>✅ Mark Arrived</button>
          )}
          <button onClick={() => cancelBooking(b.id)} style={{ color: 'red' }}>❌ Cancel</button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h1>📅 Bookings</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>
        <input placeholder="Name" value={customer_name} onChange={(e) => setCustomerName(e.target.value)} required />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input placeholder="People" value={number_of_people} onChange={(e) => setNumberOfPeople(e.target.value)} required />
        <input placeholder="Table" value={table_number} onChange={(e) => setTableNumber(e.target.value)} required />
        <input type="datetime-local" value={booking_time} onChange={(e) => setBookingTime(e.target.value)} required />
        <button type="submit">➕ Book</button>
      </form>

      {renderGroup("Today", grouped.today)}
      {renderGroup("Upcoming", grouped.upcoming)}
      {renderGroup("Past", grouped.past)}
    </div>
  );
};

export default BookingsPage;
