import React, { useEffect, useRef, useState } from "react";
import "./Controller.css";
import "./QRScanner.css";
import { WebRTCConnection, parseConnectionInfo } from "../../utils/webrtcUtils";
import QRScanner from "./QRScanner";

const Controller = () => {
  const [axes, setAxes] = useState({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });

  // Browser compatibility detection
  const isNonChromiumBrowser = () => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg\//.test(navigator.userAgent);
    const isOpera = /OPR\//.test(navigator.userAgent);
    const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
    
    // Return true if it's NOT a Chromium-based browser
    return !(isChrome || isEdge || isOpera || isBrave);
  };

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [webrtcStatus, setWebrtcStatus] = useState("disconnected");
  const [showConnectionPopup, setShowConnectionPopup] = useState(true);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [connectionStep, setConnectionStep] = useState("scanning"); // 'scanning', 'connecting', 'landscape'
  const [hasEverConnected, setHasEverConnected] = useState(false); 
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );
  const [isPowerOn, setIsPowerOn] = useState(false);

  const webrtcRef = useRef(null);
  const padLeftRef = useRef(null);
  const stickLeftRef = useRef(null);
  const padRightRef = useRef(null);
  const stickRightRef = useRef(null);
  const axesRef = useRef({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });
  const intervalRef = useRef(null);
  const lastVibrateTime = useRef(0);
  const vibrateThrottle = 50; // Limit vibration to every 50ms
  const lastPowerState = useRef(false); // Track power state changes
  const powerStateRef = useRef(false); // Current power state ref
  const hasEverConnectedRef = useRef(false); // Track if user was ever connected (for closure)

  // useEffect(() => {
  //   console.log("Axis :", axes);
  // }, [axes]);

  useEffect(() => {
    if (padLeftRef.current && stickLeftRef.current) {
      makePad(padLeftRef.current, stickLeftRef.current, (nx, ny) => {
        const dead = 0.05;
        const dz = (v) => (Math.abs(v) < dead ? 0 : v);
        // Left stick: X = Throttle (up/down), Y = Yaw (rotation)
        axesRef.current.throttle = Math.max(0, Math.min(1, 0.5 + nx * 0.5));
        axesRef.current.yaw = dz(ny);
      });
    }

    if (padRightRef.current && stickRightRef.current) {
      makePad(padRightRef.current, stickRightRef.current, (nx, ny) => {
        const dead = 0.05;
        const dz = (v) => (Math.abs(v) < dead ? 0 : v);
        // Right stick: X = Pitch (forward/backward), Y = Roll (left/right)
        axesRef.current.pitch = dz(nx);
        axesRef.current.roll = dz(-ny);
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (webrtcRef.current) {
        webrtcRef.current.close();
      }
    };
  }, []);

  // Reinitialize joysticks when connected
  useEffect(() => {
    if (
      isConnected &&
      padLeftRef.current &&
      stickLeftRef.current &&
      padRightRef.current &&
      stickRightRef.current
    ) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        if (padLeftRef.current && stickLeftRef.current) {
          makePad(padLeftRef.current, stickLeftRef.current, (nx, ny) => {
            const dead = 0.05;
            const dz = (v) => (Math.abs(v) < dead ? 0 : v);
            axesRef.current.throttle = Math.max(0, Math.min(1, 0.5 + nx * 0.5));
            axesRef.current.yaw = dz(ny);
            setAxes((prev) => ({
              ...prev,
              yaw: axesRef.current.yaw,
              throttle: axesRef.current.throttle,
            }));
          });
        }

        if (padRightRef.current && stickRightRef.current) {
          makePad(padRightRef.current, stickRightRef.current, (nx, ny) => {
            const dead = 0.05;
            const dz = (v) => (Math.abs(v) < dead ? 0 : v);
            axesRef.current.pitch = dz(nx);
            axesRef.current.roll = dz(-ny);
            setAxes((prev) => ({
              ...prev,
              roll: axesRef.current.roll,
              pitch: axesRef.current.pitch,
            }));
          });
        }
      }, 100);
    }
  }, [isConnected]);

  // Orientation detection
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
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
      const startX =
        (currentRect.left + 37.5 - padRect.left - padRect.width / 2) /
        (Math.min(padRect.width, padRect.height) / 2 - 40);
      const startY =
        (currentRect.top + 37.5 - padRect.top - padRect.height / 2) /
        (Math.min(padRect.width, padRect.height) / 2 - 40);

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
      const cx = r.width / 2,
        cy = r.height / 2;
      const maxR = Math.min(cx, cy) - 32.5; // Adjusted for 60-65px stick size
      const px = cx + nX * maxR - 30; // Adjusted for new stick size (60px / 2)
      const py = cy + nY * maxR - 30;

      // Use transform instead of left/top for better performance
      stickEl.style.transform = `translate(${px - cx + 30}px, ${
        py - cy + 30
      }px)`;
    }

    function handle(e) {
      const p = e.changedTouches ? e.changedTouches[0] : e;
      if (activeId !== null && e.changedTouches && p.identifier !== activeId)
        return;

      // Add haptic feedback on touch (if supported)
      if (navigator.vibrate && e.type === "touchstart") {
        navigator.vibrate(10);
      }

      const r = rect();
      const x = p.clientX - r.left - r.width / 2;
      const y = p.clientY - r.top - r.height / 2;
      const max = Math.min(r.width, r.height) / 2 - 32.5; // Adjusted for 60-65px stick size
      let nX = x / max,
        nY = y / max;
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

        // Add subtle haptic feedback for joystick movement (throttled)
        const now = performance.now();
        if (
          navigator.vibrate &&
          now - lastVibrateTime.current > vibrateThrottle
        ) {
          // Low frequency vibration based on stick position intensity
          const intensity = Math.min(3, Math.floor(adjustedLen * 4) + 1);
          navigator.vibrate(intensity);
          lastVibrateTime.current = now;
        }
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
    padEl.addEventListener("pointerdown", (e) => {
      if (!isActive) {
        isActive = true;
        activeId = "pointer";
        padEl.setPointerCapture(e.pointerId);
        stickEl.style.cursor = "grabbing";
        handle(e);
      }
    });

    padEl.addEventListener("pointermove", (e) => {
      if (activeId === "pointer") handle(e);
    });

    padEl.addEventListener("pointerup", (e) => {
      if (activeId === "pointer") {
        stickEl.style.cursor = "grab";
        reset();
      }
    });

    padEl.addEventListener("pointercancel", (e) => {
      if (activeId === "pointer") {
        stickEl.style.cursor = "grab";
        reset();
      }
    });

    // Touch events for mobile
    padEl.addEventListener(
      "touchstart",
      (e) => {
        if (!isActive) {
          isActive = true;
          activeId = e.changedTouches[0].identifier;
          handle(e);
        }
      },
      { passive: false }
    );

    padEl.addEventListener(
      "touchmove",
      (e) => {
        if (activeId !== null) {
          e.preventDefault();
          handle(e);
        }
      },
      { passive: false }
    );

    padEl.addEventListener("touchend", (e) => {
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeId
      );
      if (touch) {
        reset();
      }
    });

    padEl.addEventListener("touchcancel", reset);
  };

  // QR Code Scanner handler
  const handleQrCodeInput = async (qrText) => {
    try {
      setConnectionStep("connecting");
      const connectionInfo = parseConnectionInfo(qrText);
      if (connectionInfo) {
        setShowQrScanner(false);
        console.log("Valid QR code scanned:", connectionInfo);

        // Auto-initiate WebRTC connection
        await initWebRTCWithConnectionInfo(connectionInfo);
      } else {
        alert("Invalid QR code format");
        setConnectionStep("scanning");
      }
    } catch (error) {
      console.error("QR code parsing error:", error);
      alert("Failed to parse QR code");
      setConnectionStep("scanning");
    }
  };

  // Initialize WebRTC connection with connection info
  const initWebRTCWithConnectionInfo = async (connectionInfo) => {
    try {
      setWebrtcStatus("connecting");
      console.log("Initializing WebRTC with info:", connectionInfo);

      webrtcRef.current = new WebRTCConnection(false); // Phone is not initiator

      // Setup WebRTC callbacks
      webrtcRef.current.onConnectionStateChange = (state) => {
        console.log("WebRTC state changed:", state);
        setWebrtcStatus(state);
        if (state === "connected") {
          setIsConnected(true);
          setHasEverConnected(true); 
          hasEverConnectedRef.current = true;
          setShowConnectionPopup(false);
          startSendingControls();
        } else if (state === "failed" || state === "disconnected") {
          setIsConnected(false);
          // Only show connection popup if user was never connected before
          if (!hasEverConnectedRef.current) {
            setShowConnectionPopup(true);
            if (state === "failed") {
              setConnectionStep("scanning");
            }
          } else {
            // User was connected before, keep interface visible but show disconnected status
            setShowConnectionPopup(false);
          }
        }
      };

      webrtcRef.current.onDataChannelMessage = (message) => {
        console.log("Received message from PC:", message);
        
        // Handle ping messages and respond with pong for latency measurement
        if (message.type === 'ping') {
          webrtcRef.current.sendData({
            type: 'pong',
            timestamp: message.timestamp
          });
        }
      };

      // Connect to signaling server
      console.log(
        "Connecting to signaling server:",
        connectionInfo.websocket_url,
        connectionInfo.room
      );
      await webrtcRef.current.connectToSignalingServer(
        connectionInfo.websocket_url,
        connectionInfo.room
      );

      console.log(
        "WebRTC controller initialized, waiting for PC connection..."
      );
    } catch (error) {
      console.error("WebRTC initialization failed:", error);
      setWebrtcStatus("failed");
      setConnectionStep("scanning");
      alert("Connection failed: " + error.message);
    }
  };

  // Send control data over WebRTC
  const sendControlData = () => {
    const currentPowerState = powerStateRef.current; // Use ref for current value
    const controlData = {
      type: "control",
      axes: axesRef.current,
      power: currentPowerState, // Use ref value
      timestamp: Date.now(), // Add timestamp for debugging
    };

    // Only log when power state changes or for debugging
    if (lastPowerState.current !== currentPowerState) {
      console.log(" Power state changed:", currentPowerState ? "ON" : "OFF");
      console.log("Sending control data with power:", controlData);
      lastPowerState.current = currentPowerState;
    }

    // Check both React state and actual WebRTC state
    const isWebRtcReady =
      webrtcRef.current &&
      webrtcRef.current.peerConnection &&
      webrtcRef.current.peerConnection.connectionState === "connected" &&
      webrtcRef.current.dataChannel &&
      webrtcRef.current.dataChannel.readyState === "open";

    if (isWebRtcReady) {
      const sent = webrtcRef.current.sendData(controlData);
      if (!sent) {
        console.warn("WebRTC data channel not ready, data not sent");
      } else if (lastPowerState.current !== currentPowerState) {
        console.log(
          "✅ Control data sent successfully with power:",
          currentPowerState
        );
      }
    } else {
      console.warn(
        "WebRTC not ready - Connection state:",
        webrtcRef.current?.peerConnection?.connectionState,
        "Data channel state:",
        webrtcRef.current?.dataChannel?.readyState,
        "React isConnected:",
        isConnected,
        "Power state being sent:",
        currentPowerState
      );
    }
  };

  // Start sending control data at 30Hz
  const startSendingControls = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      sendControlData();
      // Update UI state at controlled rate
      setAxes((prev) => ({ ...prev, ...axesRef.current }));
    }, 16); // ~60 FPS for smoother response
  };

  // Handle orientation instruction completion
  const handleOrientationDone = () => {
    setConnectionStep("scanning");
    setShowQrScanner(true);
  };

  // Handle landscape instruction completion
  const handleLandscapeUnderstood = () => {
    // Check if device is in portrait mode before proceeding
    if (!isPortrait) {
      alert("Please rotate your device to portrait mode first!");
      return;
    }

    setShowConnectionPopup(false);
  };

  // Handle power button toggle
  const handlePowerToggle = () => {
    setIsPowerOn((prev) => {
      const newState = !prev;
      powerStateRef.current = newState; // Update ref immediately
      console.log(
        " Power button clicked - New state:",
        newState ? "ON" : "OFF"
      );
      return newState;
    });

    // Add haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  // Handle disconnection
  const handleDisconnect = () => {
    if (webrtcRef.current) {
      webrtcRef.current.close();
    }
    setIsConnected(false);
    setWebrtcStatus("disconnected");
    setShowConnectionPopup(true);
    setConnectionStep("scanning");
    setHasEverConnected(false); // Reset connection tracking
    hasEverConnectedRef.current = false; // Reset ref too
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Handle reconnection attempt
  const handleReconnect = () => {
    // Close existing WebRTC connection if any
    if (webrtcRef.current) {
      webrtcRef.current.close();
      webrtcRef.current = null;
    }
    
    // Reset all connection states
    setIsConnected(false);
    setWebrtcStatus("disconnected");
    setConnectionStep("scanning");
    setShowConnectionPopup(true);
    setShowQrScanner(true);
    
    // Stop sending control data
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    console.log("Reconnection initiated - all states reset");
  };

  return (
    <div className="controller">
      {/* Main Controller Interface - show when connected OR when user was previously connected */}
      {(isConnected || hasEverConnected) && (
        <div className="controller-main">
          {/* Connection Status - Top Right */}
          <div
            className={`simple-connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <div
              className={`status-dot ${
                isConnected ? "connected" : "disconnected"
              }`}
            ></div>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
           
          </div>
           {!isConnected && (
              <button
                className="reconnect-button"
                onClick={handleReconnect}
                title="Reconnect"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  data-name="Layer 1"
                  viewBox="0 0 100 125"
                  width="32"
                  height="32"
                  fill="currentColor"
                >
                  <title>Artboard 94</title>
                  <g>
                    <circle cx="26" cy="78" r="3" />
                    <circle cx="42" cy="78" r="3" />
                    <circle cx="58" cy="78" r="3" />
                    <circle cx="74" cy="78" r="3" />
                    <path d="M64,30v6a11,11,0,0,1,0,22H36a11,11,0,0,1,0-22H46.76l-7,7L44,47.24,56.12,35.12a3,3,0,0,0,0-4.24L44,18.76,39.76,23l7,7H36a17,17,0,0,0,0,34H64a17,17,0,0,0,0-34Z" />
                  </g>
                </svg>
              </button>
            )}

          <div className="joysticks-container">
            <div className="joystick-group">
              <div className="pad" ref={padLeftRef}>
                <div className="stick" ref={stickLeftRef}></div>
              </div>
              <div className="joystick-label left">Throttle / Yaw</div>
            </div>

            {/* Power Button */}
            <div className="power-button-container">
              <button
                className={`power-button ${
                  isPowerOn ? "power-on" : "power-off"
                }`}
                onClick={handlePowerToggle}
              >
                <div
                  className={`power-ring ${isPowerOn ? "ring-active" : ""}`}
                ></div>
                <div className="power-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    fill="currentColor"
                    className="bi bi-power"
                    viewBox="0 0 16 16"
                  >
                    <path d="M7.5 1v7h1V1z" />
                    <path d="M3 8.812a5 5 0 0 1 2.578-4.375l-.485-.874A6 6 0 1 0 11 3.616l-.501.865A5 5 0 1 1 3 8.812" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="joystick-group">
              <div className="joystick-label right">Pitch / Roll</div>
              <div className="pad" ref={padRightRef}>
                <div className="stick" ref={stickRightRef}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Popup */}
      {showConnectionPopup && (
        <div className="connection-overlay">
          <div className="connection-popup">
            {/* Browser Compatibility Warning */}
            {isNonChromiumBrowser() && (
              <div className="browser-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h4>Browser Compatibility Notice</h4>
                  <p>For the best experience, we recommend using <strong>Brave</strong>, <strong>Chrome</strong>, <strong>Edge</strong>, or another Chromium-based browser on both devices.</p>
                  <p>Firefox and Safari may have WebSocket connectivity issues with our secure connection.</p>
                </div>
              </div>
            )}

            {connectionStep === "scanning" && (
              <div className="scanning-step">
                <div className="step-icon">�</div>
                <h2>Connect to Drone</h2>
                <p>Scan the QR code displayed on your computer screen</p>
                <button
                  className="primary-button"
                  onClick={() => setShowQrScanner(true)}
                >
                  Open QR Scanner
                </button>
              </div>
            )}

            {connectionStep === "connecting" && (
              <div className="connecting-step">
                <div className="step-icon loading">⚡</div>
                <h2>Connecting...</h2>
                <p>Establishing connection with drone receiver</p>
                <p>Don't forget to click on <b>Start Connection</b> on the Receiver</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {connectionStep === "landscape" && (
              <div className="orientation-step">
                {/* <div className="step-icon"></div> */}
                <h2>Almost Ready!</h2>
                <div className="orientation-instruction">
                  <div className="phone-icon">
                    <div className="phone-body">
                      <div className="phone-screen"></div>
                    </div>
                  </div>
                  <p>
                    Turn off auto-rotate, as the UI works best in portrait mode
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={handleLandscapeUnderstood}
                  disabled={!isPortrait}
                  style={{
                    opacity: !isPortrait ? 0.5 : 1,
                    cursor: !isPortrait ? "not-allowed" : "pointer",
                  }}
                >
                  {!isPortrait
                    ? "Please rotate to portrait mode"
                    : "Got it, Start Flying! 🚁"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Scanner Modal */}
      <QRScanner
        isOpen={showQrScanner}
        onScan={handleQrCodeInput}
        onClose={() => {
          setShowQrScanner(false);
          setConnectionStep("scanning");
        }}
      />
    </div>
  );
};

export default Controller;
