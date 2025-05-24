// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreatePage from './pages/CreatePage';
import './App.css'; // Keep or modify App.css as needed

function App() {
  return (
    <Router>
      <div>
        <nav style={{ padding: '10px', background: '#f0f0f0', marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
          <Link to="/create">Create String Art</Link>
        </nav>
        <Routes>
          <Route path="/create" element={<CreatePage />} />
          <Route path="/" element={
            <div style={{textAlign: 'center', marginTop: '50px'}}>
              <h1>String Art Generator</h1>
              <p>Navigate to the <Link to="/create">Create Page</Link> to start.</p>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
