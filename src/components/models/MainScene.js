import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


class MainScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    // Scene objects
    this.objects = [];
    this.mixers = []; // For animations
    this.props = {}
    this.isLoadingDrone = false; // Add loading flag
    
    // Drone physics state
    this.droneState = {
      pos: new THREE.Vector3(0, 1.5, 0), // Set to calculated height based on model bounds
      vel: new THREE.Vector3(),
      yaw: 0, // radians
      pitch: 0,
      roll: 0
    };

    // Physics parameters
    this.params = {
      maxTilt: THREE.MathUtils.degToRad(35), // Increased max tilt for more agility
      yawRate: THREE.MathUtils.degToRad(180), // Faster yaw rate
      accel: 18, // Increased base acceleration
      lift: 20,
      gravity: 9.81,
      drag: 1.5, // Reduced drag for snappier response
      
      // Realistic propeller parameters
      minRPM: 800,        // Idle RPM when armed
      maxRPM: 8000,       // Maximum RPM
      hoverThrottle: 0.35, // Throttle needed to hover
      propSpinupTime: 0.2, // Time to spin up props
      propSpindownTime: 0.8 // Time to spin down props
    };

    // Control inputs
    this.currentControls = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
    this.lastControlTime = 0;
    this.droneModel = null;
    this.directionalLight = null;
    
    // Realistic propeller state
    this.propState = {
      currentRPM: 0,
      targetRPM: 0,
      isArmed: false
    };
    
    // Camera mode state
    this.cameraMode = 'chase'; // 'chase' or 'free'
    
    this.init();
  }

  // Create camera toggle UI
  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createControls();
    this.createLights();
    this.createGround();
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f16);
    this.scene.fog = new THREE.Fog(0x0a0f16, 50, 200);
  }

  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(10, 15, 10); // Higher position to see the city better
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    
    this.container.appendChild(this.renderer.domElement);
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 2;
  }

  createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light (sun) with better shadow coverage
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    
    this.directionalLight = directionalLight;
    
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 100;
    
    //higher resolution shadow map
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    //softer shadows
    directionalLight.shadow.radius = 5;
    directionalLight.shadow.blurSamples = 10;
    
    this.scene.add(directionalLight);

    //secondary fill light to reduce harsh shadows
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-10, 10, -5);
    this.scene.add(fillLight);


    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // this.scene.add(helper);
  }

  createGround(){
    // Load city model instead of simple plane geometry
    //this.loadCity();

   // this for debug purposes
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x2d3436,
        transparent: false
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.position.y = 0;
      this.scene.add(ground);
      
      const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
      gridHelper.receiveShadow = true;
      this.scene.add(gridHelper);

      const axisHelper = new THREE.AxesHelper(10);
      this.scene.add(axisHelper);
  }

  // Load city 3D model
  async loadCity(url = '/low_poly_city_pack/scene.gltf', scale = 1.0) {
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((requestedUrl) => {
      console.log('[CITY] Loading resource:', requestedUrl);
      return requestedUrl;
    });

    const loader = new GLTFLoader(manager);

    try {
      console.log('Loading city model from:', url);
      const gltf = await new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

      const cityModel = gltf.scene;
      cityModel.position.set(0, 0, 0);
      cityModel.scale.setScalar(scale);
      
      console.log('City model loaded successfully');
      
      // Enable shadows for all city meshes
      cityModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Optimize materials if needed
          if (child.material) {
            child.material.needsUpdate = true;
          }
        }
      });

      this.scene.add(cityModel);
      this.objects.push({ mesh: cityModel, type: 'city', gltf });
      
      // Debug: Check city model bounds
      const box = new THREE.Box3().setFromObject(cityModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      console.log('City model bounds:', {
        size: size,
        center: center,
        min: box.min,
        max: box.max
      });

    //   // Optional: Add grid helper for reference (can be removed later)
    //   const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
    //   gridHelper.receiveShadow = true;
    //   gridHelper.position.y = 0.1; // Slightly above ground to avoid z-fighting
    //   this.scene.add(gridHelper);

    //   // Optional: Add axes helper for debugging
    //   const axesHelper = new THREE.AxesHelper(10);
    //   this.scene.add(axesHelper);

      console.log('City model setup completed');
      return cityModel;
    } catch (error) {
      console.error('Error loading city model:', error);
      
      // Fallback to simple ground plane if city fails to load
      console.log('Falling back to simple ground plane...');
      const groundGeometry = new THREE.PlaneGeometry(100, 100);
      const groundMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x2d3436,
        transparent: false
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.position.y = 0;
      this.scene.add(ground);
      
      const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
      gridHelper.receiveShadow = true;
      this.scene.add(gridHelper);
      
      throw error;
    }
  }


  // Load GLTF model
  async loadMainDrone(url = '/static_drone/scene.gltf',
     position = { x: 0, y:2 , z: 0 }, 
     scale = 0.2) {

    // Prevent loading multiple drone models
    if (this.droneModel) {
      console.log('Drone model already loaded, skipping...');
      return this.droneModel;
    }
    
    if (this.isLoadingDrone) {
      console.log('Drone model is already being loaded, skipping...');
      return null;
    }

    console.log('Starting to load drone model...');
    this.isLoadingDrone = true;

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((requestedUrl) => {
      console.log('[GLTF] requested resource ->', requestedUrl);
      return requestedUrl;
    });

    const loader = new GLTFLoader(manager);

    try {
      const gltf = await new Promise((resolve, reject) => {
        console.log('Loading drone model from:', url);
        loader.load(url, resolve, undefined, reject);
      });

      const model = gltf.scene;
      // Set position to match the physics initial position
      model.position.copy(this.droneState.pos); // Use physics position (0, 1.2, 0)
      model.scale.setScalar(scale);
      
      console.log('Drone model loaded successfully, setting as droneModel');
      
      // Enable shadows for all meshes in the model
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if(child.name ==="polySurface40_ai_whitePlastic_0"){
            this.props[1] = child;
          }
          if(child.name ==="polySurface45_ai_whitePlastic_0"){
            this.props[2] = child;
          }
          if(child.name ==="polySurface36_ai_whitePlastic_0"){
            this.props[3] = child;
          }
          if(child.name ==="polySurface47_ai_whitePlastic_0"){
            this.props[4] = child;
          }
        }
      });

      this.scene.add(model);
      this.objects.push({ mesh: model, type: 'gltf', gltf });
      
      // Store reference to the drone model for physics
      this.droneModel = model;
      this.isLoadingDrone = false; // Clear loading flag
      
      // Debug: Check drone model bounds to find correct ground offset
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      console.log('Drone model bounds:', {
        size: size,
        center: center,
        min: box.min,
        max: box.max,
        bottomY: box.min.y,
        modelHeight: size.y
      });
      console.log('Suggested ground collision Y:', Math.abs(box.min.y) + 0.05);
 

      // Handle animations if present
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        this.mixers.push(mixer);
        
        gltf.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });
      }

      console.log('Model loaded successfully:', url);
      return model;
    } catch (error) {
      console.error('Error loading model:', error);
      this.isLoadingDrone = false; // Clear loading flag on error
      throw error;
    }
  }

  // Update control inputs from WebSocket
  updateControls(controls, timestamp) {
    this.currentControls = controls;
    this.lastControlTime = timestamp;
    
    // Auto-arm when throttle is applied
    if (controls.throttle > 0.05 && !this.propState.isArmed) {
      this.propState.isArmed = true;
    }
  }

  // Realistic propeller RPM simulation
  updatePropellerRPM(throttleInput, deltaTime) {
    let targetRPM = 0;
    
    if (this.propState.isArmed) {
      if (throttleInput > 0.01) {
        // Non-linear throttle curve like real drones
        const normalizedThrottle = Math.pow(throttleInput, 1.5);
        targetRPM = this.params.minRPM + (this.params.maxRPM - this.params.minRPM) * normalizedThrottle;
      } else {
        targetRPM = this.params.minRPM; // Idle RPM when armed
      }
    } else {
      targetRPM = 0; // Disarmed
    }

    this.propState.targetRPM = targetRPM;

    // Smooth RPM transitions
    const rpmDiff = this.propState.targetRPM - this.propState.currentRPM;
    const isSpinningUp = rpmDiff > 0;
    const transitionTime = isSpinningUp ? this.params.propSpinupTime : this.params.propSpindownTime;
    const rpmChangeRate = Math.abs(rpmDiff) / transitionTime;
    
    if (Math.abs(rpmDiff) > 50) {
      this.propState.currentRPM += Math.sign(rpmDiff) * rpmChangeRate * deltaTime;
    } else {
      this.propState.currentRPM = this.propState.targetRPM;
    }

    this.propState.currentRPM = Math.max(0, Math.min(this.params.maxRPM, this.propState.currentRPM));
  }

  // Apply deadzone to control input
  applyDeadzone(v, d = 0.06) { 
    return Math.abs(v) < d ? 0 : v; 
  }

  // Exponential curve for smoother control feel
  expo(v, e = 0.3) { 
    return v * (1 - e) + v * v * v * e; 
  }

  setupEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  resetCamera() {
    this.camera.position.set(10, 15, 10); // Updated for city view
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }


  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    const now = performance.now();

    // Update controls based on camera mode
    if (this.cameraMode === 'free') {
      this.controls.update();
    }

    // Update animation mixers
    this.mixers.forEach(mixer => mixer.update(deltaTime));

    // Drone physics simulation
    if (this.droneModel) {
    //   console.log('Running physics with droneModel, current pos:', this.droneState.pos);
    //   console.log("Drone velocity:", this.droneState.vel);
      const dt = Math.min(0.033, deltaTime); // clamp ~30 FPS physics

      // Failsafe: if stale > 0.5s, zero inputs except gravity
      const stale = (now - this.lastControlTime) > 500;
      const target = stale ? {throttle: 0, yaw: 0, pitch: 0, roll: 0} : this.currentControls;

      // Process inputs with deadzone + stronger expo for realistic feel  
      const yawIn = this.expo(this.applyDeadzone(target.yaw), 0.5); 
      const pitIn = this.expo(this.applyDeadzone(target.pitch), 0.4); 
      const rolIn = this.expo(this.applyDeadzone(-target.roll), 0.4); 
      const thrIn = Math.max(0, Math.min(1, target.throttle));


      const pitchMagnitude = Math.abs(pitIn);
      const rollMagnitude = Math.abs(rolIn);
      
      const pitchCurve = Math.pow(pitchMagnitude, 1.8) * Math.sign(pitIn);
      const rollCurve = Math.pow(rollMagnitude, 1.8) * Math.sign(rolIn);
      
      const desiredPitch = pitchCurve * this.params.maxTilt;
      const desiredRoll = rollCurve * this.params.maxTilt;

      // Progressive attitude smoothing - faster response at higher stick deflection
      const pitchRate = 3 + pitchMagnitude * 8; 
      const rollRate = 3 + rollMagnitude * 8;
      const yawRate = 2 + Math.abs(yawIn) * 6; 
      
      this.droneState.pitch += (desiredPitch - this.droneState.pitch) * Math.min(1, dt * pitchRate);
      this.droneState.roll += (desiredRoll - this.droneState.roll) * Math.min(1, dt * rollRate);
      this.droneState.yaw += yawIn * this.params.yawRate * dt;

      // Local axes from yaw
      const cy = Math.cos(this.droneState.yaw), sy = Math.sin(this.droneState.yaw);
      const forward = new THREE.Vector3(sy, 0, cy);   
      const right = new THREE.Vector3(cy, 0, -sy);

      // Lift vs gravity
      const upAccel = thrIn * this.params.lift - this.params.gravity;

      // Progressive acceleration based on actual tilt angle and stick input
      const currentPitchMag = Math.abs(this.droneState.pitch);
      const currentRollMag = Math.abs(this.droneState.roll);
      
      // Exponential acceleration curve - realistic drone physics
      const pitchAccelMultiplier = 1 + pitchMagnitude * 2; 
      const rollAccelMultiplier = 1 + rollMagnitude * 2;
      
      // Calculate accelerations relative to drone's orientation
      const forwardAccel = pitIn * this.params.accel * pitchAccelMultiplier; 
      const sideAccel = rolIn * this.params.accel * rollAccelMultiplier; 
      
      // Apply accelerations relative to drone's current yaw orientation
      const acc = new THREE.Vector3()
        .addScaledVector(forward, forwardAccel)    // Pitch: forward/backward relative to drone
        .addScaledVector(right, sideAccel)        // Roll: left/right relative to drone
        .add(new THREE.Vector3(0, upAccel, 0))    // Throttle: always up in world space
        .addScaledVector(this.droneState.vel, -this.params.drag);

      this.droneState.vel.addScaledVector(acc, dt);
      this.droneState.pos.addScaledVector(this.droneState.vel, dt);

      const baseLandingHeight = 1.5; 
      
      const tiltMagnitude = Math.abs(this.droneState.pitch) + Math.abs(this.droneState.roll);
      const tiltOffset = tiltMagnitude * 0.5; 
      
      const minHeight = baseLandingHeight + tiltOffset;
      
      if (this.droneState.pos.y < minHeight) {
        this.droneState.pos.y = minHeight;
        if (this.droneState.vel.y < 0) this.droneState.vel.y = 0;
      }


      this.droneModel.position.copy(this.droneState.pos);
      
      // Set rotation order to ensure yaw is applied first, then pitch/roll relative to drone
      this.droneModel.rotation.order = 'YXZ'; // Yaw-Pitch-Roll order
      this.droneModel.rotation.y = this.droneState.yaw;
      this.droneModel.rotation.x = this.droneState.pitch;
      this.droneModel.rotation.z = -this.droneState.roll;

      if (this.directionalLight) {
        // Keep the light at a fixed offset from the drone
        const dronePos = this.droneState.pos;
        this.directionalLight.position.set(
          dronePos.x + 10, 
          Math.max(20, dronePos.y + 15), // Ensure light stays above drone
          dronePos.z + 5
        );
        
        // Update shadow camera target to center on drone
        this.directionalLight.target.position.copy(dronePos);
        this.directionalLight.target.updateMatrixWorld();
        
        // Update shadow camera
        this.directionalLight.shadow.camera.updateMatrixWorld();
      }

      // Spin props proportional to throttle
      const spin = target.throttle > 0.01 ? now * 0.02 + thrIn * 10 : 0;
      
      // Realistic propeller RPM calculation
      this.updatePropellerRPM(target.throttle, dt);
      const propRotationSpeed = (this.propState.currentRPM / this.params.maxRPM) * 0.3;
      
      if (this.props[1]) this.props[1].rotation.y += propRotationSpeed;          
      if (this.props[2]) this.props[2].rotation.y -= propRotationSpeed;         
      if (this.props[3]) this.props[3].rotation.y += propRotationSpeed;         
      if (this.props[4]) this.props[4].rotation.y -= propRotationSpeed;

      // Chase camera - follows drone from behind (only in chase mode)
      if (this.cameraMode === 'chase') {
        const camDist = 7.5, camHeight = 5; 
        const back = new THREE.Vector3().copy(forward).multiplyScalar(-camDist);
        const camPos = new THREE.Vector3().copy(this.droneState.pos).add(back).add(new THREE.Vector3(0, camHeight, 0));
        this.camera.position.lerp(camPos, Math.min(1, dt * 3));
        this.camera.lookAt(this.droneModel.position);
      }
    } else {
      //console.log('Running physics without droneModel, current pos:', this.droneState.pos);
      // Run basic physics even without drone model loaded for position tracking
      const dt = Math.min(0.033, deltaTime);
      const stale = (now - this.lastControlTime) > 500;
      const target = stale ? {throttle: 0, yaw: 0, pitch: 0, roll: 0} : this.currentControls;
      const thrIn = Math.max(0, Math.min(1, target.throttle));
      
      // Basic gravity simulation
      const upAccel = thrIn * this.params.lift - this.params.gravity;
      this.droneState.vel.y += upAccel * dt;
      this.droneState.pos.addScaledVector(this.droneState.vel, dt);
      
      // Enhanced ground collision - account for drone rotation (simplified version without model)
      const baseLandingHeight = 1.5;
      const tiltMagnitude = Math.abs(this.droneState.pitch) + Math.abs(this.droneState.roll);
      const tiltOffset = tiltMagnitude * 0.5;
      const minHeight = baseLandingHeight + tiltOffset;
      
      if (this.droneState.pos.y < minHeight) {
        this.droneState.pos.y = minHeight;
        if (this.droneState.vel.y < 0) this.droneState.vel.y = 0;
      }
    }

    // Animate other objects
    this.objects.forEach(obj => {
      if (obj.type === 'cube') {
        obj.mesh.rotation.x += 0.01;
        obj.mesh.rotation.y += 0.01;
      } else if (obj.type === 'sphere') {
        obj.mesh.position.y = Math.sin(elapsedTime * 2) * 0.3 + 0.7;
      } else if (obj.type === 'cylinder') {
        obj.mesh.rotation.y += 0.02;
      } else if (obj.type === 'animated') {
        obj.mesh.rotation.x += obj.rotationSpeed;
        obj.mesh.rotation.y += obj.rotationSpeed * 1.5;
        obj.mesh.position.y += Math.sin(elapsedTime * obj.bobSpeed) * obj.bobHeight * 0.1;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }

    // Dispose of geometries and materials
    this.objects.forEach(obj => {
      if (obj.mesh.geometry) obj.mesh.geometry.dispose();
      if (obj.mesh.material) {
        if (Array.isArray(obj.mesh.material)) {
          obj.mesh.material.forEach(material => material.dispose());
        } else {
          obj.mesh.material.dispose();
        }
      }
    });
  }

  getObjectByName(name) {
    return this.scene.getObjectByName(name);
  }

  removeObject(object) {
    this.scene.remove(object);
    this.objects = this.objects.filter(obj => obj.mesh !== object);
  }

  setBackgroundColor(color) {
    this.scene.background = new THREE.Color(color);
  }

  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }

  // Set camera mode (chase or free)
  setCameraMode(mode) {
    this.cameraMode = mode;
    
    if (mode === 'free') {
      // Enable orbit controls for free camera
      this.controls.enabled = true;
    } else {
      // Disable orbit controls for chase camera
      this.controls.enabled = false;
    }
  }

  exportScene() {
    return {
      camera: {
        position: this.camera.position,
        rotation: this.camera.rotation
      },
      drone: {
        position: this.droneState.pos,
        velocity: this.droneState.vel,
        attitude: {
          yaw: this.droneState.yaw,
          pitch: this.droneState.pitch,
          roll: this.droneState.roll
        }
      },
      objects: this.objects.length,
      performance: this.renderer.info
    };
  }

  // Get current drone position for real-time display
  getDronePosition() {
    // Add some debugging
    //console.log('getDronePosition called, droneState.pos:', this.droneState.pos);
    return {
      x: this.droneState.pos.x,
      y: this.droneState.pos.y,
      z: this.droneState.pos.z
    };
  }

  // Get current drone attitude for real-time display
  getDroneAttitude() {
    return {
      yaw: this.droneState.yaw * 180 / Math.PI,   // Convert to degrees
      pitch: this.droneState.pitch * 180 / Math.PI,
      roll: this.droneState.roll * 180 / Math.PI
    };
  }
}

export default MainScene;