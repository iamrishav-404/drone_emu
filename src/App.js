
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Controller from './components/controller/Controller';
import Receiver from './components/receiver/Receiver';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>🚁 Drone Controller System</h1>
        <p>Choose your device type:</p>
        <div className="navigation-buttons">
          <Link to="/receiver" className="nav-button receiver-button">
            📺 PC/Receiver
            <span className="button-description">View and control the 3D drone simulation</span>
          </Link>
          <Link to="/controller" className="nav-button controller-button">
            🎮 Phone/Controller
            <span className="button-description">Virtual joysticks to control the drone</span>
          </Link>
        </div>
        <div className="info-section">
          <h3>How it works:</h3>
          <ul>
            <li><strong>PC/Receiver:</strong> Shows the 3D drone with physics simulation</li>
            <li><strong>Phone/Controller:</strong> Provides touch joysticks for drone control</li>
            <li><strong>WebSocket:</strong> Real-time communication between devices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/receiver" element={<Receiver />} />
          <Route path="/controller" element={<Controller />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
