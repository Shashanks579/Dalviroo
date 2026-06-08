import {useOrderLogic} from './brain/custBrain';
import './Style/customer.css';

export default function Ordersimulate() {
  const{
    dishes, 
    selectedDish, 
    setselectedDish, 
    quantity,  
    setquantity,
    mesg, 
    submitOrder
  } = useOrderLogic();


    return (
      <div className="simulator-container">
      <h2>Customer Ordering</h2>
      
      <form onSubmit={submitOrder} className="simulator-form">
        
        {/* The New Scrollable Selection Grid */}
        <div className="dish-selection-area">
          <label className="input-label">Select a Dish:</label>
          <div className="dish-list">
            {dishes.length === 0 && <p className="loading-text">Loading menu...</p>}
            {dishes.map(dish => (
              <div 
                key={dish._id} 
                // Dynamically apply the 'selected' class if this dish is the active one
                className={`dish-card ${selectedDish === dish._id ? 'selected' : ''}`}
                onClick={() => setselectedDish(dish._id)}
              >
                <span className="dish-card-name">{dish.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* The Quantity Input */}
        <div className="quantity-area">
          <label className="input-label" htmlFor="qty">Quantity:</label>
          <input 
            id="qty"
            type="number" 
            min="1" 
            max="1000" 
            value={quantity} 
            onChange={(e) => setquantity(e.target.value)} 
            required 
            className="simulator-input"
          />
        </div>
        
        <button type="submit" className="submit-btn">
          Place Order
        </button>
      </form>

      {mesg && <p className="status-message">{mesg}</p>}
    </div>
    );
}


