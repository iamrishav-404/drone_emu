// WebRTC utility functions for P2P connection

export class WebRTCConnection {
  constructor(isInitiator = false) {
    this.isInitiator = isInitiator;
    this.peerConnection = null;
    this.dataChannel = null;
    this.websocket = null;
    this.room = 'A';
    
    // ICE servers for LAN connections
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: process.env.REACT_APP_TURN_SERVER,
        username: process.env.REACT_APP_TURN_USERNAME,
        credential: process.env.REACT_APP_TURN_CREDENTIAL
      }
    ];
    
    // Event callbacks
    this.onDataChannelOpen = null;
    this.onDataChannelMessage = null;
    this.onConnectionStateChange = null;
  }

  // Initialize WebRTC peer connection
  async initializePeerConnection() {
    // Don't reinitialize if already exists and connected
    if (this.peerConnection && this.peerConnection.connectionState !== 'failed' && this.peerConnection.connectionState !== 'closed') {
      console.log('Peer connection already exists, skipping initialization');
      return;
    }
    
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.websocket) {
        console.log('Sending ICE candidate:', event.candidate);
        this.websocket.send(JSON.stringify({
          type: 'webrtc_ice',
          candidate: event.candidate,
          room: this.room
        }));
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('WebRTC connection state:', state, 'signaling state:', this.peerConnection.signalingState);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }
    };

    // If initiator (PC), create data channel
    if (this.isInitiator) {
      this.createDataChannel();
    } else {
      // If not initiator (Phone), wait for data channel
      this.peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };
    }
  }

  // Create data channel (for PC/initiator)
  createDataChannel() {
    this.dataChannel = this.peerConnection.createDataChannel('controls', {
      ordered: true
    });
    this.setupDataChannel(this.dataChannel);
  }

  // Setup data channel event handlers
  setupDataChannel(channel) {
    this.dataChannel = channel;
    
    this.dataChannel.onopen = () => {
      console.log('WebRTC data channel opened!');
      if (this.onDataChannelOpen) {
        this.onDataChannelOpen();
      }
    };

    this.dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(data);
      }
    };

    this.dataChannel.onclose = () => {
      console.log('WebRTC data channel closed');
    };
  }

  // Connect to signaling server
  async connectToSignalingServer(websocketUrl, room = 'A') {
    this.room = room;
    
    return new Promise((resolve, reject) => {
      // Auto-correct WebSocket protocol based on current page protocol
      let correctedWsUrl = websocketUrl;
      if (window.location.protocol === 'https:' && websocketUrl.startsWith('ws://')) {
        correctedWsUrl = websocketUrl.replace('ws://', 'wss://');
        console.log('Auto-corrected WebSocket URL for HTTPS:', correctedWsUrl);
      } else if (window.location.protocol === 'http:' && websocketUrl.startsWith('wss://')) {
        correctedWsUrl = websocketUrl.replace('wss://', 'ws://');
        console.log('Auto-corrected WebSocket URL for HTTP:', correctedWsUrl);
      }
      
      console.log('Connecting to signaling server:', correctedWsUrl);
      
      const attemptConnection = (url) => {
        const ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          ws.close();
          console.log('WebSocket connection timeout');
          
          // If we tried WSS and failed, try WS as fallback (for development)
          if (url.startsWith('wss://') && url !== websocketUrl) {
            console.log('WSS failed, trying WS fallback...');
            attemptConnection(websocketUrl);
          } else {
            reject(new Error(`WebSocket connection failed to ${url}. Backend server may not support secure WebSockets.`));
          }
        }, 10000); // 10 second timeout
        
        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('Connected to signaling server successfully');
          this.websocket = ws;
          
          // Register as receiver or controller
          this.websocket.send(JSON.stringify({
            type: 'hello',
            role: this.isInitiator ? 'receiver' : 'controller',
            room: this.room
          }));
          resolve();
        };
        
        ws.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          await this.handleSignalingMessage(message);
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket connection closed:', event.code, event.reason);
          
          if (event.code !== 1000) { // Not a normal close
            // If we tried WSS and failed, try WS as fallback
            if (url.startsWith('wss://') && url !== websocketUrl) {
              console.log('WSS connection failed, trying WS fallback...');
              attemptConnection(websocketUrl);
            } else if (this.websocket !== ws) {
              // Don't reject if this isn't our current connection
              return;
            } else {
              reject(new Error(`WebSocket connection failed to ${url}. Make sure the backend server is running.`));
            }
          }
          
          if (this.onConnectionStateChange && this.websocket === ws) {
            this.onConnectionStateChange('disconnected');
          }
        };
      };
      
      attemptConnection(correctedWsUrl);
    });
  }

  // Handle signaling messages
  async handleSignalingMessage(message) {
    switch (message.type) {
      case 'webrtc_offer':
        await this.handleOffer(message.offer);
        break;
      case 'webrtc_answer':
        await this.handleAnswer(message.answer);
        break;
      case 'webrtc_ice':
        await this.handleIceCandidate(message.candidate);
        break;
      default:
        // Handle other message types if needed
        break;
    }
  }

  // Create and send WebRTC offer (PC initiator)
  async createOffer() {
    await this.initializePeerConnection();
    
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    console.log('Created WebRTC offer');
    this.websocket.send(JSON.stringify({
      type: 'webrtc_offer',
      offer: offer,
      room: this.room
    }));
  }

  // Handle received offer and create answer (Phone controller)
  async handleOffer(offer) {
    if (this.peerConnection && this.peerConnection.signalingState !== 'stable') {
      console.error('Received offer in wrong state:', this.peerConnection.signalingState);
      return;
    }
    
    await this.initializePeerConnection();
    
    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      console.log('Created WebRTC answer');
      this.websocket.send(JSON.stringify({
        type: 'webrtc_answer',
        answer: answer,
        room: this.room
      }));
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  // Handle received answer (PC initiator)
  async handleAnswer(answer) {
    if (!this.peerConnection) {
      console.error('No peer connection when receiving answer');
      return;
    }
    
    // Check if we're in the correct state to receive an answer
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      console.error('Received answer in wrong state:', this.peerConnection.signalingState);
      return;
    }
    
    try {
      await this.peerConnection.setRemoteDescription(answer);
      console.log('Received WebRTC answer');
    } catch (error) {
      console.error('Failed to set remote description:', error);
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate) {
    if (this.peerConnection) {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('Added ICE candidate');
    }
  }

  // Send data over WebRTC data channel
  sendData(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  // Close connection
  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Helper function to generate connection QR code data
export const generateConnectionInfo = (websocketUrl, room = 'A') => {
  return {
    type: 'webrtc_connection',
    room: room,
    websocket_url: websocketUrl,
    ice_servers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
};

// Parse QR code data
export const parseConnectionInfo = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    if (data.type === 'webrtc_connection') {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse QR code data:', error);
    return null;
  }
};
