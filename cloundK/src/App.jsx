import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Ordersimulate from './customer';
import KitchenDisplay from './chef';
import AdminDashboard from './admin';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '20px', backgroundColor: '#2c3e50' }}>
        <Link to="/simulator" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
          Customer Simulator
        </Link>
        <Link to="/kitchen" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', marginLeft: '20px' }}>
          Kitchen Display
        </Link>
        <Link to="/admin" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', marginLeft: '20px' }}>
          Admin Dashboard
        </Link>
      </nav>
      
      <Routes>
        
        <Route path="/simulator" element={<Ordersimulate />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;