import React from 'react';
import { useKitchenLogic } from './brain/kitBrain';
import './Style/chef.css';

export default function KitchenDisplay() {
  const { queue, error, markAsDone } = useKitchenLogic();

  return (
    <div className="kitchen-container">
      <h2>Kitchen Display</h2>
      
      {error && <div className="error-banner">{error}</div>}

      <table className="dalviroo-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Created-till-now</th>
            <th>Predicted</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {queue.length === 0 ? (
            <tr>
              <td colSpan="5" className="empty-row">No pending orders. Kitchen is clear.</td>
            </tr>
          ) : // Loop through the orderSchema queue and display each order in a table row
          (
            queue.map((order) => (
              <tr key={order._id}>
                {}
                <td>{order.dish_id?.name || 'Unknown Dish'}</td>
                <td>{order.quantity}</td>
                <td>{order.dish_id?.created || 0}</td>
                <td>{order.dish_id?.predicted || 0}</td>
                <td>
                  <button 
                    className="done-btn" 
                    onClick={() => markAsDone(order._id)}
                  >
                    DONE
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}