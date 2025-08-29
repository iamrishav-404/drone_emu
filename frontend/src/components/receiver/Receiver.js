
import React, { useEffect, useRef, useState } from 'react';
import MainScene from '../models/MainScene';
import { WebRTCConnection } from '../../utils/webrtcUtils';
import './Receiver.css';

const Receiver = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneInfo, setSceneInfo] = useState(null);
  const [dronePosition, setDronePosition] = useState({ x: 0, y: 0, z: 0 });
  const [droneAttitude, setDroneAttitude] = useState({ yaw: 0, pitch: 0, roll: 0 });
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [latency, setLatency] = useState('--');
  const [wsUrl, setWsUrl] = useState('');
  const [room, setRoom] = useState(() => Math.random().toString(36).substr(2, 8));
  const [droneLoaded, setDroneLoaded] = useState(false); 
  const [cameraMode, setCameraMode] = useState('chase'); 
  const [showDetails, setShowDetails] = useState(false); // Toggle for details panel 
  
  // WebRTC states
  const [connectionType, setConnectionType] = useState('websocket'); // 'websocket' or 'webrtc'
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [webrtcStatus, setWebrtcStatus] = useState('disconnected');
  
  // WebSocket refs
  const socketRef = useRef(null);
  const webrtcRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const pingStartTimeRef = useRef(0);
  const latencyHistoryRef = useRef([]);
  const lastMsgTimeRef = useRef(0);
  const controlsRef = useRef({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });


  useEffect(() => {
    // Set WebSocket URL based on environment
    const baseUrl = process.env.REACT_APP_WEBHOOK_URL || `http://${window.location.hostname}:3000`;
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    setWsUrl(wsUrl);
  }, []);

  useEffect(() => {
    let interval = null;
    let droneInterval = null;

    if (containerRef.current && !sceneRef.current) {
      try {
        sceneRef.current = new MainScene(containerRef.current);
        setIsLoaded(true);
        
        setTimeout(async () => {
          if (!droneLoaded) { 
            try {
              console.log('Auto-loading drone model...');
              await sceneRef.current.loadMainDrone();
              setDroneLoaded(true);
              console.log('Drone model auto-loaded successfully!');

           // console.log("mic check please ... , disabling the drone model currently")
            } catch (error) {
              console.warn('Auto-load failed, model can be loaded manually:', error.message);
            }
          }
        }, 1000);
        
        // Update scene info every 2 seconds
        interval = setInterval(() => {
          if (sceneRef.current) {
            setSceneInfo(sceneRef.current.exportScene());
          }
        }, 2000);

        // Update drone position more frequently (every 100ms for smooth display)
        droneInterval = setInterval(() => {
          if (sceneRef.current && sceneRef.current.getDronePosition) {
            const newPos = sceneRef.current.getDronePosition();
            const newAtt = sceneRef.current.getDroneAttitude();
            setDronePosition(newPos);
            setDroneAttitude(newAtt);
          }
        }, 100);

      } catch (error) {
        console.error('Failed to initialize Three.js scene:', error);
      }
    }

    // Cleanup function that runs when component unmounts or dependencies change
    return () => {
      if (interval) clearInterval(interval);
      if (droneInterval) clearInterval(droneInterval);
      
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  // Generate QR Code for WebRTC connection
  const generateQRCode = async () => {
    try {
      const baseUrl = process.env.REACT_APP_WEBHOOK_URL || `http://${window.location.hostname}:3000`;
      const response = await fetch(`${baseUrl}/generate-qr/${room}`);
      const data = await response.json();
      
      setQrCodeImage(data.qr_code);
      setShowQrCode(true);
      console.log('QR Code generated for room:', room);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  // Initialize WebRTC connection (PC as initiator)
  const initWebRTC = async () => {
    try {
      setWebrtcStatus('connecting');
      webrtcRef.current = new WebRTCConnection(true); // PC is initiator
      
      // Setup WebRTC callbacks
      webrtcRef.current.onConnectionStateChange = (state) => {
        setWebrtcStatus(state);
        if (state === 'connected') {
          setConnectionType('webrtc');
          setLatency('~20ms'); // WebRTC typical latency
        }
      };
      
      webrtcRef.current.onDataChannelMessage = (data) => {
        handleControlData(data);
      };
      
      // Connect to signaling server
      await webrtcRef.current.connectToSignalingServer(wsUrl, room);
      
      // Create WebRTC offer
      await webrtcRef.current.createOffer();
      
      console.log('WebRTC initialized, waiting for phone to connect...');
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      setWebrtcStatus('failed');
    }
  };

  // Handle control data from WebRTC or WebSocket
  const handleControlData = (data) => {
    if (data.type === 'control') {
      lastMsgTimeRef.current = Date.now();
      controlsRef.current = data.axes;
      
      if (sceneRef.current && droneLoaded) {
        sceneRef.current.updateControls(data.axes);
      }
      
      // Update position and attitude for display
      if (sceneRef.current?.drone?.position) {
        const pos = sceneRef.current.drone.position;
        setDronePosition({ x: pos.x, y: pos.y, z: pos.z });
      }
      if (sceneRef.current?.drone?.rotation) {
        const rot = sceneRef.current.drone.rotation;
        setDroneAttitude({ 
          yaw: (rot.y * 180 / Math.PI).toFixed(1), 
          pitch: (rot.x * 180 / Math.PI).toFixed(1), 
          roll: (rot.z * 180 / Math.PI).toFixed(1) 
        });
      }
    }
  };

  const connectWS = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
    
    socketRef.current = new WebSocket(wsUrl);
    
    socketRef.current.onopen = () => {
      setWsStatus('connected');
      socketRef.current.send(JSON.stringify({ 
        type: 'hello', 
        role: 'receiver', 
        room 
      }));
      
      // Start ping measurements every 2 seconds
      pingIntervalRef.current = setInterval(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          pingStartTimeRef.current = performance.now();
          socketRef.current.send(JSON.stringify({ 
            type: 'ping', 
            timestamp: pingStartTimeRef.current 
          }));
        }
      }, 2000);
    };
    
    socketRef.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      
      // Handle pong response for RTT measurement
      if (msg.type === 'pong' && msg.timestamp === pingStartTimeRef.current) {
        const rtt = performance.now() - pingStartTimeRef.current;
        const latencyMs = rtt / 2; // Half of round-trip time
        
        latencyHistoryRef.current.push(latencyMs);
        if (latencyHistoryRef.current.length > 10) latencyHistoryRef.current.shift();
        const avgLatency = latencyHistoryRef.current.reduce((a,b) => a+b, 0) / latencyHistoryRef.current.length;
        
        setLatency(`${latencyMs.toFixed(1)}ms (avg: ${avgLatency.toFixed(1)}ms)`);
      }
      
      // Handle control messages using the unified handler
      if (msg.type === 'control' && msg.room === room) {
        handleControlData(msg);
      }
    };
    
    socketRef.current.onclose = () => {
      setWsStatus('disconnected');
      setLatency('--ms');
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
    
    socketRef.current.onerror = () => {
      setWsStatus('error');
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  };

  const handleResetCamera = () => {
    if (sceneRef.current) {
      sceneRef.current.resetCamera();
    }
  };

  const handleChangeBackground = () => {
    if (sceneRef.current) {
      const colors = [0x0a0f16, 0x1a1a2e, 0x16213e, 0x0f0e17, 0x000000];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      sceneRef.current.setBackgroundColor(randomColor);
    }
  };

  const toggleCameraMode = () => {
    const newMode = cameraMode === 'chase' ? 'free' : 'chase';
    setCameraMode(newMode);
    
    if (sceneRef.current) {
      sceneRef.current.setCameraMode(newMode);
      if (newMode === 'free') {
        sceneRef.current.resetCamera();
      }
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const getStatusClass = () => {
    switch (wsStatus) {
      case 'connected': return 'status-connected';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  };

  return (
    <div className="receiver-container">
      <div className="camera-toggle">
        <button 
          onClick={toggleCameraMode}
          className={`camera-mode-btn ${cameraMode}`}
          disabled={!isLoaded}
          title={`Switch to ${cameraMode === 'chase' ? 'Free' : 'Chase'} Camera`}
        >
          📹 {cameraMode === 'chase' ? 'Chase Cam' : 'Free Cam'}
        </button>
      </div>

      <div 
        ref={containerRef} 
        className="receiver-canvas"
      />
      
      {/* WebSocket Connection UI */}
      <div className="receiver-controls">
        <div className="connection-panel">
          <label>WS:</label>
          <input 
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            size="28"
          />
          <label>Room:</label>
          <input 
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            size="4"
          />
          <button onClick={connectWS}>Connect</button>
          <span className={getStatusClass()}>{wsStatus}</span>
          <div className="latency-info">Latency: {latency}</div>
          <div className="controls-info">
            {controlsRef.current && (
              <>
                thr:{controlsRef.current.throttle?.toFixed(2) || '0.00'} 
                yaw:{controlsRef.current.yaw?.toFixed(2) || '0.00'} 
                pitch:{controlsRef.current.pitch?.toFixed(2) || '0.00'} 
                roll:{controlsRef.current.roll?.toFixed(2) || '0.00'}
                {(performance.now() - lastMsgTimeRef.current) > 500 ? ' (STALE)' : ''}
              </>
            )}
          </div>
        </div>

        {/* WebRTC Connection Panel */}
        <div className="webrtc-panel">
          <div className="connection-type-toggle">
            <button 
              onClick={() => setConnectionType(connectionType === 'websocket' ? 'webrtc' : 'websocket')}
              className={`connection-type-btn ${connectionType}`}
            >
              🔄 {connectionType === 'websocket' ? 'Switch to WebRTC' : 'Switch to WebSocket'}
            </button>
          </div>
          
          {connectionType === 'webrtc' && (
            <div className="webrtc-controls">
              <button onClick={generateQRCode} disabled={!isLoaded}>
                📱 Generate QR Code
              </button>
              <button onClick={initWebRTC} disabled={!isLoaded}>
                🚀 Start WebRTC
              </button>
              <span className={`webrtc-status ${webrtcStatus}`}>
                WebRTC: {webrtcStatus}
              </span>
            </div>
          )}

          {/* QR Code Display */}
          {showQrCode && qrCodeImage && (
            <div className="qr-code-display">
              <h3>📱 Scan with Phone Controller:</h3>
              <img src={qrCodeImage} alt="QR Code for WebRTC connection" />
              <p>Room: {room} | WebRTC P2P Connection</p>
              <button onClick={() => setShowQrCode(false)}>Hide QR Code</button>
            </div>
          )}
        </div>

        {/* More Details Toggle */}
        <div className="details-toggle">
          <button 
            onClick={toggleDetails}
            className="details-toggle-btn"
            title={showDetails ? 'Hide Details' : 'Show More Details'}
          >
            <span className={`arrow ${showDetails ? 'up' : 'down'}`}>▼</span>
            More Details
          </button>
        </div>

        {/* Collapsible Details Section */}
        {showDetails && (
          <>
            {/* Drone Position Display */}
            <div className="drone-position-panel">
              <strong>🚁 Drone Position (relative to ground center):</strong><br/>
              <div className="position-grid">
                <div className="position-item">
                  <span className="position-label">X:</span>
                  <span className="position-value">{dronePosition.x.toFixed(2)}m</span>
                </div>
                <div className="position-item">
                  <span className="position-label">Y:</span>
                  <span className="position-value">{dronePosition.y.toFixed(2)}m</span>
                </div>
                <div className="position-item">
                  <span className="position-label">Z:</span>
                  <span className="position-value">{dronePosition.z.toFixed(2)}m</span>
                </div>
              </div>
              <div className="attitude-grid">
                <div className="attitude-item">
                  <span className="attitude-label">Yaw:</span>
                  <span className="attitude-value">{droneAttitude.yaw.toFixed(1)}°</span>
                </div>
                <div className="attitude-item">
                  <span className="attitude-label">Pitch:</span>
                  <span className="attitude-value">{droneAttitude.pitch.toFixed(1)}°</span>
                </div>
                <div className="attitude-item">
                  <span className="attitude-label">Roll:</span>
                  <span className="attitude-value">{droneAttitude.roll.toFixed(1)}°</span>
                </div>
              </div>
            </div>
             
            {sceneInfo && (
              <div className="scene-info">
                Camera: ({sceneInfo.camera.position.x.toFixed(1)}, {sceneInfo.camera.position.y.toFixed(1)}, {sceneInfo.camera.position.z.toFixed(1)})<br/>
              </div>
            )}
            
            <div className="controls-buttons">
              <button 
                onClick={handleResetCamera}
                className="control-button"
                disabled={!isLoaded}
              >
                 Reset Camera
              </button>
              
              <button 
                onClick={handleChangeBackground}
                className="control-button"
                disabled={!isLoaded}
              >
                Change Background
              </button>
            </div>
          </>
        )}
      </div>

      {/* Performance Info */}
      <div className="performance-info">
        {sceneInfo && (
          <div className="fps-info">
            FPS: ~60 | Calls: {sceneInfo.performance.render.calls}
          </div>
        )}
      </div>
    </div>
  );
};

export default Receiver;
