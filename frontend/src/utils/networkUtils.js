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
    // If we're already on a network IP (not localhost), use that
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `ws://${window.location.hostname}:${defaultPort}`;
    }
    
    // Try to detect local network IP
    const localIP = await getLocalNetworkIP();
    return `ws://${localIP}:${defaultPort}`;
  } catch (error) {
    console.warn('Could not detect network IP, falling back to localhost:', error);
    return `ws://localhost:${defaultPort}`;
  }
};

export const buildHTTPURL = async (defaultPort = 3000) => {
  try {
    // If we're already on a network IP (not localhost), use that
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:${defaultPort}`;
    }
    
    // Try to detect local network IP
    const localIP = await getLocalNetworkIP();
    return `http://${localIP}:${defaultPort}`;
  } catch (error) {
    console.warn('Could not detect network IP, falling back to localhost:', error);
    return `http://localhost:${defaultPort}`;
  }
};
