// Network utility functions for dynamic IP detection

export const getLocalNetworkIP = () => {
  return new Promise((resolve) => {
    // Try to detect local network IP dynamically
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    pc.createDataChannel('');
    pc.createOffer().then(offer => pc.setLocalDescription(offer));
    
    pc.onicecandidate = (ice) => {
      if (ice.candidate) {
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(ice.candidate.candidate);
        if (match) {
          const ip = match[1];
          // Filter for local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
          if (ip.startsWith('192.168.') || ip.startsWith('10.') || 
              (ip.startsWith('172.') && parseInt(ip.split('.')[1]) >= 16 && parseInt(ip.split('.')[1]) <= 31)) {
            pc.close();
            resolve(ip);
          }
        }
      }
    };
    
    // Fallback to localhost after 3 seconds
    setTimeout(() => {
      pc.close();
      resolve('localhost');
    }, 3000);
  });
};

export const buildWebSocketURL = async (defaultPort = 3000) => {
  try {
    // Check for production webhook URL in environment variables first
    if (process.env.REACT_APP_WEBHOOK_URL) {
      const backendUrl = process.env.REACT_APP_WEBHOOK_URL;
      // Convert HTTPS to WSS for WebSocket connection
      const wsUrl = backendUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
      console.log("Using production WebSocket URL:", wsUrl);
      return wsUrl;
    }
    
    // Check for direct backend URL in environment variables
    if (process.env.REACT_APP_BACKEND_URL) {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const wsProtocol = backendUrl.startsWith('https:') ? 'wss:' : 'ws:';
      // Remove http/https and replace with ws/wss
      const wsUrl = backendUrl.replace(/^https?:/, wsProtocol);
      console.log("Using configured backend WebSocket URL:", wsUrl);
      return wsUrl;
    }
    
    // If we're on Netlify, connect to the Render backend
    if (window.location.hostname.includes('netlify.app')) {
      console.log("Detected Netlify deployment, using Render backend");
      return 'wss://drone-game-backend.onrender.com';
    }
    
    // Determine WebSocket protocol based on current page protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // If we're already on a network IP (not localhost), use that
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${wsProtocol}//${window.location.hostname}:${defaultPort}`;
    }
    
    // For local development, try to detect the actual network IP
    // The /get-ip endpoint won't work for this purpose as it returns ::1 (localhost)
    // So we'll use WebRTC detection instead
    console.log("Local development detected, using WebRTC IP detection");
    const localIP = await getLocalNetworkIP();
    console.log("WebRTC detected IP:", localIP);
    
    // If WebRTC failed to find a network IP, fall back to localhost
    if (localIP === 'localhost') {
      console.log("No network IP found, using localhost");
      return `${wsProtocol}//localhost:${defaultPort}`;
    }
    
    return `${wsProtocol}//${localIP}:${defaultPort}`;
  } catch (error) {
    console.warn('Could not detect network IP, falling back to localhost:', error);
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//localhost:${defaultPort}`;
  }
};

export const buildHTTPURL = async (defaultPort = 3000) => {
  try {
    // Determine HTTP protocol based on current page protocol
    const httpProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    
    // If we're already on a network IP (not localhost), use that
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // For production deployments, try to use the same host
      if (window.location.hostname.includes('netlify.app') || window.location.hostname.includes('vercel.app') || window.location.hostname.includes('herokuapp.com')) {
        return `${httpProtocol}//${window.location.hostname}:${defaultPort}`;
      }
      return `${httpProtocol}//${window.location.hostname}:${defaultPort}`;
    }
    
    // Try to detect local network IP
    const localIP = await getLocalNetworkIP();
    return `${httpProtocol}//${localIP}:${defaultPort}`;
  } catch (error) {
    console.warn('Could not detect network IP, falling back to localhost:', error);
    const httpProtocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${httpProtocol}//localhost:${defaultPort}`;
  }
};
