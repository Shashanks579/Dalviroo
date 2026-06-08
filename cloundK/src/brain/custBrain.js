import { useState, useEffect } from 'react';
import axios from 'axios';


export function useOrderLogic() {
  const [dishes, setDishes] = useState([]);
  const [selectedDish, setselectedDish] = useState('');
  const [quantity, setquantity] = useState(1);
  const [mesg, setmesg] = useState('');

  const API_KEY = import.meta.env.VITE_API_KEY;


  useEffect(() => {
    axios.get('http://localhost:5000/api/dishes')
      .then(res => {
        setDishes(res.data);
        if (res.data.length > 0) setselectedDish(res.data[0]._id);
      })
      .catch(() => setmesg('Failed to load menu. Is the backend running?'));
  }, []);


  const submitOrder = async (e) => {
    e.preventDefault();
    setmesg('Sending order...');
    console.log("Sending API Key:", API_KEY);
    try {
      
      await axios.post('http://localhost:5000/api/order', {
        dish_id: selectedDish,
        quantity: Number(quantity)
      }, 

      {
        headers: { 'x-api-key': API_KEY } 
      });
      
      setmesg(`Success: Sent ${quantity}x to the kitchen.`);
      setquantity(1); 
    } catch (error) {
      setmesg('Order rejected. Check your API key or backend terminal for errors.');
    }
  };

  return {
    dishes,
    selectedDish,
    setselectedDish,
    quantity,
    setquantity,
    mesg,
    setmesg,
    submitOrder
  };
}