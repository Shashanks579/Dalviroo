import  { useState, useEffect } from 'react';
import { useAdminLogic } from './brain/adam';
import './Style/admin.css';

// ---  The Admin Dashboard Component ---
export default function AdminDashboard() {
  const { dishes, error, updatePrediction, downloadReport, addNewDish, resetDay } = useAdminLogic();

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Manager Dashboard</h2>
        <div className="header-actions">
          <button className="reset-btn" onClick={resetDay}>
            ⚠ Reset Day
          </button>
          
          <button className="download-btn" onClick={downloadReport}>
            ↓ Download Report
          </button>
         
          
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Insert the new form here */}
      <div className="admin-controls">
        <AddDishForm onAdd={addNewDish} />
      </div>

      <table className="dalviroo-table admin-table">
        <thead>
          <tr>
            <th>Dish Name</th>
            <th>Produced (Live)</th>
            <th>Predicted (Target)</th>
          </tr>
        </thead>
        <tbody>
          {dishes.length === 0 && (
            <tr><td colSpan="3" style={{textAlign: 'center'}}>Loading data...</td></tr>
          )}
          {dishes.map(dish => (
            <AdminRow key={dish._id} dish={dish} onUpdate={updatePrediction} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---  The Add Dish Form ---
function AddDishForm({ onAdd }) {
  const [newName, setNewName] = useState('');
  const [newPred, setNewPred] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onAdd(newName, newPred || 0);
    if (success) {
      setNewName(''); // Clear inputs on success
      setNewPred('');
    }
  };

  return (
    <form className="add-dish-form" onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="New Dish Name" 
        value={newName} 
        onChange={(e) => setNewName(e.target.value)} 
        required 
        className="add-input"
      />
      <input 
        type="number" 
        placeholder="Prediction" 
        value={newPred} 
        onChange={(e) => setNewPred(e.target.value)} 
        min="0"
        required 
        className="add-input add-number"
      />
      <button type="submit" className="add-btn">+ Add Dish</button>
    </form>
  );
}

// ---  The Admin Row Component ---
function AdminRow({ dish, onUpdate }) {
  const [pred, setPred] = useState(dish.predicted);

  useEffect(() => { setPred(dish.predicted); }, [dish.predicted]);

  return (
    
    <tr>
      <td className="dish-name-cell">{dish.name}</td>
      <td className="live-number">{dish.created}</td>
      <td>
        <div className="input-group">
          <input 
            type="number" 
            min="0"
            value={pred} 
            onChange={(e) => setPred(e.target.value)}
            className="admin-input"
          />
          <button 
            className="save-btn"
            onClick={() => onUpdate(dish._id, pred)}
            disabled={Number(pred) === dish.predicted} 
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}

