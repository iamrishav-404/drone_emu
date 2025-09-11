
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Controller from './components/controller/Controller';
import Receiver from './components/receiver/Receiver';
import { Icons } from './utils/Icons';

function Home() {
  return (
    <div className="landing-page">
      {/* Animated Background Elements */}
      <div className="floating-elements">
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
        <div className="cloud cloud-3">☁️</div>
        <div className="sparkle sparkle-1">✨</div>
        <div className="sparkle sparkle-2">⭐</div>
        <div className="sparkle sparkle-3">✨</div>
      </div>

      {/* Main Content */}
      <div className="hero-section">
        {/* Central Drone Animation */}
        <div className="drone-hero">
          <div className="drone-body">
            {Icons.getDroneIcon(120, 120, "#3B82F6")}
          </div>
          <div className="drone-shadow"></div>
        </div>

        {/* Game Title */}
        <h1 className="game-title">
          <span className="title-word">Drone</span>
          <span className="title-word">Flight</span>
          <span className="title-word">Simulator</span>
        </h1>

        {/* Subtitle */}
        <p className="game-subtitle">
          Transform your devices into an epic drone experience
        </p>

        {/* Connection Visualization */}
        <div className="connection-flow">
          <div className="device phone-device">
            📱
            <span>Controller</span>
            <div className="signal signal-phone"></div>
          </div>
          
          <div className="wifi-connection">
            <div className="wifi-waves">
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
            </div>
            <div className="wifi-icon">
              {Icons.getSignalIcon(32, 32, "#4ADE80")}
            </div>
          </div>
          
          <div className="device pc-device">
            🖥️
            <span>Receiver</span>
            <div className="signal signal-pc"></div>
          </div>
        </div>

        {/* Choice Buttons */}
        <div className="role-selection">
          <Link to="/controller" className="role-button controller-role">
            <div className="button-icon">🎮</div>
            <div className="button-content">
              <h3>I'm the Controller</h3>
              <p>Use my phone as joystick</p>
            </div>
            <div className="button-glow controller-glow"></div>
          </Link>

          <Link to="/receiver" className="role-button receiver-role">
            <div className="button-icon">
              {Icons.getCameraDroneIcon(96, 96, "#A78BFA")}
            </div>
            <div className="button-content">
              <h3>I'm the Receiver</h3>
              <p>Show 3D simulation on PC</p>
            </div>
            <div className="button-glow receiver-glow"></div>
          </Link>
        </div>

        {/* Fun Notice */}
        <div className="network-notice">
          <div className="notice-icon">🌐</div>
          <div className="notice-text">
            <strong>Pro Tip:</strong> Use the same Wi-Fi network for ultra-low latency gameplay!
          </div>
        </div>

        {/* How to Play Section */}
        <div className="how-to-play">
          <h3 className="section-title">🎮 How to Play</h3>
          <div className="play-steps">
            <div className="play-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Choose your role</strong>
                <p>Select Controller (phone) or Receiver (PC)</p>
              </div>
            </div>
            <div className="play-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Connect devices</strong>
                <p>Ensure both are on the same Wi-Fi network</p>
              </div>
            </div>
            <div className="play-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <strong>Scan QR code</strong>
                <p>Link your phone controller to PC receiver</p>
              </div>
            </div>
            <div className="play-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <strong>Take flight!</strong>
                <p>Use touch joysticks to control your drone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="decorative-paths">
        <svg className="flight-path" viewBox="0 0 300 200">
          <path 
            d="M50,150 Q100,50 150,100 T250,80" 
            stroke="rgba(74, 222, 128, 0.3)" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="5,5"
          />
        </svg>
        <svg className="flight-path path-2" viewBox="0 0 300 200">
          <path 
            d="M250,50 Q200,150 150,100 T50,120" 
            stroke="rgba(167, 139, 250, 0.3)" 
            strokeWidth="2" 
            fill="none"
            strokeDasharray="8,3"
          />
        </svg>
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
