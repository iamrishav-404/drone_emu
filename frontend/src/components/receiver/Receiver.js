import React, { useEffect, useRef, useState } from "react";
import MainScene from "../models/MainScene";
import { WebRTCConnection } from "../../utils/webrtcUtils";
import "./Receiver.css";
import { Icons } from "../../utils/Icons";

const Receiver = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneInfo, setSceneInfo] = useState(null);
  const [dronePosition, setDronePosition] = useState({ x: 0, y: 0, z: 0 });
  const [droneAttitude, setDroneAttitude] = useState({
    yaw: 0,
    pitch: 0,
    roll: 0,
  });
  const [droneSpeed, setDroneSpeed] = useState(0); // Total speed in m/s
  const [latency, setLatency] = useState("--");
  const [room, setRoom] = useState(() =>
    Math.random().toString(36).substr(2, 8)
  );
  const [droneLoaded, setDroneLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false); // True when both scene and drone are loaded
  const [cameraMode, setCameraMode] = useState("chase");
  const [showDetails, setShowDetails] = useState(false);
  const [powerStatus, setPowerStatus] = useState(false);

  // Connection popup states
  const [showConnectionPopup, setShowConnectionPopup] = useState(true);
  const [connectionStep, setConnectionStep] = useState("setup"); // 'setup', 'waiting', 'connecting'
  const [isConnected, setIsConnected] = useState(false);

  // WebRTC states
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [webrtcStatus, setWebrtcStatus] = useState("disconnected");
  const [connectionUrl, setConnectionUrl] = useState("");

  // Refs
  const webrtcRef = useRef(null);
  const qrCodeRef = useRef(null);
  const lastMsgTimeRef = useRef(0);
  const controlsRef = useRef({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });
  const lastReceivedPowerState = useRef(null); // Track power state changes
  const pingStartTimeRef = useRef(0);
  const latencyHistoryRef = useRef([]);
  const pingIntervalRef = useRef(null);

  // Debug logging for loading states
  useEffect(() => {
    console.log("Loading states:", { isLoaded, droneLoaded, sceneReady });
  }, [isLoaded, droneLoaded, sceneReady]);

  // Debug logging for connection states
  useEffect(() => {
    console.log("Connection states:", {
      isConnected,
      webrtcStatus,
      connectionStep,
    });
  }, [isConnected, webrtcStatus, connectionStep]);

  useEffect(() => {
    let interval = null;
    let droneInterval = null;

    if (containerRef.current && !sceneRef.current) {
      try {
        console.log("Initializing 3D scene...");
        sceneRef.current = new MainScene(containerRef.current);
        setIsLoaded(true); // Scene is created but not ready yet

        // Load drone model with proper error handling and state management
        const loadDroneAsync = async () => {
          try {
            console.log("Loading drone model...");
            const droneModel = await sceneRef.current.loadMainDrone();
            
            // Only update state if we actually got a drone model
            if (droneModel && sceneRef.current.droneModel) {
              console.log("Drone model loaded successfully!");
              setDroneLoaded(true);
              setSceneReady(true); // Now everything is ready!
            } else {
              console.warn("Drone model loading returned null - may already be loaded");
              // Check if drone is actually already loaded
              if (sceneRef.current.droneModel) {
                console.log("Drone was already loaded, updating state");
                setDroneLoaded(true);
                setSceneReady(true);
              } else {
                throw new Error("Failed to load drone model");
              }
            }
          } catch (error) {
            console.error("Drone loading failed:", error.message);
            // Don't show scene if drone failed to load - keep loading screen
            setDroneLoaded(false);
            setSceneReady(false);
            // Retry after 2 seconds
            setTimeout(() => {
              if (sceneRef.current && !sceneRef.current.droneModel) {
                console.log("Retrying drone load...");
                loadDroneAsync();
              }
            }, 2000);
          }
        };

        // Start loading drone immediately
        loadDroneAsync();

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
            const newVel = sceneRef.current.getDroneVelocity();
            setDronePosition(newPos);
            setDroneAttitude(newAtt);
            setDroneSpeed(newVel.total); // Update total speed
          }
        }, 100);
      } catch (error) {
        console.error("Failed to initialize Three.js scene:", error);
        setSceneReady(false);
        setDroneLoaded(false);
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
      if (webrtcRef.current) {
        webrtcRef.current.close();
      }
      
      // Cleanup latency monitoring
      stopLatencyMonitoring();
    };
  }, []);

  // Generate QR Code for WebRTC connection
  const generateQRCode = async () => {
    try {
      const baseUrl =
        process.env.REACT_APP_WEBHOOK_URL ||
        `http://${window.location.hostname}:3000`;
      const response = await fetch(`${baseUrl}/generate-qr/${room}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      const data = await response.json();

      setQrCodeImage(data.qr_code);
      setConnectionStep("waiting"); // Update connection step for popup
      setConnectionUrl(`${baseUrl}/controller?room=${room}`); // Set connection URL
      console.log("QR Code generated for room:", room);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    }
  };

  // Initialize WebRTC connection (PC as initiator)
  const initWebRTC = async () => {
    try {
      setWebrtcStatus("connecting");
      webrtcRef.current = new WebRTCConnection(true); // PC is initiator

      // Setup WebRTC callbacks
      webrtcRef.current.onConnectionStateChange = (state) => {
        setWebrtcStatus(state);
        if (state === "connected") {
          setLatency("--");
          setShowConnectionPopup(false); 
          setIsConnected(true);
          startLatencyMonitoring(); // Start ping-pong latency measurement
        } else if (state === "failed" || state === "disconnected") {
          setLatency("--");
          setIsConnected(false);
          setShowConnectionPopup(true);
          setConnectionStep("disconnected");
          stopLatencyMonitoring(); // Stop latency monitoring
          console.log("WebRTC connection lost:", state);
        } else if (state === "connecting") {
          setConnectionStep("connecting");
        }
      };

      webrtcRef.current.onDataChannelMessage = (data) => {
        handleControlData(data);
      };

      // Connect to signaling server - use same logic as backend for consistency
      const baseUrl =
        process.env.REACT_APP_WEBHOOK_URL ||
        `http://${window.location.hostname}:3000`;
      let wsUrl;
      if (baseUrl.startsWith("https://")) {
        wsUrl = baseUrl.replace("https://", "wss://");
      } else {
        wsUrl = baseUrl.replace("http://", "ws://");
      }
      console.log("Receiver connecting to:", wsUrl, "for room:", room);
      await webrtcRef.current.connectToSignalingServer(wsUrl, room);

      // Create WebRTC offer
      await webrtcRef.current.createOffer();

      console.log("WebRTC initialized, waiting for phone to connect...");
    } catch (error) {
      console.error("WebRTC initialization failed:", error);
      setWebrtcStatus("failed");
    }
  };

  // Latency monitoring functions
  const startLatencyMonitoring = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    // Send ping every 2 seconds
    pingIntervalRef.current = setInterval(() => {
      if (webrtcRef.current?.dataChannel?.readyState === 'open') {
        pingStartTimeRef.current = performance.now();
        webrtcRef.current.sendData({
          type: 'ping',
          timestamp: pingStartTimeRef.current
        });
      }
    }, 2000);
  };

  const stopLatencyMonitoring = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    latencyHistoryRef.current = [];
  };

  const updateLatency = (roundTripTime) => {
    // Keep last 5 latency measurements for averaging
    latencyHistoryRef.current.push(roundTripTime);
    if (latencyHistoryRef.current.length > 5) {
      latencyHistoryRef.current.shift();
    }
    
    // Calculate average latency
    const avgLatency = latencyHistoryRef.current.reduce((sum, val) => sum + val, 0) / latencyHistoryRef.current.length;
    setLatency(`${Math.round(avgLatency)}ms`);
  };

  // Handle control data from WebRTC
  const handleControlData = (data) => {
    // Handle ping-pong for latency measurement
    if (data.type === "pong") {
      const currentTime = performance.now();
      const roundTripTime = currentTime - data.timestamp;
      updateLatency(roundTripTime);
      return;
    }

    if (data.type === "control") {
      lastMsgTimeRef.current = Date.now();
      controlsRef.current = data.axes;

      // Update power status from phone and only log when it changes
      if (typeof data.power !== "undefined") {
        if (lastReceivedPowerState.current !== data.power) {
          console.log(
            "Received power state change:",
            data.power ? "ON" : "OFF"
          );
          lastReceivedPowerState.current = data.power;
        }
        setPowerStatus(data.power);
      }

      // Only update drone controls if power is ON
      if (sceneRef.current && droneLoaded && data.power) {
        sceneRef.current.updateControls(data.axes, performance.now(), true);
        // Only log occasionally when power is on
        if (Math.random() < 0.01) {
          console.log("Drone controls active - Power ON");
        }
      } else if (sceneRef.current && droneLoaded && data.power === false) {
        const zeroControls = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
        sceneRef.current.updateControls(zeroControls, performance.now(), false);
        // Only log when transitioning to OFF state
        if (lastReceivedPowerState.current === true) {
          console.log("Drone stopped - Power OFF");
        }
      }

      // Always update position and attitude for display (regardless of power state)
      if (sceneRef.current?.drone?.position) {
        const pos = sceneRef.current.drone.position;
        setDronePosition({ x: pos.x, y: pos.y, z: pos.z });
      }
      if (sceneRef.current?.drone?.rotation) {
        const rot = sceneRef.current.drone.rotation;
        setDroneAttitude({
          yaw: ((rot.y * 180) / Math.PI).toFixed(1),
          pitch: ((rot.x * 180) / Math.PI).toFixed(1),
          roll: ((rot.z * 180) / Math.PI).toFixed(1),
        });
      }
    }
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
    const newMode = cameraMode === "chase" ? "free" : "chase";
    setCameraMode(newMode);

    if (sceneRef.current) {
      sceneRef.current.setCameraMode(newMode);
      if (newMode === "free") {
        sceneRef.current.resetCamera();
      }
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="receiver-container">
      {/* Connection Popup */}
      {showConnectionPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <div className="popup-header">
              <h2>🚁 Drone Control Setup</h2>
            </div>
            <div className="popup-content">
              {connectionStep === "setup" && (
                <div className="setup-step">
                  <p>Connect your phone controller to this receiver:</p>
                  <button onClick={generateQRCode} className="generate-btn">
                    Generate QR Code
                  </button>
                </div>
              )}

              {connectionStep === "waiting" && (
                <div className="waiting-step">
                  <div className="qr-container">
                    {qrCodeImage && (
                      <img src={qrCodeImage} alt="Connection QR Code" />
                    )}
                  </div>
                  <p>Scan this QR code with your phone controller</p>
                  <p className="instruction-text">
                    After scanning, click "Start Connection" below to begin the
                    session
                  </p>
                  <div className="connection-actions">
                    <button
                      onClick={initWebRTC}
                      className="start-connection-btn"
                    >
                      Start Connection
                    </button>
                  </div>
                </div>
              )}

              {connectionStep === "connecting" && (
                <div className="connecting-step">
                  <div className="spinner"></div>
                  <p>Connecting to controller...</p>
                </div>
              )}

              {connectionStep === "disconnected" && (
                <div className="disconnected-step">
                  <div className="disconnected-icon">🔴</div>
                  <h3>Connection Lost</h3>
                  <p>The connection to your phone controller was lost.</p>
                  <div className="disconnection-reason">
                    <p>
                      <strong>Status:</strong> {webrtcStatus}
                    </p>
                  </div>
                  <div className="reconnection-actions">
                    <button
                      onClick={() => setConnectionStep("setup")}
                      className="reconnect-btn"
                    >
                      Setup New Connection
                    </button>
                    <button onClick={initWebRTC} className="retry-btn">
                      Retry Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3D Scene Canvas - Always present for initialization */}
      <div ref={containerRef} className="receiver-canvas" />

      {/* Loading Screen - Show while scene is loading */}
      {!sceneReady && (
        <div className="scene-loading-overlay">
          <div className="scene-loading-content">
            <div className="scene-loading-spinner"></div>
            <h3>🚁 Loading Drone Simulator</h3>
            <p>Preparing 3D scene and drone model...</p>
            <div className="loading-progress">
              <div className="progress-item">
                <span className={isLoaded ? "completed" : "loading"}>
                  {isLoaded ? "✓" : "⏳"} 3D Scene
                </span>
              </div>
              <div className="progress-item">
                <span className={droneLoaded ? "completed" : "loading"}>
                  {droneLoaded ? "✓" : "⏳"} Drone Model
                </span>
              </div>
            </div>
            
            {/* Show additional info if loading takes too long */}
            {isLoaded && !droneLoaded && (
              <div className="loading-details">
                <p>⚠️ Drone model is taking longer than expected to load...</p>
                <p>Please wait while we retry loading the 3D model.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Interface - only show when connected */}
      {isConnected && (
        <>
          {/* Top Blurry Navbar */}
          <div className="top-navbar">
            {/* Connection Status Indicator */}
            <div className="navbar-section connection-section">
              <span className={`connection-indicator ${webrtcStatus}`}>
                {webrtcStatus === "connected"
                  ? "🟢"
                  : webrtcStatus === "connecting"
                  ? "🟡"
                  : webrtcStatus === "waiting"
                  ? "🟠"
                  : "🔴"}
                {webrtcStatus === "connected"
                  ? "Connected"
                  : webrtcStatus === "connecting"
                  ? "Connecting..."
                  : webrtcStatus === "waiting"
                  ? "Ready"
                  : "Disconnected"}
              </span>
            </div>

            {/* Power Switch Status */}
            <div className="navbar-section power-section">
              <div className={`navbar-power-button ${powerStatus ? "power-on" : "power-off"}`}>
                <div className={`power-ring ${powerStatus ? "ring-active" : ""}`}></div>
                <div className="power-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="currentColor"
                    className="bi bi-power"
                    viewBox="0 0 16 16"
                  >
                    <path d="M7.5 1v7h1V1z" />
                    <path d="M3 8.812a5 5 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Drone Position */}
            <div className="navbar-section position-section">
                {Icons.getLocationIcon(24, 24,"#ffffffff")}
              <span className="position-info">
               {/* X:{dronePosition.x.toFixed(1)} Y:{dronePosition.y.toFixed(1)} Z:{dronePosition.z.toFixed(1)} */}
                &nbsp;{dronePosition.x.toFixed(1)}, {dronePosition.y.toFixed(1)}, {dronePosition.z.toFixed(1)}
              </span>
            </div>

            {/* Drone Speed */}
            <div className="navbar-section speed-section">
              {Icons.getSpeedIcon(20, 20, "#ffffffff")}
              <span className="speed-info">
                &nbsp;{droneSpeed.toFixed(1)} m/s
              </span>
            </div>

           

            {/* Controller Controls Data */}
            <div className="navbar-section controls-section">
              {Icons.getControllerIcon(24, 24, "#ffffffff")}
              <span className="controls-info">
                {controlsRef.current && (
                  <>
                   &nbsp; T:{controlsRef.current.throttle?.toFixed(2) || "0.00"} 
                    , Y:{controlsRef.current.yaw?.toFixed(2) || "0.00"} 
                    , P:{controlsRef.current.pitch?.toFixed(2) || "0.00"} 
                    , R:{controlsRef.current.roll?.toFixed(2) || "0.00"}
                    {performance.now() - lastMsgTimeRef.current > 500 ? " (STALE)" : ""}
                  </>
                )}
              </span>
            </div>

            {/* Camera Toggle Button */}
            <div className="navbar-section camera-section">
              <button
                onClick={toggleCameraMode}
                className={`camera-mode-btn ${cameraMode}`}
                disabled={!sceneReady}
                title={`Switch to ${cameraMode === "chase" ? "Free" : "Chase"} Camera`}
              >
                {Icons.getCameraIcon(24, 24, "#79c2ebff")}
                {cameraMode === "chase" ? "Chase" : "Free"}
              </button>
            </div>
          </div>

          {/* Latency Display - Bottom Left */}
          <div className="latency-display">
            <span className="latency-info">
              {Icons.getSignalIcon(16, 16, "#79c2ebff")}
              {latency}
            </span>
          </div>

          {/* Additional Controls (Hidden for now) */}
          <div style={{ display: 'none' }}>
            <button onClick={handleResetCamera} className="control-button">
              🔄 Reset Camera
            </button>
            {/* <button onClick={handleChangeBackground} className="control-button">
              🎨 Change Background
            </button> */}
          </div>
        </>
      )}
    </div>
  );
};

export default Receiver;
