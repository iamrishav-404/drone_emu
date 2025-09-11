import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

const QRScanner = ({ isOpen, onScan, onClose }) => {
  const videoRef = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Check browser compatibility and setup polyfills
      setupMediaDevicesPolyfill();
      
      if (!hasMediaDevicesSupport()) {
        setError('📷 Camera not supported on this browser. Please try Chrome, Safari, or Firefox.');
        return;
      }
      
      initializeCamera();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  // Setup polyfill for older browsers
  const setupMediaDevicesPolyfill = () => {
    // Older browsers might have getUserMedia on navigator
    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {};
    }

    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = function(constraints) {
        // First try the modern approach
        const getUserMedia = navigator.getUserMedia || 
                           navigator.webkitGetUserMedia || 
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

        if (!getUserMedia) {
          return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
        }

        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      };
    }
  };

  const hasMediaDevicesSupport = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  const initializeCamera = async () => {
    try {
      setError('');
      console.log('Browser info:', {
        userAgent: navigator.userAgent,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        protocol: window.location.protocol,
        hostname: window.location.hostname
      });
      
      // Check for HTTPS requirement on mobile
      const isSecureContext = window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' ||
                             window.location.hostname.endsWith('.local');
      
      if (!isSecureContext && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
        setError('📱 Mobile camera requires HTTPS. Please use https:// instead of http://');
        return;
      }
      
      // First, request camera permission explicitly with mobile-optimized constraints
      console.log('Requesting camera permission...');
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      console.log('Camera permission granted!');
      
      // Now get available video devices
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === 'videoinput');
      console.log('Available cameras:', cameras);
      setDevices(cameras);
      
      if (cameras.length > 0) {
        // Use back camera if available (for mobile)
        const backCamera = cameras.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('camera2')
        ) || cameras[cameras.length - 1]; // Often the last camera is the back camera
        
        console.log('Selected camera:', backCamera);
        setSelectedDevice(backCamera.deviceId);
        startScanning(backCamera.deviceId);
      } else {
        setError('📷 No camera devices found on this device');
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('📷 Camera access denied. Please allow camera permissions and refresh the page.');
      } else if (err.name === 'NotFoundError') {
        setError('📷 No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('📷 Camera not supported on this browser. Try Chrome, Safari, or Firefox.');
      } else if (err.name === 'NotReadableError') {
        setError('📷 Camera is being used by another application. Please close other camera apps.');
      } else if (err.message && err.message.includes('getUserMedia')) {
        setError('📱 Camera not available. Please try a different browser or enable camera permissions in settings.');
      } else {
        setError(`📷 Camera error: ${err.message || 'Unknown error'}. Try refreshing the page.`);
      }
    }
  };

  const startScanning = async (deviceId) => {
    if (!videoRef.current) return;
    
    try {
      setIsScanning(true);
      setError('');
      console.log('Starting camera with device ID:', deviceId);
      
      // Try using ZXing's method first (more compatible)
      try {
        await codeReader.current.decodeFromVideoDevice(
          deviceId, 
          videoRef.current, 
          (result, error) => {
            if (result) {
              console.log('QR Code scanned successfully:', result.text);
              onScan(result.text);
              stopScanning();
            }
            if (error && !(error.name === 'NotFoundException')) {
              console.warn('QR scanning error (this is normal while searching):', error.name);
            }
          }
        );
        console.log('Camera started successfully via ZXing');
      } catch (zxingError) {
        console.warn('ZXing method failed, trying manual stream setup:', zxingError);
        
        // Fallback: Manual stream setup
        const constraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            facingMode: deviceId ? undefined : { ideal: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          // Start continuous scanning
          scanFromVideo();
        }
      }
      
    } catch (err) {
      console.error('Start scanning error:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('📷 Camera permission denied. Please refresh and allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('📷 Selected camera not found. Please try another camera.');
      } else if (err.name === 'NotReadableError') {
        setError('📷 Camera is busy. Please close other apps using the camera.');
      } else if (err.name === 'OverconstrainedError') {
        setError('📷 Camera constraints not supported. Trying basic camera access...');
        // Retry with basic constraints
        retryWithBasicConstraints();
      } else {
        setError(`📷 Failed to start camera: ${err.message || 'Unknown error'}`);
      }
      setIsScanning(false);
    }
  };

  const retryWithBasicConstraints = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        setError('');
        scanFromVideo();
      }
    } catch (err) {
      console.error('Basic camera retry failed:', err);
      setError('📷 Unable to access camera with basic settings');
    }
  };

  const scanFromVideo = () => {
    if (!videoRef.current || !isScanning) return;
    
    try {
      const result = codeReader.current.decodeFromVideoElement(videoRef.current);
      if (result) {
        console.log('QR Code found:', result.text);
        onScan(result.text);
        stopScanning();
        return;
      }
    } catch (err) {
      // Normal - no QR code found yet
    }
    
    // Continue scanning
    setTimeout(scanFromVideo, 100);
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    // Also stop any manual video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped video track:', track.label);
        });
      }
      videoRef.current.srcObject = null;
    }
  };

  const switchCamera = (deviceId) => {
    stopScanning();
    setSelectedDevice(deviceId);
    startScanning(deviceId);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="qr-scanner-modal">
      <div className="qr-scanner-content">
        <div className="qr-scanner-content::before"></div>
        
        <div className="qr-scanner-header">
          <h3>🎮 Connect to Receiver</h3>
          <p>Point your camera at the QR code on the PC screen</p>
        </div>

        <div className="qr-scanner-body">
          <div className="qr-camera-container">
            <video
              ref={videoRef}
              className="qr-video"
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            
            <div className="qr-scanner-overlay">
              <div className="qr-scanner-corners"></div>
            </div>
            
            <div className="scanning-animation"></div>
            
            {!isScanning && !error && (
              <div className="camera-loading" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                zIndex: 4
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--border-color)',
                  borderTop: '3px solid var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px'
                }}></div>
                <p style={{ margin: 0, fontSize: '14px' }}>Starting camera...</p>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid #f97316',
              borderRadius: '12px',
              color: '#f97316',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '8px' }}>⚠️ {error}</div>
              {error.includes('permission') && (
                <button 
                  onClick={() => {
                    setError('');
                    initializeCamera();
                  }}
                  style={{
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  🔄 Try Again
                </button>
              )}
            </div>
          )}
        </div>

        <button 
          className="qr-close-button"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default QRScanner;
