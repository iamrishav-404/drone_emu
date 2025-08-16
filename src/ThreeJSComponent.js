import React, { useEffect, useRef, useState } from 'react';
import ThreeJSScene from './blender_model';

const ThreeJSComponent = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneInfo, setSceneInfo] = useState(null);

  useEffect(() => {
    if (containerRef.current && !sceneRef.current) {
      try {
        sceneRef.current = new ThreeJSScene(containerRef.current);
        setIsLoaded(true);
        
        setTimeout(async () => {
          try {
            console.log('Auto-loading drone model...');
            await sceneRef.current.loadModel()
            console.log('Drone model auto-loaded successfully!');
          } catch (error) {
            console.warn('Auto-load failed, model can be loaded manually:', error.message);
          }
        }, 1000);
        
        // Update scene info every 2 seconds
        const interval = setInterval(() => {
          if (sceneRef.current) {
            setSceneInfo(sceneRef.current.exportScene());
          }
        }, 2000);

        return () => {
          clearInterval(interval);
        };
      } catch (error) {
        console.error('Failed to initialize Three.js scene:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

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

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          background: '#000' 
        }}
      />
      
      {/* UI Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
         
        {sceneInfo && (
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            <strong>Scene Info:</strong><br/>
            Objects: {sceneInfo.objects}<br/>
            Camera: ({sceneInfo.camera.position.x.toFixed(1)}, {sceneInfo.camera.position.y.toFixed(1)}, {sceneInfo.camera.position.z.toFixed(1)})<br/>
            Triangles: {sceneInfo.performance.render.triangles}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          
          <button 
            onClick={handleResetCamera}
            style={buttonStyle}
            disabled={!isLoaded}
          >
             Reset Camera
          </button>
          
          <button 
            onClick={handleChangeBackground}
            style={buttonStyle}
            disabled={!isLoaded}
          >
            Change Background
          </button>

        </div>
        
      </div>

      {/* Performance Info */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px'
      }}>
        {sceneInfo && (
          <div style={{ color: '#4ade80' }}>
            FPS: ~60 | Calls: {sceneInfo.performance.render.calls}
          </div>
        )}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '6px 10px',
  border: '1px solid #444',
  borderRadius: '4px',
  background: '#1a1a1a',
  color: 'white',
  cursor: 'pointer',
  fontSize: '11px',
  transition: 'background 0.2s',
};

export default ThreeJSComponent;
