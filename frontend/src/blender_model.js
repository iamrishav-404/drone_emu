import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


class ThreeJSScene {
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
    
    this.init();
  }

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
    this.camera.position.set(5, 5, 5);
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
 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

  
  }

  createGround(){
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2d3436 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    // Axis helper
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }


  // Load GLTF model
  async loadModel(url = '/static_drone/scene.gltf',
     position = { x: 0, y:2 , z: 0 }, 
     scale = 0.2) {

    const manager = new THREE.LoadingManager();
    manager.setURLModifier((requestedUrl) => {
      console.log('[GLTF] requested resource ->', requestedUrl);
      return requestedUrl;
    });

    const loader = new GLTFLoader(manager);

    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

      const model = gltf.scene;
      model.position.set(position.x, position.y, position.z);
      model.scale.setScalar(scale);
      
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
      throw error;
    }
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
    this.camera.position.set(5, 5, 5);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }


  animate() {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Update controls
    this.controls.update();

    // Update animation mixers
    this.mixers.forEach(mixer => mixer.update(deltaTime));

    // Animate objects
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


    Object.keys(this.props).forEach((key) => {
      const direction = (key % 2 === 0) ? 1 : -1;
      this.props[key].rotation.y += direction * 0.04;
    });

   

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  // Cleanup
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

  // Utility methods
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

  exportScene() {
    return {
      camera: {
        position: this.camera.position,
        rotation: this.camera.rotation
      },
      objects: this.objects.length,
      performance: this.renderer.info
    };
  }
}

export default ThreeJSScene;