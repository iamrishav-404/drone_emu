

import React, { useEffect, useRef, useState } from 'react';
import './Controller.css';

const Controller = () => {
  const [status, setStatus] = useState('disconnected');
  const [wsUrl, setWsUrl] = useState('');
  const [room, setRoom] = useState('A');
  
  const socketRef = useRef(null);
  const padLeftRef = useRef(null);
  const stickLeftRef = useRef(null);
  const padRightRef = useRef(null);
  const stickRightRef = useRef(null);
  const axesRef = useRef({ throttle: 0, yaw: 0, pitch: 0, roll: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    setWsUrl(`ws://${window.location.hostname}:3000`);
    
    if (padLeftRef.current && stickLeftRef.current) {
      makePad(padLeftRef.current, stickLeftRef.current, (nx, ny) => {
        const dead = 0.05;
        const dz = v => Math.abs(v) < dead ? 0 : v;
        axesRef.current.yaw = dz(nx);
        axesRef.current.throttle = Math.max(0, Math.min(1, 0.5 - (ny * 0.5)));
      });
    }
    
    if (padRightRef.current && stickRightRef.current) {
      makePad(padRightRef.current, stickRightRef.current, (nx, ny) => {
        const dead = 0.05;
        const dz = v => Math.abs(v) < dead ? 0 : v;
        axesRef.current.roll = dz(nx);
        axesRef.current.pitch = dz(-ny); 
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

    function setStick(nX, nY) {
      const r = rect();
      const cx = r.width/2, cy = r.height/2;
      const maxR = Math.min(cx, cy) - 45;
      const px = cx + nX * maxR - 40;
      const py = cy + nY * maxR - 40;
      stickEl.style.left = px + 'px';
      stickEl.style.top = py + 'px';
    }

    function handle(e) {
      const p = e.changedTouches ? e.changedTouches[0] : e;
      if (activeId !== null && e.changedTouches && p.identifier !== activeId) return;
      const r = rect();
      const x = (p.clientX - r.left) - r.width/2;
      const y = (p.clientY - r.top) - r.height/2;
      const max = Math.min(r.width, r.height)/2 - 10;
      let nX = x / max, nY = y / max;
      const len = Math.hypot(nX, nY);
      if (len > 1) { nX /= len; nY /= len; }
      onMove(nX, nY);
      setStick(nX, nY);
    }

    function reset() {
      onMove(0, 0);
      setStick(0, 0);
      activeId = null;
    }

    padEl.addEventListener('pointerdown', (e) => {
      activeId = 'mouse';
      padEl.setPointerCapture(e.pointerId);
      handle(e);
    });
    padEl.addEventListener('pointermove', (e) => activeId && handle(e));
    padEl.addEventListener('pointerup', reset);
    padEl.addEventListener('pointercancel', reset);

    padEl.addEventListener('touchstart', (e) => { 
      activeId = e.changedTouches[0].identifier; 
      handle(e); 
    }, {passive: false});
    padEl.addEventListener('touchmove', (e) => { 
      e.preventDefault(); 
      handle(e); 
    }, {passive: false});
    padEl.addEventListener('touchend', reset);
    padEl.addEventListener('touchcancel', reset);
  };

  const connect = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
    
    socketRef.current = new WebSocket(wsUrl);
    
    socketRef.current.onopen = () => {
      setStatus('connected');
      socketRef.current.send(JSON.stringify({ 
        type: 'hello', 
        role: 'controller', 
        room 
      }));
      
      //  sending controls at ~30Hz
      intervalRef.current = setInterval(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ 
            type: 'control', 
            room, 
            axes: axesRef.current 
          }));
        }
      }, 33);
    };
    
    socketRef.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      

      if (msg.type === 'ping') {
        socketRef.current.send(JSON.stringify({ 
          type: 'pong', 
          timestamp: msg.timestamp 
        }));
      }
    };
    
    socketRef.current.onclose = () => {
      setStatus('disconnected');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    socketRef.current.onerror = () => {
      setStatus('error');
    };
  };

  const getStatusClass = () => {
    switch (status) {
      case 'connected': return 'status-connected';
      case 'error': return 'status-error';
      default: return 'status-disconnected';
    }
  };

  return (
    <div className="controller">
      <div className="bar">
        <label>WS:</label>
        <input 
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          size="24" 
        />
        <label>Room:</label>
        <input 
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          size="4" 
        />
        <button onClick={connect}>Connect</button>
        <span id="status" className={getStatusClass()}>{status}</span>
      </div>

      <div className="row">
        <div className="pad" ref={padLeftRef}>
          <div className="stick" ref={stickLeftRef}></div>
        </div>
        <div className="pad" ref={padRightRef}>
          <div className="stick" ref={stickRightRef}></div>
        </div>
      </div>
      <div className="hint">Left: Throttle/Yaw &nbsp; | &nbsp; Right: Pitch/Roll</div>
    </div>
  );
};

export default Controller;
