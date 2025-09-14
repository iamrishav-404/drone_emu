# 🚁 Drone Flight Simulator

A real-time 3D drone simulator where you control a virtual drone using your phone as a wireless controller. Built with Three.js for stunning 3D graphics and WebRTC for peer-to-peer connections.

## ✨ Features

- **3D Flight Experience**: Realistic drone physics with collision detection
- **Phone Controller**: Use your smartphone as a wireless gamepad
- **Real-time Connection**: Low-latency WebRTC peer-to-peer communication
- **Beautiful 3D World**: Detailed drone models and natural environments
- **Cross-platform**: Works on any modern web browser

## 🎮 How to Play

1. Open the receiver (PC) in your browser
2. Click "Generate QR Code" to create a connection code
3. Scan the QR code with your phone then start the connection
4. Start flying! Use your phone's virtual joysticks to control the drone

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Modern web browser
- Phone with camera (for QR scanning)
- Decent GPU laptop or may also work with CPU 

### Installation

```bash
# Clone the repository
git clone https://github.com/iamrishav-404/drone_emu.git
cd phone-pc_game

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### Development Setup

1. **Start the backend server:**
```bash
cd backend
node server.js
```

2. **Start the frontend development server:**
```bash
cd frontend  
npm start
```

3. **For HTTPS (recommended):**
   - Install [ngrok](https://ngrok.com/)
   - Configure `ngrok.yml` with your auth token
   - Run: `ngrok start --all --config ngrok.yml`
   - Use the HTTPS URL for better WebRTC connectivity

### Environment Configuration

Create `.env` files in both `frontend` and `backend` directories:

**Frontend (.env):**
```env
REACT_APP_WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app
REACT_APP_TURN_SERVER=turn:your-turn-server:3478
REACT_APP_TURN_USERNAME=your-username
REACT_APP_TURN_CREDENTIAL=your-password
```

**Backend (.env):**
```env
NODE_ENV=development
ALLOWED_ORIGINS=https://your-ngrok-url.ngrok-free.app,http://localhost:3000
```

## 🛠️ Tech Stack

- **Frontend**: React, Three.js, WebRTC
- **Backend**: Node.js, Express, WebSocket  
- **3D Graphics**: GLTF models, realistic lighting and shadows
- **Real-time Communication**: WebRTC data channels , for over the internet devices use TURN server optional if wanna work only on LAN
- **Development Tools**: ngrok for HTTPS tunneling

## 🎯 Controls

- **Left Joystick**: Throttle (up/down) and Yaw (left/right rotation)
- **Right Joystick**: Pitch (forward/backward) and Roll (left/right tilt)
- **Power Button**: Emergency stop/start

## 🔧 Troubleshooting

- **Connection Issues**: Make sure both devices are on the same network or use HTTPS
- **QR Code Not Working**: Try refreshing and generating a new code
- **Slow Performance**: Close other browser tabs and ensure good network connection
- **3D Models Not Loading**: Check browser console for any file loading errors

## 📱 Browser Compatibility

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari iOS, Samsung Internet


Ready to take flight? Start your engines and enjoy the virtual skies! 🛩️