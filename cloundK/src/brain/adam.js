import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export function useAdminLogic() {
  const [dishes, setDishes] = useState([]);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {
    // 1. Initial Load: Fetch all dishes and their current predictions/created counts
    axios.get('http://localhost:5000/api/dishes')
      .then(res => setDishes(res.data))
      .catch(() => setError('Failed to load dashboard data.'));

    socketRef.current = io('http://localhost:5000', {
      auth: { apiKey: API_KEY }
    });

    // Listen for real-time updates to dish predictions and created counts
    socketRef.current.on('totals_updated', (updatedDish) => {
      setDishes(prevDishes => 
        prevDishes.map(dish => dish._id === updatedDish._id ? updatedDish : dish)
      );
    });
    // Listen for global reset and zero out local table math
    socketRef.current.on('day_reset', () => {
      setDishes(prevDishes => 
        prevDishes.map(dish => ({ ...dish, created: 0 }))
      );
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);




  // ---  Add a dish ---
  const addNewDish = async (name, predicted) => {
    if (!name.trim()) {
      setError('Dish name cannot be empty.');
      return false; 
    }
    try {
      const res = await axios.post('http://localhost:5000/api/dishes', 
        { name, predicted: Number(predicted) },
        { headers: { 'x-api-key': API_KEY } }
      );
      // Instantly push the new dish into the local table state
      setDishes(prev => [...prev, res.data.dish]);
      setError('');
      return true; 
    } catch (err) {
      setError('Failed to add new dish. Check backend.');
      return false;
    }
  };


// ---  Update prediction with a PUT request ---
  const updatePrediction = async (id, newPrediction) => {
    try {
      await axios.put(`http://localhost:5000/api/dishes/${id}`, 
        { predicted: Number(newPrediction) },
        { headers: { 'x-api-key': API_KEY } }
      );
      setError('');
    } catch (err) {
      setError('Failed to save prediction.');
    }
  };


  // --- Download the CSV report ---
  const downloadReport = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/report', {
        headers: { 'x-api-key': API_KEY }
      });
      
      const data = res.data;
      if (data.length === 0) return;

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', 'Dalviroo_Production_Report.csv');
      a.click();
      a.remove();
    } catch (err) {
      setError('Failed to download report.');
    }
  };

  // --- Reset Day Function ---
  const resetDay = async () => {
    // The Safeguard
    const isConfirmed = window.confirm("WARNING: This will instantly delete all pending kitchen orders and reset all production data to zero. Are you absolutely sure?");
    
    if (!isConfirmed) return;

    try {
      await axios.post('http://localhost:5000/api/reset-day', {}, {
        headers: { 'x-api-key': API_KEY }
      });
      setError('');
    } catch (err) {
      setError('Failed to reset the day. Check backend.');
    }
  };

  // Return the new function here
  return { dishes, error, updatePrediction, downloadReport, addNewDish, resetDay };
}