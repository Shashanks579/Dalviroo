import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export function useKitchenLogic() {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  
  // We use a ref to keep the socket connection alive without causing infinite re-renders
  const socketRef = useRef(null);
  const API_KEY = import.meta.env.VITE_API_KEY;

  useEffect(() => {

    // 1. Initial Load: Fetch what's already in the database
    axios.get('http://localhost:5000/api/kitchen-queue', {
      headers: { 'x-api-key': API_KEY }
    })
    .then(res => setQueue(res.data))
    .catch(() => setError('Failed to load initial kitchen queue.'));


    // 2. Open the Live Socket Connection
    socketRef.current = io('http://localhost:5000', {
      auth: { apiKey: API_KEY }
    });


    // 3. Listen for new orders and inject them into the table instantly
    socketRef.current.on('new_order', (newOrder) => {
      setQueue(prev => [...prev, newOrder]);
    });


    // 4. Listen for other tabs clearing an order and remove it here
    socketRef.current.on('order_cleared', (clearedOrderId) => {
      setQueue(prev => prev.filter(order => order._id !== clearedOrderId));
    });


    // 5. Listen for updates to dish totals and update the predicted/created numbers live
    socketRef.current.on('totals_updated', (updatedDish) => {
      setQueue(prevQueue => 
        prevQueue.map(order => {
          // If this pending order matches the dish that just got updated...
          if (order.dish_id && order.dish_id._id === updatedDish._id) {
            // update its predicted and created numbers live
            return {
              ...order,
              dish_id: {
                ...order.dish_id,
                predicted: updatedDish.predicted,
                created: updatedDish.created
              }
            };
          }
          return order; // Leave other dishes alone
        })
      );
    });


    // 6. Listen for the day reset signal and clear the queue immediately
    socketRef.current.on('day_reset', () => {
      setQueue([]);
    });


    // 7. Listen for connection errors (e.g. backend is down) and show a banner
    socketRef.current.on('connect_error', () => {
      setError('Live connection lost. Please refresh.');
    });


    // Cleanup when the component unmounts
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };

  }, []);

  
  // Fire the completion event to the backend
  const markAsDone = (orderId) => {
    if (socketRef.current) {
      socketRef.current.emit('mark_done', orderId);
      
      // The 'order_cleared' socket event will handle hiding it on the other tabs.
      setQueue(prev => prev.filter(order => order._id !== orderId));
    }
  };

  return { queue, error, markAsDone };
}