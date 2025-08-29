
import React, { useEffect, useRef, useState } from 'react';
import './Controller.css';
import './QRScanner.css';
import { buildWebSocketURL } from '../../utils/networkUtils';
import { WebRTCConnection, parseConnectionInfo } from '../../utils/webrtcUtils';
import QRScanner from './QRScanner';

const Controller = () => {
  const [status, setStatus] = useState('disconnected');
  const [wsUrl, setWsUrl] = useState('');
  const [room, setRoom] = useState('A');
  const [axes, setAxes] = useState({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });
  
  // WebRTC state
  const [connectionType, setConnectionType] = useState('websocket'); // 'websocket' or 'webrtc'
  const [webrtcStatus, setWebrtcStatus] = useState('disconnected');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrScanResult, setQrScanResult] = useState(null);
  
  const socketRef = useRef(null);
  const webrtcRef = useRef(null);
  const padLeftRef = useRef(null);
  const stickLeftRef = useRef(null);
  const padRightRef = useRef(null);
  const stickRightRef = useRef(null);
  const axesRef = useRef({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initialize with dynamic IP detection
    const initializeWebSocketURL = async () => {
      try {
        const dynamicWsUrl = await buildWebSocketURL(3000);
        setWsUrl(dynamicWsUrl);
        console.log('Dynamic WebSocket URL initialized:', dynamicWsUrl);
      } catch (error) {
        console.error('Failed to initialize dynamic WebSocket URL, falling back to localhost:', error);
        setWsUrl('ws://localhost:3000');
      }
    };
    
    initializeWebSocketURL();
    
    if (padLeftRef.current && stickLeftRef.current) {
      makePad(padLeftRef.current, stickLeftRef.current, (nx, ny) => {
        const dead = 0.05;
        const dz = v => Math.abs(v) < dead ? 0 : v;
        // Left stick: X = Throttle (up/down), Y = Yaw (rotation)
        axesRef.current.throttle = Math.max(0, Math.min(1, 0.5 + (nx * 0.5))); 
        axesRef.current.yaw = dz(ny); 
        setAxes(prev => ({ ...prev, yaw: axesRef.current.yaw, throttle: axesRef.current.throttle }));
      });
    }
    
    if (padRightRef.current && stickRightRef.current) {
      makePad(padRightRef.current, stickRightRef.current, (nx, ny) => {
        const dead = 0.05;
        const dz = v => Math.abs(v) < dead ? 0 : v;
        // Right stick: X = Pitch (forward/backward), Y = Roll (left/right)
        axesRef.current.pitch = dz(nx); 
        axesRef.current.roll = dz(-ny); 
        setAxes(prev => ({ ...prev, roll: axesRef.current.roll, pitch: axesRef.current.pitch }));
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const makePad = (padEl, stickEl, onMove) => {
    const rect = () => padEl.getBoundingClientRect();
    let activeId = null;
    let isActive = false;
    
    // Add realistic spring-back animation
    const springBack = (targetX = 0, targetY = 0, duration = 200) => {
      const startTime = performance.now();
      const currentRect = stickEl.getBoundingClientRect();
      const padRect = rect();
      const startX = (currentRect.left + 45 - padRect.left - padRect.width/2) / (Math.min(padRect.width, padRect.height)/2 - 45);
      const startY = (currentRect.top + 45 - padRect.top - padRect.height/2) / (Math.min(padRect.width, padRect.height)/2 - 45);
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for spring-like behavior
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentX = startX + (targetX - startX) * easeOut;
        const currentY = startY + (targetY - startY) * easeOut;
        
        setStick(currentX, currentY);
        onMove(currentX, currentY);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };

    function setStick(nX, nY) {
      const r = rect();
      const cx = r.width/2, cy = r.height/2;
      const maxR = Math.min(cx, cy) - 45;
      const px = cx + nX * maxR - 45; // Adjusted for new stick size
      const py = cy + nY * maxR - 45;
      stickEl.style.left = px + 'px';
      stickEl.style.top = py + 'px';
      
      // Add visual feedback based on stick position
      const intensity = Math.min(Math.hypot(nX, nY), 1);
      stickEl.style.transform = `scale(${0.98 + intensity * 0.04}) translateZ(${intensity * 2}px)`;
    }

    function handle(e) {
      const p = e.changedTouches ? e.changedTouches[0] : e;
      if (activeId !== null && e.changedTouches && p.identifier !== activeId) return;
      
      // Add haptic feedback on touch (if supported)
      if (navigator.vibrate && e.type === 'touchstart') {
        navigator.vibrate(10);
      }
      
      const r = rect();
      const x = (p.clientX - r.left) - r.width/2;
      const y = (p.clientY - r.top) - r.height/2;
      const max = Math.min(r.width, r.height)/2 - 45; // Adjusted for new stick size
      let nX = x / max, nY = y / max;
      const len = Math.hypot(nX, nY);
      
      // Smooth circular boundary with slight resistance near edge
      if (len > 1) { 
        const resistance = 0.95; // Slightly inside the boundary
        nX = (nX / len) * resistance; 
        nY = (nY / len) * resistance; 
      }
      
      // Apply deadzone smoothing
      const deadzone = 0.08;
      const adjustedLen = Math.max(0, len - deadzone) / (1 - deadzone);
      if (len > deadzone) {
        const factor = adjustedLen / len;
        nX *= factor;
        nY *= factor;
      } else {
        nX = 0;
        nY = 0;
      }
      
      onMove(nX, nY);
      setStick(nX, nY);
    }

    function reset() {
      isActive = false;
      activeId = null;
      
      // Add haptic feedback on release (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }
      
      // Smooth spring-back to center
      springBack(0, 0);
    }

    // Enhanced event handlers with better touch support
    padEl.addEventListener('pointerdown', (e) => {
      if (!isActive) {
        isActive = true;
        activeId = 'pointer';
        padEl.setPointerCapture(e.pointerId);
        stickEl.style.cursor = 'grabbing';
        handle(e);
      }
    });
    
    padEl.addEventListener('pointermove', (e) => {
      if (activeId === 'pointer') handle(e);
    });
    
    padEl.addEventListener('pointerup', (e) => {
      if (activeId === 'pointer') {
        stickEl.style.cursor = 'grab';
        reset();
      }
    });
    
    padEl.addEventListener('pointercancel', (e) => {
      if (activeId === 'pointer') {
        stickEl.style.cursor = 'grab';
        reset();
      }
    });

    // Touch events for mobile
    padEl.addEventListener('touchstart', (e) => { 
      if (!isActive) {
        isActive = true;
        activeId = e.changedTouches[0].identifier;
        handle(e);
      }
    }, {passive: false});
    
    padEl.addEventListener('touchmove', (e) => { 
      if (activeId !== null) {
        e.preventDefault();
        handle(e);
      }
    }, {passive: false});
    
    padEl.addEventListener('touchend', (e) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === activeId);
      if (touch) {
        reset();
      }
    });
    
    padEl.addEventListener('touchcancel', reset);
  };

  // QR Code Scanner (simple text input for now, can be upgraded to camera later)
  const handleQrCodeInput = async (qrText) => {
    try {
      const connectionInfo = parseConnectionInfo(qrText);
      if (connectionInfo) {
        setQrScanResult(connectionInfo);
        setRoom(connectionInfo.room);
        setConnectionType('webrtc');
        setShowQrScanner(false); // Close QR scanner
        console.log('Valid QR code scanned:', connectionInfo);
        
        // Auto-initiate WebRTC connection
        console.log('Auto-initiating WebRTC connection...');
        await initWebRTCWithConnectionInfo(connectionInfo);
      } else {
        alert('Invalid QR code format');
      }
    } catch (error) {
      console.error('QR code parsing error:', error);
      alert('Failed to parse QR code');
    }
  };

  // Initialize WebRTC connection with connection info
  const initWebRTCWithConnectionInfo = async (connectionInfo) => {
    try {
      setWebrtcStatus('connecting');
      console.log('Initializing WebRTC with info:', connectionInfo);
      
      webrtcRef.current = new WebRTCConnection(false); // Phone is not initiator
      
      // Setup WebRTC callbacks
      webrtcRef.current.onConnectionStateChange = (state) => {
        console.log('WebRTC state changed:', state);
        setWebrtcStatus(state);
        if (state === 'connected') {
          setStatus('connected');
          startSendingControls();
        }
      };
      
      webrtcRef.current.onDataChannelMessage = (message) => {
        console.log('Received message from PC:', message);
      };
      
      // Connect to signaling server
      console.log('Connecting to signaling server:', connectionInfo.websocket_url, connectionInfo.room);
      await webrtcRef.current.connectToSignalingServer(connectionInfo.websocket_url, connectionInfo.room);
      
      console.log('WebRTC controller initialized, waiting for PC connection...');
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      setWebrtcStatus('failed');
      alert('WebRTC connection failed: ' + error.message);
    }
  };

  // Initialize WebRTC connection (Phone as controller)
  const initWebRTC = async () => {
    if (!qrScanResult) {
      alert('Please scan a QR code first');
      return;
    }

    try {
      setWebrtcStatus('connecting');
      webrtcRef.current = new WebRTCConnection(false); // Phone is not initiator
      
      // Setup WebRTC callbacks
      webrtcRef.current.onConnectionStateChange = (state) => {
        setWebrtcStatus(state);
        if (state === 'connected') {
          setStatus('connected');
          startSendingControls();
        }
      };
      
      // Connect to signaling server
      await webrtcRef.current.connectToSignalingServer(qrScanResult.websocket_url, qrScanResult.room);
      
      console.log('WebRTC controller initialized, waiting for PC connection...');
    } catch (error) {
      console.error('WebRTC initialization failed:', error);
      setWebrtcStatus('failed');
    }
  };

  // Send control data over WebRTC or WebSocket
  const sendControlData = () => {
    const controlData = {
      type: 'control',
      room,
      axes: axesRef.current
    };

    if (connectionType === 'webrtc' && webrtcRef.current) {
      const sent = webrtcRef.current.sendData(controlData);
      if (!sent) {
        console.warn('WebRTC data channel not ready, data not sent');
      }
    } else if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(controlData));
    }
  };

  // Start sending control data at 30Hz
  const startSendingControls = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      sendControlData();
    }, 33); // ~30 FPS
  };

  const connect = async () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
    
    try {
      const dynamicWsUrl = await buildWebSocketURL(3000);
      console.log('Attempting to connect to:', dynamicWsUrl);
      setStatus('connecting');
      
      socketRef.current = new WebSocket(dynamicWsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected successfully to:', dynamicWsUrl);
        setStatus('connected');
        setConnectionType('websocket');
        socketRef.current.send(JSON.stringify({ 
          type: 'hello', 
          role: 'controller', 
          room 
        }));
        
        // Start sending controls using unified function
        startSendingControls();
      };
    } catch (error) {
      console.error('Failed to get dynamic WebSocket URL:', error);
      setStatus('error');
    }
    
    socketRef.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      console.log('Received message:', msg);

      if (msg.type === 'ping') {
        socketRef.current.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: msg.timestamp 
        }));
      }
    };
    
    socketRef.current.onclose = (e) => {
      console.log('WebSocket closed:', e.code, e.reason);
      setStatus('disconnected');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
    };
  };

  const getStatusClass = () => {
    switch (status) {
      case 'connected': return 'status-connected';
      case 'connecting': return 'status-connecting';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  };

  return (
    <div className="controller">
      <div className="bar">
        <div className="power-section">
          <div className="power-button"></div>
        </div>
        
        <div className="controls-section">
          <label>WS:</label>
          <input 
            value={wsUrl}
            onChange={(e) => setWsUrl(e.target.value)}
            size="20" 
          />
          <label>Room:</label>
          <input 
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            size="4" 
          />
          <button onClick={connect}>Connect WS</button>
        </div>

        {/* WebRTC Controls */}
        <div className="webrtc-section">
          <div className="connection-type-toggle">
            <button 
              onClick={() => setConnectionType(connectionType === 'websocket' ? 'webrtc' : 'websocket')}
              className={`connection-type-btn ${connectionType}`}
            >
              {connectionType === 'websocket' ? '📡→🔗' : '🔗→📡'}
            </button>
          </div>
          
          {connectionType === 'webrtc' && (
            <div className="webrtc-controls">
              <button 
                onClick={() => setShowQrScanner(!showQrScanner)}
                className="qr-scan-btn"
              >
                📱 {showQrScanner ? 'Hide' : 'Scan QR'}
              </button>
              
              {qrScanResult && (
                <button onClick={initWebRTC} className="webrtc-connect-btn">
                  🚀 Connect P2P
                </button>
              )}
              
              <span className={`webrtc-status ${webrtcStatus}`}>
                {webrtcStatus}
              </span>
            </div>
          )}
        </div>
        
        <span id="status" className={getStatusClass()}>{status}</span>
      </div>

      <div className="row">
        <div className="joystick-section">
          <div className="joystick-container">
            <div className="joystick-label-left">Throttle / Yaw</div>
            <div className="pad" ref={padLeftRef}>
              <div className="stick" ref={stickLeftRef}></div>
            </div>
          </div>
          
          <div className="joystick-container">
            <div className="pad" ref={padRightRef}>
              <div className="stick" ref={stickRightRef}></div>
            </div>
            <div className="joystick-label-right">Pitch / Roll</div>
          </div>
        </div>

      </div>

      {/* QR Code Scanner with camera functionality */}
      <QRScanner
        isOpen={showQrScanner}
        onScan={handleQrCodeInput}
        onClose={() => setShowQrScanner(false)}
      />
    </div>
  );
};

export default Controller;
