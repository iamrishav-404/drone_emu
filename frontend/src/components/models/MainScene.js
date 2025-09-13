import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';  
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshBVH } from 'three-mesh-bvh';


// Extended THREE.BufferGeometry with BVH capabilities
THREE.BufferGeometry.prototype.computeBoundsTree = function(options) {
  this.boundsTree = new MeshBVH(this, options);
  return this.boundsTree;
};

THREE.BufferGeometry.prototype.disposeBoundsTree = function() {
  this.boundsTree = null;
};


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
    this.isLoadingDrone = false; 
    
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
      maxRPM: 8000,       
      hoverThrottle: 0.35, // Throttle needed to hover
      propSpinupTime: 0.2, 
      propSpindownTime: 0.8 
    };

    // Control inputs
    this.currentControls = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
    this.lastControlTime = 0;
    this.droneModel = null;
    this.directionalLight = null;
    
    // Performance optimization flags
    this.debugHelpersCreated = false;
    this.collisionCheckInterval = 0; 
    
    // BVH collision system
    this.bvhColliders = []; 
    this.bvhVisualizers = []; 
    this.collisionTimeout = false; 
    
    // Realistic propeller state
    this.propState = {
      currentRPM: 0,
      targetRPM: 0,
      isArmed: false,
      powerOn: false
    };
    
    // Camera mode state
    this.cameraMode = 'chase'; // 'chase' or 'free'
    
    // Racing track system
    this.raceTrack = {
      hoops: [],
      strips: [],
      currentCheckpoint: 0,
      totalCheckpoints: 0,
      raceStarted: false,
      startTime: 0,
      bestTime: null
    };
    
    // Environment collision objects
    this.environmentColliders = [];


    this.groundCollisionsMesh = [
        "Ground_Main",
        "Plane_049",
        "Road_1_Mat_0_008"
      ];


    this.cityCollisionsMesh = [
      "Lowpoly_Tree_04_Material_0_024",
          "House2",
      "Truck_3_Mat_0_002",
      "Truck_2_Mat_0_003",
      "Truck_2_Mat_0_004",
      "Traffic_Light_2_Mat_0_001_006",
      "Traffic_Light_2_Mat_0_001_007",
      "Traffic_Light_2_Mat_0_001_008",
      "Traffic_Light_2_Mat_0_001_009",
      "Taxi_Mat_0_003",
      "Taxi_Mat_0_004",
      "PublicBuilding_School_TextureBuildingsPack2_0_001_001",
      "PublicBuilding_Police_TextureBuildingsPack2_0_001",
      "PublicBuilding_Hospital_TextureBuildingsPack2_0_001_001",
      "PublicBuilding_GasStation_TextureBuildingsPack2_0_001_001",
      "PublicBuilding_CityHall_TextureBuildingsPack2_0_001",
      "Police_Mat_0_011",
      "Police_Mat_0_012",
      "Police_Mat_0_013",
      "Police_Mat_0_014",
      "Police_Mat_0_015",
      "Police_Mat_0_016",
      "Police_Mat_0_017",
      "Police_Mat_0_018",
      "Police_Mat_0_019",
      "Police_Mat_0_020",
      "Pickup_3_Mat_0_002",
      "Pickup_2_Mat_0_002",
      "Pickup_1_Mat_0_003",
      "Pickup_1_Mat_0_004",
      "Object_2_001",
      "Material_001-material_172",
      "Material_001-material_173",
      "Material_001-material_174",
      "Material_001-material_175",
      "Material_001-material_176",
      "Material_001-material_177",
      "Material_001-material_178",
      "Material_001-material_179",
      "Material_001-material_180",
      "Material_001-material_181",
      "Material_001-material_182",
      "Material_001-material_183",
      "Material_001-material_184",
      "Material_001-material_185",
      "Material_001-material_186",
      "Material_001-material_187",
      "Material_001-material_188",
      "Material_001-material_189",
      "Material_001-material_190",
      "Material_001-material_191",
      "Material_001-material_192",
      "Material_001-material_193",
      "Material_001-material_194",
      "Material_001-material_195",
      "Material_001-material_196",
      "Material_001-material_197",
      "Material_001-material_198",
      "Material_001-material_199",
      "Main_Truck_4_Mat_0_002",
      "Main_Truck_3_Mat_0_002",
      "Main_Truck_2_Mat_0_003",
      "Main_Truck_2_Mat_0_004",
      "Main_Truck_1_Mat_0_003",
      "Main_Truck_1_Mat_0_004",
      "Lowpoly_Tree_14_Material_002_0_001",
      "Lowpoly_Tree_12_Material_002_0_003",
      "Lowpoly_Tree_12_Material_002_0_004",
      "Lowpoly_Tree_12_Material_002_0_005",
      "Lowpoly_Tree_11_Material_0_017",
      "Lowpoly_Tree_10_Material_0_003",
      "Lowpoly_Tree_04_Material_0_022",
      "Lowpoly_Tree_03_Material_0_009",
      "Light_Mat_0_001_015",
      "Light_Mat_0_001_016",
      "Light_Mat_0_001_017",
      "Light_Mat_0_001_018",
      "Light_Mat_0_001_019",
      "Light_Mat_0_001_020",
      "Light_Mat_0_001_021",
      "Light_Mat_0_001_022",
      "Light_Mat_0_001_023",
      "Light_Mat_0_001_024",
      "Light_Mat_0_001_025",
      "Light_Mat_0_001_026",
      "Light_Mat_0_001_027",
      "Hydrant_Mat_0_007",
      "Hydrant_Mat_0_008",
      "Hydrant_Mat_0_009",
      "Hydrant_Mat_0_010",
      "Hydrant_Mat_0_011",
      "Hydrant_Mat_0_012",
      "Gas_Truck_Mat_0_002",
      "Fire_Truck_Mat_0_002",
      "Fencing_003",
      "Fencing_005",
      "Fencing_006",
      "Excavator_Mat_0_002",
      "Collider_Cafe_Collider_0_001_001",
      "Cinema_Texture_buildings1_0_001_001",
      "Car_3_3_Mat_0_004",
      "Car_3_3_Mat_0_005",
      "Car_3_3_Mat_0_006",
      "Car_3_2_Mat_0_002",
      "Car_3_1_Mat_0_003",
      "Car_3_1_Mat_0_004",
      "Car_2_3_Mat_0_002",
      "Car_1_3_Mat_0_003",
      "Car_1_3_Mat_0_004",
      "Car_1_2_Mat_0_002",
      "Car_1_1_Mat_0_002",
      "CafeBuilding_Texture_buildings1_0_001_001",
      "Bus_3_Mat_0_002",
      "Bus_2_Mat_0_002",
      "Bulldozer_Mat_0_003",
      "Building_8_Mat_0_003",
      "Building_6_Mat_0_002",
      "Building_5_Mat_0_003",
      "Building_4_Mat_0_002",
      "Building_3_Mat_0_003",
      "Building_2_Mat_0_002",
      "Building_1_Mat_0_004",
      "Ambulance_Mat_0_003",
      "Ambulance_Mat_0_004"
    ];


    
    // Store ground collision objects
    this.groundColliders = [];
    
    this.init();
  }

  // Create camera toggle UI
  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createSky();        
    // this.createControls();
    this.createLights();
    this.createGround();
    this.createRaceTrack();
    this.createCity();
    this.createEnvironmentObjects(); 
    this.setupEventListeners();
    this.animate();
  }

  createScene() {
    this.scene = new THREE.Scene();
    // We'll set the background in createSky() for better control
    this.scene.fog = new THREE.Fog(0xa3c1e0, 300, 1200); // Slightly hazy atmospheric fog
  }

  createSky() {
    console.log('Creating realistic gradient sky...');
    
    // Create much larger sky dome to eliminate visible edges
    const skyGeometry = new THREE.SphereGeometry(5000, 32, 16); 
    
    // Create realistic sky gradient shader
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },    
        horizonColor: { value: new THREE.Color(0xa3c1e0) }, 
        groundColor: { value: new THREE.Color(0xe6f2ff) },  
        sunDirection: { value: new THREE.Vector3(0.5, 0.8, 0.2) },
        sunColor: { value: new THREE.Color(0xfff8dc) },    
        sunIntensity: { value: 0.15 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vDirection;
        
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor; 
        uniform vec3 groundColor;
        uniform vec3 sunDirection;
        uniform vec3 sunColor;
        uniform float sunIntensity;
        
        varying vec3 vWorldPosition;
        varying vec3 vDirection;
        
        void main() {
          float height = normalize(vDirection).y;
          
          // Create smooth gradient from top to horizon to ground
          vec3 skyColor;
          if (height > 0.0) {
            // Above horizon - blend from horizon to top
            float factor = smoothstep(0.0, 0.6, height);
            skyColor = mix(horizonColor, topColor, factor);
          } else {
            // Below horizon - blend from ground to horizon
            float factor = smoothstep(-0.3, 0.0, height);
            skyColor = mix(groundColor, horizonColor, factor);
          }
          
          // Add subtle sun glow effect
          float sunEffect = max(0.0, dot(normalize(vDirection), normalize(sunDirection)));
          sunEffect = pow(sunEffect, 8.0);
          skyColor += sunColor * sunEffect * sunIntensity;
          
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,  // Don't write to depth buffer
      depthTest: false    // Don't test depth - always render behind everything
    });
    
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    skyDome.name = 'RealisticSky';
    skyDome.renderOrder = -100; // Ensure it renders first/behind everything
    skyDome.frustumCulled = false; // Never cull the sky dome
    this.scene.add(skyDome);
    
    // Set scene background to match horizon color as fallback
    this.scene.background = new THREE.Color(0xa3c1e0);
    
    // Add subtle atmospheric light
    const atmosphericLight = new THREE.HemisphereLight(
      0xa3c1e0, // Sky color
      0x5c8a5c, // Ground color (greenish)
      0.3       // Intensity
    );
    this.scene.add(atmosphericLight);
    
    console.log('Realistic gradient sky created with no visible edges');
  }

  createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(10, 15, 10); // Good position to see the drone and ground
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap; // Changed to VSM for smoother shadows
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    
    this.container.appendChild(this.renderer.domElement);
  }

  // Camera mode toggle - currently disabled
  // createControls() {
  //   this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  //   this.controls.enableDamping = true;
  //   this.controls.dampingFactor = 0.05;
  //   this.controls.screenSpacePanning = false;
  //   this.controls.minDistance = 1;
  //   this.controls.maxDistance = 500; // Increased from 100 to 500 for much better zoom out
  //   this.controls.maxPolarAngle = Math.PI / 2;
  // }

  createLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Main directional light (sun) with optimized shadow quality
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50); // Higher and more centered position
    directionalLight.castShadow = true;
    
    this.directionalLight = directionalLight;
    
    // Optimized shadow camera coverage - balance between coverage and quality
    directionalLight.shadow.camera.left = -200;   // Reduced for better quality
    directionalLight.shadow.camera.right = 200;   // Reduced for better quality
    directionalLight.shadow.camera.top = 200;     // Reduced for better quality
    directionalLight.shadow.camera.bottom = -200; // Reduced for better quality
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 200;     // Optimized depth range
    
    // Higher resolution shadow map for smooth shadows
    directionalLight.shadow.mapSize.width = 4096;  // Increased from 2048
    directionalLight.shadow.mapSize.height = 4096; // Increased from 2048
    
    // Anti-aliasing and smoothing settings
    directionalLight.shadow.radius = 8;            // Increased blur radius
    directionalLight.shadow.blurSamples = 15;      // More blur samples for smooth edges
    
    // Add shadow bias to prevent shadow acne
    directionalLight.shadow.bias = -0.0005;        // Prevents shadow stripping
    directionalLight.shadow.normalBias = 0.02;     // Additional bias for normal-based offset
    
    this.scene.add(directionalLight);

    // Secondary fill light to reduce harsh shadows
    const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
    fillLight.position.set(-50, 50, -50);
    this.scene.add(fillLight);

    // Enable shadow camera helper to visualize coverage (uncomment for debugging)
    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // this.scene.add(helper);
  }

  createGround(){
    // Load multiple natural ground sections for a much larger connected surface
    // Raise all ground sections slightly to hide grid lines
    const groundHeight = 0.3; // Raised above grid
    
    // Center ground - main area (larger for better connection)
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 15.0, 15.0, 1.0, 0, groundHeight, 0);
    
    // Adjacent ground sections with overlap for seamless connection
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, 70, groundHeight, 0);   // East
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, -70, groundHeight, 0);  // West
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, 0, groundHeight, 70);   // North
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, 0, groundHeight, -70);  // South
    
    // Corner sections with better positioning for seamless coverage
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, 50, groundHeight, 50);   // NE
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, -50, groundHeight, 50);  // NW
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, 50, groundHeight, -50);  // SE
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, -50, groundHeight, -50); // SW
    
    // Additional intermediate sections for better connection
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, 35, groundHeight, 35);    // NE-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -35, groundHeight, 35);   // NW-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, 35, groundHeight, -35);   // SE-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -35, groundHeight, -35);  // SW-mid
    
    // Edge connectors for smooth transitions
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, 35, groundHeight, 0);     // E-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -35, groundHeight, 0);    // W-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, 0, groundHeight, 35);     // N-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, 0, groundHeight, -35);    // S-mid

    // EXTENDED LEFT SIDE - Copy the whole ground structure to the left for bigger surface
    // Left center ground
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 15.0, 15.0, 1.0, -140, groundHeight, 0);
    
    // Left adjacent sections
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, -210, groundHeight, 0);  // Far West
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, -140, groundHeight, 70); // Left North
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 12.0, 12.0, 1.0, -140, groundHeight, -70); // Left South
    
    // Left corner sections
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, -190, groundHeight, 50);  // Left NE
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, -190, groundHeight, -50); // Left SE
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, -90, groundHeight, 50);   // Left NW
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 10.0, 10.0, 1.0, -90, groundHeight, -50);  // Left SW
    
    // Left intermediate sections
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -175, groundHeight, 35);   // Left NE-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -175, groundHeight, -35);  // Left SE-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -105, groundHeight, 35);   // Left NW-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -105, groundHeight, -35);  // Left SW-mid
    
    // Left edge connectors
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -175, groundHeight, 0);    // Left E-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -105, groundHeight, 0);    // Left W-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -140, groundHeight, 35);   // Left N-mid
    this.loadGround('/natural_ground_lowpoly/scene.gltf', 8.0, 8.0, 1.0, -140, groundHeight, -35);  // Left S-mid

    // Grid helper positioned below the raised ground - make it larger for extended surface
    const gridHelper = new THREE.GridHelper(600, 600, 0x444444, 0x222222);
    gridHelper.position.y = -0.1; 
    gridHelper.receiveShadow = true;
    this.scene.add(gridHelper);
    
    // Add large static green plane surface to completely hide grid
    const groundPlaneGeometry = new THREE.PlaneGeometry(3000, 3000, 1, 1); // Even larger plane
    const groundPlaneMaterial = new THREE.MeshLambertMaterial({
      color: 0x4a7c59, // Natural grass green color
      transparent: false,
      fog: true // Allow fog to affect the ground plane for natural distance fade
    });
    
    const groundPlane = new THREE.Mesh(groundPlaneGeometry, groundPlaneMaterial);
    groundPlane.rotation.x = -Math.PI / 2; // Rotate to lie flat
    groundPlane.position.set(0, -0.05, 0); // Position between grid (-0.1) and natural ground (0.3)
    groundPlane.receiveShadow = true;
    groundPlane.castShadow = false;
    groundPlane.name = 'ground_plane_surface';
    groundPlane.matrixAutoUpdate = false; // Make it completely static
    groundPlane.updateMatrix(); // Update matrix once and freeze it
    
    this.scene.add(groundPlane);
    this.objects.push({ mesh: groundPlane, type: 'ground-plane' });
    
    // Alternative: Hide the grid helper completely since we have green plane
    gridHelper.visible = false; // Hide grid since green plane covers it
    
    console.log('Extended ground created with static green surface plane hiding grid');
  }


  // Load and position city model
  async createCity() {
    console.log('Loading city model...');
    try {
      await this.loadCityModel('/city6.glb', 
        { x: -70, y: -5, z: 60 }, 
        { x: 1.0, y: 1.0, z: 1.0 } 
      );
      console.log('City model loaded and positioned successfully');
    } catch (error) {
      console.error('Failed to load city model:', error);
      // Creating fallback city structures if model fails to load
      this.createFallbackCity();
    }
  }

  // Loading city  model
  async loadCityModel(url = '/city6.glb', position = { x: 100, y: 0.3, z: 0 }, scale = { x: 1.0, y: 1.0, z: 1.0 }) {
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((requestedUrl) => {
      console.log('[CITY] Loading resource:', requestedUrl);
      return requestedUrl;
    });

    const loader = new GLTFLoader(manager);

    try {
      console.log(`Loading city model from: ${url} at position (${position.x}, ${position.y}, ${position.z})`);
      const gltf = await new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });

      const cityModel = gltf.scene;
      cityModel.position.set(position.x, position.y, position.z);
      cityModel.scale.set(scale.x, scale.y, scale.z);
      
      // Rotate city model 90 degrees on Y-axis
      cityModel.rotation.y = Math.PI / 2; // 90 degrees in radians
      
      console.log(`City model scaled: X=${scale.x}, Y=${scale.y}, Z=${scale.z} at position (${position.x}, ${position.y}, ${position.z}) with Y rotation: 90°`);
      
      // Calculate city bounds for collision detection
      const box = new THREE.Box3().setFromObject(cityModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      console.log('City model bounds:', {
        size: size,
        center: center,
        min: box.min,
        max: box.max
      });
      
      // Configure materials for all city meshes - disable shadows for performance
      cityModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;     
          child.receiveShadow = true;

          // Optimize materials for better performance
          if (child.material) {
            child.material.needsUpdate = true;
            
            // Add subtle emissive lighting for city buildings at night
            if (child.material.emissive) {
              child.material.emissive.setHex(0x001122);
              child.material.emissiveIntensity = 0.1;
            }
          }
        }
        // console.log('City model child:', child);
      });

      this.scene.add(cityModel);
      this.objects.push({ mesh: cityModel, type: 'city', gltf, bounds: box });
      
      // Add collision detection using specific mesh names
      // this.setupCityMeshCollisions(cityModel); // OLD BOX3 SYSTEM - COMMENTED OUT  
      this.setupCityBVHCollisions(cityModel); // NEW BVH SYSTEM
      this.setupGroundCollisions(cityModel); // GROUND COLLISION SYSTEM
      
      console.log('City model loaded successfully:', url);
      return cityModel;
    } catch (error) {
      console.error('Error loading city model:', error);
      throw error;
    }
  }

  // Setup collision detection using specific city mesh names
  setupCityMeshCollisions(cityModel) {
    console.log('Setting up city mesh-based collision detection...');
    console.log('Looking for these collision meshes:', this.cityCollisionsMesh);
    
    let collisionMeshesFound = 0;
    const foundMeshNames = [];
    const allMeshNames = [];
    
    // First pass: collect all mesh names for debugging
    cityModel.traverse((child) => {
      if (child.isMesh) {
        allMeshNames.push(child.name);
      }
    });
    
    console.log('All available mesh names in city model:', allMeshNames);
    
    // Second pass: find collision meshes by name
    cityModel.traverse((child) => {
      if (child.isMesh && this.cityCollisionsMesh.includes(child.name)) {
        // Calculate bounding box for this specific mesh
        const box = new THREE.Box3().setFromObject(child);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Set small, realistic collision radius (in meters) - much closer collision detection
        let collisionRadius;
        if (child.name.includes('Building') || child.name.includes('Collider')) {
          // Buildings - close collision (3-4 meters from surface)
          collisionRadius = 4;
        } else if (child.name.includes('Tree')) {
          // Trees - very close collision (2 meters)
          collisionRadius = 2;
        } else if (child.name.includes('Car') || child.name.includes('Traffic')) {
          // Cars - very close collision (1.5 meters)
          collisionRadius = 1.5;
        } else {
          // Default close collision (2.5 meters)
          collisionRadius = 2.5;
        }
        
        // BOX3 COLLISION - COMMENTED OUT FOR BVH IMPLEMENTATION
        // // Add BOX collision detection for this mesh
        // this.environmentColliders.push({
        //   position: center.clone(),
        //   size: size.clone(),
        //   box: box.clone(),
        //   type: `city-mesh-${child.name}`,
        //   mesh: child,
        //   meshName: child.name
        // });

        // // DEBUG: Add visual box helper (only create once, not every frame)
        // if (!this.debugHelpersCreated) {
        //   const helper = new THREE.Box3Helper(box, 0xff0000);
        //   this.scene.add(helper);
        // }

        // DEBUG: Add visual sphere to show collision radius
        // const debugGeometry = new THREE.SphereGeometry(collisionRadius, 16, 8);
        // const debugMaterial = new THREE.MeshBasicMaterial({
        //   color: 0x00ff00,
        //   wireframe: true,
        //   transparent: true,
        //   opacity: 0.3
        // });
        // const debugSphere = new THREE.Mesh(debugGeometry, debugMaterial);
        // debugSphere.position.copy(center);
        // this.scene.add(debugSphere);
        
        foundMeshNames.push(child.name);
        collisionMeshesFound++;
        console.log(`✅ Added collision for: ${child.name} (radius: ${collisionRadius.toFixed(2)})`);
      }
    });
    
    console.log(`City collision setup complete: ${collisionMeshesFound}/${this.cityCollisionsMesh.length} meshes found`);
    
    // Check for missing meshes with suggestions
    const missingMeshes = this.cityCollisionsMesh.filter(name => !foundMeshNames.includes(name));
    if (missingMeshes.length > 0) {
      console.warn('❌ Missing collision meshes:', missingMeshes);
      
      // Try to find similar mesh names for suggestions
      missingMeshes.forEach(missingName => {
        const similarNames = allMeshNames.filter(name => 
          name.toLowerCase().includes(missingName.toLowerCase().split('_')[0]) ||
          missingName.toLowerCase().includes(name.toLowerCase().split('_')[0])
        );
        if (similarNames.length > 0) {
          console.log(`💡 Possible matches for "${missingName}":`, similarNames);
        }
      });
    } else {
      console.log('✅ All collision meshes found successfully!');
    }
    
    // Mark debug helpers as created to prevent recreation
    this.debugHelpersCreated = true;
    
    // If no collision meshes were found, create fallback collision detection
    if (collisionMeshesFound === 0) {
      console.warn('⚠️ No collision meshes found by exact name match. Creating fallback collision system...');
      this.createFallbackCityCollisions(cityModel, allMeshNames);
    }
  }

  // Create fallback collision system when exact mesh names don't match
  createFallbackCityCollisions(cityModel, allMeshNames) {
    console.log('Creating fallback collision system for city...');
    
    let fallbackCollisions = 0;
    
    // Create collisions for meshes that seem like collision candidates
    cityModel.traverse((child) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        // Check if this mesh looks like a collision candidate
        const isCollisionCandidate = (
          name.includes('building') ||
          name.includes('collider') ||
          name.includes('tree') ||
          name.includes('car') ||
          name.includes('traffic') ||
          name.includes('object') ||
          name.includes('public') ||
          name.includes('school') ||
          name.includes('hospital') ||
          name.includes('gas') ||
          name.includes('light') ||
          name.includes('excavator')
        );
        
        if (isCollisionCandidate) {
          // Calculate bounding box for this mesh
          const box = new THREE.Box3().setFromObject(child);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Skip very small objects (likely details)
          if (size.x < 0.5 && size.z < 0.5) {
            return;
          }
          
          // BOX3 COLLISION - COMMENTED OUT FOR BVH IMPLEMENTATION
          // // Add BOX collision detection for this mesh
          // this.environmentColliders.push({
          //   position: center.clone(),
          //   size: size.clone(),
          //   box: box.clone(),
          //   type: `fallback-city-${child.name}`,
          //   mesh: child,
          //   meshName: child.name
          // });

          // // DEBUG: Add visual box helper (only create once, not every frame)
          // if (!this.debugHelpersCreated) {
          //   const helper = new THREE.Box3Helper(box, 0xffff00);
          //   this.scene.add(helper);
          // }
          
          fallbackCollisions++;
          console.log(`🔄 Fallback collision added: ${child.name} (box size: ${size.x.toFixed(1)}x${size.y.toFixed(1)}x${size.z.toFixed(1)})`);
        }
      }
    });
    
    // Mark debug helpers as created to prevent recreation
    this.debugHelpersCreated = true;
    console.log(`Fallback collision system created: ${fallbackCollisions} collisions added`);
  }

  // NEW BVH COLLISION SYSTEM
  setupCityBVHCollisions(cityModel) {
    console.log('Setting up BVH collision system for city...');
    
    let bvhMeshesFound = 0;
    
    // First, find all meshes that should have collision
    const targetMeshNames = this.cityCollisionsMesh;
    console.log('Target collision meshes:', targetMeshNames);

    cityModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Check if this mesh should have collision
        const shouldHaveCollision = targetMeshNames.some(targetName => 
          child.name === targetName || child.name === targetName.replace(/_/g, '.')
        );

        if (shouldHaveCollision) {
          // console.log(`Creating BVH for collision mesh: ${child.name}`);
          
          // Create BVH for this mesh
          child.geometry.computeBoundsTree();
          
          // Store the mesh for collision detection
          this.bvhColliders.push({
            mesh: child,
            name: child.name,
            type: 'city-bvh'
          });

          // // Create BVH visualizer for debugging (simple wireframe)
          // if (!this.debugHelpersCreated) {
          //   // Create a simple wireframe mesh for visualization instead of MeshBVHVisualizer
          //   const wireframeGeometry = child.geometry.clone();
          //   const wireframeMaterial = new THREE.MeshBasicMaterial({
          //     color: 0x00ff00,
          //     wireframe: true,
          //     transparent: true,
          //     opacity: 0.3
          //   });
          //   const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
            
          //   // Apply the world transformation matrix to get correct position/rotation/scale
          //   child.updateWorldMatrix(true, false);
          //   wireframeMesh.applyMatrix4(child.matrixWorld);
            
          //   this.scene.add(wireframeMesh);
          //   this.bvhVisualizers.push(wireframeMesh);
          // }
          
          bvhMeshesFound++;
        }
      }
    });

    // Mark debug helpers as created
    this.debugHelpersCreated = true;
    
    console.log(`BVH collision system setup complete: ${bvhMeshesFound} meshes processed`);
    
    // If no BVH meshes found, create fallback
    if (bvhMeshesFound === 0) {
      console.warn('⚠️ No BVH collision meshes found. Creating fallback BVH system...');
      this.createFallbackBVHCollisions(cityModel);
    }
  }

  // Create fallback BVH collisions for all significant meshes
  createFallbackBVHCollisions(cityModel) {
    console.log('Creating fallback BVH collision system...');
    
    let fallbackBVHCount = 0;
    
    cityModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Skip very small objects
        const box = new THREE.Box3().setFromObject(child);
        const size = box.getSize(new THREE.Vector3());
        
        if (size.x < 0.5 && size.z < 0.5) return;
        
        console.log(`🔄 Creating fallback BVH for: ${child.name}`);
        
        // Create BVH for this mesh
        child.geometry.computeBoundsTree();
        
        // Store the mesh for collision detection
        this.bvhColliders.push({
          mesh: child,
          name: child.name,
          type: 'fallback-bvh'
        });

        // Create BVH visualizer for debugging (yellow wireframe for fallback)
        if (!this.debugHelpersCreated) {
          // Create a simple wireframe mesh for visualization
          const wireframeGeometry = child.geometry.clone();
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
          });
          const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
          
          // Apply the world transformation matrix to get correct position/rotation/scale
          child.updateWorldMatrix(true, false);
          wireframeMesh.applyMatrix4(child.matrixWorld);
          
          this.scene.add(wireframeMesh);
          this.bvhVisualizers.push(wireframeMesh);
        }
        
        fallbackBVHCount++;
      }
    });
    
    console.log(`Fallback BVH system created: ${fallbackBVHCount} collisions added`);
  }

  // Setup ground collision detection to prevent drone from going below terrain
  setupGroundCollisions(cityModel) {
    console.log('Setting up ground collision system...');
    console.log('Target ground meshes:', this.groundCollisionsMesh);
    
    let groundMeshesFound = 0;
    
    cityModel.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Check if this mesh is a ground/road mesh
        const shouldHaveGroundCollision = this.groundCollisionsMesh.some(targetName => 
          child.name === targetName || child.name === targetName.replace(/_/g, '.')
        );

        if (shouldHaveGroundCollision) {
          console.log(`🌍 Creating ground collision for: ${child.name}`);
          
          // Calculate bounding box for ground height detection
          child.geometry.computeBoundingBox();
          const bbox = child.geometry.boundingBox.clone();
          
          // Transform bounding box to world coordinates
          child.updateWorldMatrix(true, false);
          bbox.applyMatrix4(child.matrixWorld);
          
          // Store ground collision data
          this.groundColliders.push({
            mesh: child,
            name: child.name,
            type: 'ground',
            bbox: bbox,
            minY: bbox.min.y,
            maxY: bbox.max.y
          });

          // Create ground BVH for raycasting
          child.geometry.computeBoundsTree();
          
          // Visual debug (blue wireframe for ground)
          if (!this.debugHelpersCreated) {
            const wireframeGeometry = child.geometry.clone();
            const wireframeMaterial = new THREE.MeshBasicMaterial({
              color: 0x0066ff,
              wireframe: true,
              transparent: true,
              opacity: 0.2
            });
            const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
            
            child.updateWorldMatrix(true, false);
            wireframeMesh.applyMatrix4(child.matrixWorld);
            
            this.scene.add(wireframeMesh);
            this.bvhVisualizers.push(wireframeMesh);
          }
          
          groundMeshesFound++;
        }
      }
    });
    
    console.log(`Ground collision system setup complete: ${groundMeshesFound} ground meshes processed`);
    
    if (groundMeshesFound === 0) {
      console.warn('⚠️ No ground collision meshes found. Creating fallback ground collision...');
      this.createFallbackGroundCollision();
    }
  }

  // Create fallback ground collision at y=0.3 (default ground height)
  createFallbackGroundCollision() {
    console.log('Creating fallback ground collision plane...');
    
    // Create a large invisible ground plane as fallback
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00, 
      transparent: true, 
      opacity: 0.1, 
      visible: false 
    });
    
    const fallbackGround = new THREE.Mesh(groundGeometry, groundMaterial);
    fallbackGround.rotation.x = -Math.PI / 2;
    fallbackGround.position.set(0, 0.3, 0); // Match the raised ground height
    fallbackGround.name = 'fallback_ground';
    
    // Add to scene but make invisible
    fallbackGround.visible = false;
    this.scene.add(fallbackGround);
    
    // Add to ground colliders
    fallbackGround.geometry.computeBoundingBox();
    fallbackGround.geometry.computeBoundsTree();
    
    this.groundColliders.push({
      mesh: fallbackGround,
      name: 'fallback_ground',
      type: 'fallback-ground',
      bbox: new THREE.Box3(
        new THREE.Vector3(-250, 0.2, -250),
        new THREE.Vector3(250, 0.4, 250)
      ),
      minY: 0.2,
      maxY: 0.4
    });
    
    console.log('Fallback ground collision created at y=0.3');
  }

  // Simple but RELIABLE collision detection using raycasting
  checkBVHCollisions() {
    if (!this.droneModel || this.bvhColliders.length === 0) return;
    
    const currentPos = this.droneState.pos.clone();
    const velocity = this.droneState.vel.clone();
    const deltaTime = 0.016; // Assume 60fps
    
    // Calculate where drone WILL BE next frame
    const nextPos = currentPos.clone().addScaledVector(velocity, deltaTime);
    
    // Check if movement would cause collision
    const moveDirection = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
    const moveDistance = currentPos.distanceTo(nextPos);
    
    // Cast multiple rays from drone in movement direction
    const raycaster = new THREE.Raycaster();
    const droneRadius = 1.0; // Safety radius
    
    // Main ray in movement direction
    raycaster.set(currentPos, moveDirection);
    
    // Get all collision meshes for raycasting
    const collisionMeshes = this.bvhColliders.map(collider => collider.mesh);
    
    // Check main movement ray
    const intersects = raycaster.intersectObjects(collisionMeshes, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const hitDistance = hit.distance;
      
      // If collision would happen within drone radius + movement
      if (hitDistance < droneRadius + moveDistance) {
        console.warn(`Blocking collision with: ${hit.object.name || 'unknown'}`);
        
        // STOP the drone movement completely
        this.blockMovement(hit, currentPos, moveDirection);
        return;
      }
    }
    
    // Additional safety: Check if drone is currently inside any mesh
    this.checkIfInsideMesh(currentPos);
    
    // GROUND COLLISION - Prevent drone from going below terrain
    this.checkGroundCollision(currentPos, nextPos);
  }
  
  // Block movement and provide collision response
  blockMovement(hit, currentPos, moveDirection) {
    // Stop drone at safe distance from collision
    const safeDistance = 1.2;
    const hitNormal = hit.normal;
    
    // Position drone at safe distance from hit point
    const safePos = hit.point.clone().addScaledVector(hitNormal, safeDistance);
    this.droneState.pos.copy(safePos);
    
    // Remove velocity component going into collision
    const velocityIntoSurface = this.droneState.vel.dot(hitNormal.clone().negate());
    if (velocityIntoSurface > 0) {
      this.droneState.vel.addScaledVector(hitNormal.clone().negate(), -velocityIntoSurface);
    }
    
    // Add bounce effect
    this.droneState.vel.addScaledVector(hitNormal, 2.0);
    
    // Flash hit object red
    // if (hit.object.material && hit.object.material.color) {
    //   const originalColor = hit.object.material.color.clone();
    //   hit.object.material.color.setHex(0xff0000);
    //   setTimeout(() => {
    //     hit.object.material.color.copy(originalColor);
    //   }, 200);
    // }
  }
  
  // Emergency check if drone somehow got inside mesh
  checkIfInsideMesh(currentPos) {
    const raycaster = new THREE.Raycaster();
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ];
    
    const collisionMeshes = this.bvhColliders.map(collider => collider.mesh);
    
    directions.forEach(direction => {
      raycaster.set(currentPos, direction);
      const intersects = raycaster.intersectObjects(collisionMeshes, true);
      
      if (intersects.length > 0 && intersects[0].distance < 0.5) {
        console.error("Drone inside mesh! Emergency escape!");
        // Emergency teleport upward
        this.droneState.pos.y += 3.0;
        this.droneState.vel.set(0, 5, 0); // Strong upward velocity
      }
    });
  }

  // Ground collision detection - prevent drone from going below terrain
  checkGroundCollision(currentPos, nextPos) {
    if (this.groundColliders.length === 0) return;
    
    const droneRadius = 1.2; 
    const minimumHeight = 1.5; 
    
    // Cast ray downward from drone to find ground height
    const raycaster = new THREE.Raycaster();
    const downDirection = new THREE.Vector3(0, -1, 0);
    
    // Cast from current position
    raycaster.set(currentPos, downDirection);
    
    // Get all ground meshes for raycasting
    const groundMeshes = this.groundColliders.map(collider => collider.mesh);
    const groundIntersects = raycaster.intersectObjects(groundMeshes, true);
    
    if (groundIntersects.length > 0) {
      const groundHit = groundIntersects[0];
      const groundHeight = groundHit.point.y;
      const requiredHeight = groundHeight + droneRadius;
      
      // If drone is too close to ground, adjust position
      if (currentPos.y < requiredHeight) {
        console.log(`Ground collision detected! Ground height: ${groundHeight.toFixed(2)}, Drone height: ${currentPos.y.toFixed(2)}, Required: ${requiredHeight.toFixed(2)}`);
        
        // IMMEDIATELY push drone to safe height (no gradual adjustment)
        this.droneState.pos.y = requiredHeight + 0.2; // Extra buffer
        
        // COMPLETELY stop downward velocity
        if (this.droneState.vel.y < 0) {
          this.droneState.vel.y = 0;
        }
        
        // Add stronger upward bounce to prevent re-collision
        this.droneState.vel.y += 3.0;
        
        // Also prevent future downward movement for a moment
        setTimeout(() => {
          if (this.droneState.vel.y < 1.0) {
            this.droneState.vel.y = 1.0; // Minimum upward velocity
          }
        }, 100);
      }
    } else {
      // No ground detected - use fallback minimum height
      if (currentPos.y < minimumHeight) {
        console.log(`Using fallback ground height: ${minimumHeight}`);
        this.droneState.pos.y = minimumHeight;
        
        if (this.droneState.vel.y < 0) {
          this.droneState.vel.y = 0;
        }
        
        this.droneState.vel.y += 1.0;
      }
    }
    
    // Enhanced predictive check: Cast ray from next position too
    if (nextPos.y < currentPos.y) { // Only check if moving downward
      raycaster.set(nextPos, downDirection);
      const futureGroundIntersects = raycaster.intersectObjects(groundMeshes, true);
      
      if (futureGroundIntersects.length > 0) {
        const futureGroundHeight = futureGroundIntersects[0].point.y;
        const futureRequiredHeight = futureGroundHeight + droneRadius;
        
        if (nextPos.y < futureRequiredHeight) {
          console.log(`Preventing future ground collision! Future ground: ${futureGroundHeight.toFixed(2)}, Future drone: ${nextPos.y.toFixed(2)}`);
          // STRONGLY prevent movement that would cause ground collision
          this.droneState.vel.y = Math.max(2.0, this.droneState.vel.y); // Force upward movement
        }
      }
    }
    
    // Emergency check: If drone is moving down too fast near ground, force upward
    if (currentPos.y - 2.0 < minimumHeight && this.droneState.vel.y < -5.0) {
      console.log("Emergency ground collision prevention!");
      this.droneState.vel.y = 3.0; // Force strong upward velocity
      this.droneState.pos.y = Math.max(this.droneState.pos.y, minimumHeight + 1.0);
    }
  }

  // Create fallback city structures if GLTF fails to load
  createFallbackCity() {
    console.log('Creating fallback city structures...');
    
    const cityGroup = new THREE.Group();
    const buildingPositions = [
      { x: 100, z: -20, width: 8, height: 15, depth: 8, color: 0x666666 },
      { x: 90, z: -10, width: 6, height: 20, depth: 6, color: 0x777777 },
      { x: 110, z: -15, width: 10, height: 12, depth: 10, color: 0x555555 },
      { x: 85, z: 5, width: 7, height: 18, depth: 7, color: 0x888888 },
      { x: 105, z: 10, width: 9, height: 14, depth: 9, color: 0x666666 },
      { x: 120, z: 0, width: 8, height: 16, depth: 8, color: 0x777777 }
    ];
    
    buildingPositions.forEach((building, index) => {
      // Main building structure
      const buildingGeometry = new THREE.BoxGeometry(building.width, building.height, building.depth);
      const buildingMaterial = new THREE.MeshLambertMaterial({ 
        color: building.color,
        transparent: true,
        opacity: 0.9
      });
      const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
      buildingMesh.position.set(building.x, building.height / 2 + 0.3, building.z);
      buildingMesh.castShadow = true;
      buildingMesh.receiveShadow = true;
      
      cityGroup.add(buildingMesh);
      
      // Add simple windows
      for (let floor = 1; floor < building.height / 3; floor++) {
        for (let side = 0; side < 4; side++) {
          const windowGeometry = new THREE.PlaneGeometry(0.8, 0.8);
          const windowMaterial = new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.7 ? 0xffff88 : 0x333333, // Some windows lit
            transparent: true,
            opacity: 0.8
          });
          const window = new THREE.Mesh(windowGeometry, windowMaterial);
          
          const angle = (side * Math.PI) / 2;
          const radius = building.width * 0.5 + 0.01;
          window.position.set(
            building.x + Math.cos(angle) * radius,
            floor * 3 + 0.3,
            building.z + Math.sin(angle) * radius
          );
          window.rotation.y = angle;
          
          cityGroup.add(window);
        }
      }
      
      // Add collision detection for each building
      this.environmentColliders.push({
        position: new THREE.Vector3(building.x, building.height / 2 + 0.3, building.z),
        radius: Math.max(building.width, building.depth) * 0.6,
        type: `fallback-building-${index}`,
        mesh: buildingMesh
      });
    });
    
    this.scene.add(cityGroup);
    this.objects.push({ mesh: cityGroup, type: 'fallback-city' });
    console.log('Fallback city structures created successfully');
  }

    //load the natural ground polycab model with position parameters
    async loadGround(url = '/natural_ground_lowpoly/scene.gltf', scaleX = 3.0, scaleZ = 3.0, scaleY = 1.0, posX = 0, posY = 0, posZ = 0) {
      const manager = new THREE.LoadingManager();
      manager.setURLModifier((requestedUrl) => {
        // console.log('[GROUND] Loading resource:', requestedUrl);
        return requestedUrl;
      });

      const loader = new GLTFLoader(manager);

      try {
        // console.log(`Loading ground model from: ${url} at position (${posX}, ${posY}, ${posZ})`);
        const gltf = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });

        const groundModel = gltf.scene;
        groundModel.position.set(posX, posY, posZ);
        
        // Scale differently on X, Y, Z axes
        groundModel.scale.set(scaleX, scaleY, scaleZ);
        // console.log(`Ground scaled: X=${scaleX}, Y=${scaleY}, Z=${scaleZ} at position (${posX}, ${posY}, ${posZ})`);
        
        // console.log('Ground model loaded successfully');
        
        // Enable shadows for all ground meshes
        groundModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false; // Ground doesn't cast shadows
            child.receiveShadow = true; // But receives shadows from drone
            
            // Optimize materials if needed
            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });

        this.scene.add(groundModel);
        this.objects.push({ mesh: groundModel, type: 'ground', gltf });
        
        return groundModel;
      } catch (error) {
        console.error('Error loading ground model:', error);
        
        // Fallback to simple ground plane if ground model fails to load
        console.log('Falling back to simple ground plane...');
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
          color: 0x2d3436,
          transparent: false
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.position.set(posX, posY, posZ);
        this.scene.add(ground);
        
        throw error;
      }
    }

  // Create racing track with varied hoops and expanded area
  createRaceTrack() {
    console.log('Creating expanded racing track with varied hoops - ORIGINAL + LEFT DUPLICATE...');
    
    // Define multiple track sections with different radii and heights
    const originalTrackSections = [
      { radius: 25, height: 13, centerX: 0, centerZ: 0, hoops: 4 },      // Inner track
      { radius: 45, height: 18, centerX: 30, centerZ: 40, hoops: 6 },    // Outer track 1
      { radius: 35, height: 22, centerX: -40, centerZ: 30, hoops: 5 },   // Outer track 2
      { radius: 28, height: 8, centerX: 0, centerZ: -50, hoops: 3 }      // Low track
    ];
    
    // Create LEFT DUPLICATE of track sections (shifted -140 units on X axis)
    const leftTrackSections = [
      { radius: 25, height: 13, centerX: -140, centerZ: 0, hoops: 4 },      // Left Inner track
      { radius: 45, height: 18, centerX: -110, centerZ: 40, hoops: 6 },     // Left Outer track 1
      { radius: 35, height: 22, centerX: -180, centerZ: 30, hoops: 5 },     // Left Outer track 2
      { radius: 28, height: 8, centerX: -140, centerZ: -50, hoops: 3 }      // Left Low track
    ];
    
    // Combine original and left track sections
    const allTrackSections = [...originalTrackSections, ...leftTrackSections];
    
    let totalHoops = 0;
    
    allTrackSections.forEach((section, sectionIndex) => {
      const hoopPositions = [];
      
      // Generate hoop positions for this section
      for (let i = 0; i < section.hoops; i++) {
        const angle = (i / section.hoops) * Math.PI * 2;
        const x = section.centerX + Math.cos(angle) * section.radius;
        const z = section.centerZ + Math.sin(angle) * section.radius;
        const y = section.height + Math.sin(angle * 3) * 4; // Varied height pattern
        hoopPositions.push({ x, y, z, angle, sectionIndex });
      }
      
      // Create hoops for this section
      hoopPositions.forEach((pos, localIndex) => {
        const globalIndex = totalHoops + localIndex;
        this.createVariedRaceHoop(pos, globalIndex, sectionIndex);
      });
      
      // Create connecting strips within this section
      for (let i = 0; i < hoopPositions.length; i++) {
        const nextIndex = (i + 1) % hoopPositions.length;
        this.createConnectingStrip(hoopPositions[i], hoopPositions[nextIndex]);
      }
      
      totalHoops += section.hoops;
    });
    
    this.raceTrack.totalCheckpoints = totalHoops;
    console.log(`Expanded race track created with ${totalHoops} varied hoops across ${allTrackSections.length} sections`);
  }

  // Create varied race hoops with different shapes and sizes
  createVariedRaceHoop(position, index, sectionIndex) {
    const hoopTypes = [
      { type: 'torus', params: [3, 0.2], color: 0xff6b00, name: 'Standard Torus' },
      { type: 'square', params: [4, 0.3], color: 0x00ff88, name: 'Square Ring' },
      { type: 'hexagon', params: [3.5, 0.25], color: 0xff3366, name: 'Hexagon Ring' },
      { type: 'triangle', params: [4.5, 0.35], color: 0x6644ff, name: 'Triangle Ring' },
      { type: 'double', params: [2.5, 0.15], color: 0xffaa00, name: 'Double Ring' },
      { type: 'oval', params: [3.2, 0.2], color: 0x44ffff, name: 'Oval Ring' }
    ];
    
    // Select hoop type based on section and index for variety
    const typeIndex = (sectionIndex + index) % hoopTypes.length;
    const hoopType = hoopTypes[typeIndex];
    
    let hoop;
    
    switch(hoopType.type) {
      case 'torus':
        hoop = this.createTorusHoop(position, hoopType.params, hoopType.color);
        break;
      case 'square':
        hoop = this.createSquareHoop(position, hoopType.params, hoopType.color);
        break;
      case 'hexagon':
        hoop = this.createHexagonHoop(position, hoopType.params, hoopType.color);
        break;
      case 'triangle':
        hoop = this.createTriangleHoop(position, hoopType.params, hoopType.color);
        break;
      case 'double':
        hoop = this.createDoubleHoop(position, hoopType.params, hoopType.color);
        break;
      case 'oval':
        hoop = this.createOvalHoop(position, hoopType.params, hoopType.color);
        break;
      default:
        hoop = this.createTorusHoop(position, hoopType.params, hoopType.color);
    }
    
    // Store hoop data for collision detection
    this.raceTrack.hoops.push({
      mesh: hoop.main,
      glow: hoop.glow,
      position: position,
      index: index,
      passed: false,
      type: hoopType.name,
      boundingSphere: new THREE.Sphere(new THREE.Vector3(position.x, position.y, position.z), hoopType.params[0])
    });
    
    this.objects.push({ mesh: hoop.main, type: 'hoop', index: index });
    this.objects.push({ mesh: hoop.glow, type: 'hoop-glow', index: index });
  }

  // Standard torus hoop
  createTorusHoop(position, params, color) {
    const hoopGeometry = new THREE.TorusGeometry(params[0], params[1], 8, 16);
    const hoopMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
      transparent: true,
      opacity: 0.8
    });
    
    const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
    hoop.position.set(position.x, position.y, position.z);
    hoop.rotation.y = position.angle + Math.PI / 16;
    hoop.rotation.x = Math.PI / 12;
    
    const glowGeometry = new THREE.TorusGeometry(params[0] + 0.5, params[1] + 0.05, 8, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(hoop.position);
    glow.rotation.copy(hoop.rotation);
    
    this.scene.add(hoop);
    this.scene.add(glow);
    
    return { main: hoop, glow: glow };
  }

  // Square ring hoop
  createSquareHoop(position, params, color) {
    const size = params[0];
    const thickness = params[1];
    
    const hoopGroup = new THREE.Group();
    const glowGroup = new THREE.Group();
    
    // Create 4 sides of square
    for (let i = 0; i < 4; i++) {
      const sideGeometry = new THREE.BoxGeometry(size, thickness, thickness);
      const sideMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: new THREE.Color(color).multiplyScalar(0.1),
        transparent: true,
        opacity: 0.8
      });
      
      const side = new THREE.Mesh(sideGeometry, sideMaterial);
      const angle = (i * Math.PI) / 2;
      const radius = size / 2;
      
      side.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
      side.rotation.z = angle;
      
      hoopGroup.add(side);
      
      // Glow version
      const glowGeometry = new THREE.BoxGeometry(size + 0.2, thickness + 0.1, thickness + 0.1);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
      });
      const glowSide = new THREE.Mesh(glowGeometry, glowMaterial);
      glowSide.position.copy(side.position);
      glowSide.rotation.copy(side.rotation);
      glowGroup.add(glowSide);
    }
    
    hoopGroup.position.set(position.x, position.y, position.z);
    hoopGroup.rotation.y = position.angle + Math.PI / 16;
    hoopGroup.rotation.x = Math.PI / 12;
    
    glowGroup.position.copy(hoopGroup.position);
    glowGroup.rotation.copy(hoopGroup.rotation);
    
    this.scene.add(hoopGroup);
    this.scene.add(glowGroup);
    
    return { main: hoopGroup, glow: glowGroup };
  }

  // Hexagon ring hoop
  createHexagonHoop(position, params, color) {
    const radius = params[0];
    const thickness = params[1];
    
    const hoopGeometry = new THREE.RingGeometry(radius - thickness, radius + thickness, 6);
    const hoopMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
    hoop.position.set(position.x, position.y, position.z);
    hoop.rotation.y = position.angle + Math.PI / 16;
    hoop.rotation.x = Math.PI / 12;
    
    const glowGeometry = new THREE.RingGeometry(radius - thickness - 0.2, radius + thickness + 0.2, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(hoop.position);
    glow.rotation.copy(hoop.rotation);
    
    this.scene.add(hoop);
    this.scene.add(glow);
    
    return { main: hoop, glow: glow };
  }

  // Triangle ring hoop
  createTriangleHoop(position, params, color) {
    const size = params[0];
    const thickness = params[1];
    
    const hoopGeometry = new THREE.RingGeometry(size - thickness, size + thickness, 3);
    const hoopMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
    hoop.position.set(position.x, position.y, position.z);
    hoop.rotation.y = position.angle + Math.PI / 16;
    hoop.rotation.x = Math.PI / 12;
    
    const glowGeometry = new THREE.RingGeometry(size - thickness - 0.2, size + thickness + 0.2, 3);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(hoop.position);
    glow.rotation.copy(hoop.rotation);
    
    this.scene.add(hoop);
    this.scene.add(glow);
    
    return { main: hoop, glow: glow };
  }

  // Double ring hoop
  createDoubleHoop(position, params, color) {
    const radius = params[0];
    const thickness = params[1];
    
    const hoopGroup = new THREE.Group();
    const glowGroup = new THREE.Group();
    
    // Inner ring
    const innerGeometry = new THREE.TorusGeometry(radius, thickness, 8, 16);
    const innerMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
      transparent: true,
      opacity: 0.8
    });
    const innerRing = new THREE.Mesh(innerGeometry, innerMaterial);
    hoopGroup.add(innerRing);
    
    // Outer ring
    const outerGeometry = new THREE.TorusGeometry(radius + 1.5, thickness, 8, 16);
    const outerRing = new THREE.Mesh(outerGeometry, innerMaterial);
    hoopGroup.add(outerRing);
    
    // Glow versions
    const innerGlowGeometry = new THREE.TorusGeometry(radius + 0.3, thickness + 0.05, 8, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, glowMaterial);
    glowGroup.add(innerGlow);
    
    const outerGlowGeometry = new THREE.TorusGeometry(radius + 1.8, thickness + 0.05, 8, 16);
    const outerGlow = new THREE.Mesh(outerGlowGeometry, glowMaterial);
    glowGroup.add(outerGlow);
    
    hoopGroup.position.set(position.x, position.y, position.z);
    hoopGroup.rotation.y = position.angle + Math.PI / 16;
    hoopGroup.rotation.x = Math.PI / 12;
    
    glowGroup.position.copy(hoopGroup.position);
    glowGroup.rotation.copy(hoopGroup.rotation);
    
    this.scene.add(hoopGroup);
    this.scene.add(glowGroup);
    
    return { main: hoopGroup, glow: glowGroup };
  }

  // Oval ring hoop
  createOvalHoop(position, params, color) {
    const radiusX = params[0];
    const radiusY = params[0] * 0.6; // Make it oval
    const thickness = params[1];
    
    // Create oval shape using ellipse curve
    const curve = new THREE.EllipseCurve(
      0, 0,            // center
      radiusX, radiusY, // radii
      0, 2 * Math.PI,  // start/end angle
      false,           // clockwise
      0                // rotation
    );
    
    const points = curve.getPoints(32);
    const shape = new THREE.Shape(points);
    
    // Create hole
    const holeRadius = radiusX - thickness;
    const holeRadiusY = radiusY - thickness;
    const holeCurve = new THREE.EllipseCurve(
      0, 0,
      holeRadius, holeRadiusY,
      0, 2 * Math.PI,
      false,
      0
    );
    const holePoints = holeCurve.getPoints(32);
    const hole = new THREE.Path(holePoints);
    shape.holes.push(hole);
    
    const hoopGeometry = new THREE.ShapeGeometry(shape);
    const hoopMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: new THREE.Color(color).multiplyScalar(0.1),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const hoop = new THREE.Mesh(hoopGeometry, hoopMaterial);
    hoop.position.set(position.x, position.y, position.z);
    hoop.rotation.y = position.angle + Math.PI / 16;
    hoop.rotation.x = Math.PI / 12;
    
    // Simple glow version
    const glowGeometry = new THREE.TorusGeometry(radiusX + 0.3, thickness + 0.1, 8, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(hoop.position);
    glow.rotation.copy(hoop.rotation);
    glow.scale.set(1, 0.6, 1); // Make glow oval too
    
    this.scene.add(hoop);
    this.scene.add(glow);
    
    return { main: hoop, glow: glow };
  }

  // Create connecting strip between hoops
  createConnectingStrip(pos1, pos2) {
    const distance = Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) +
      Math.pow(pos2.y - pos1.y, 2) +
      Math.pow(pos2.z - pos1.z, 2)
    );
    
    // Smaller, thinner strips
    const stripGeometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 6); // Reduced from (0.1, 0.1, distance, 8)
    const stripMaterial = new THREE.MeshPhongMaterial({
      color: 0x4444ff,
      emissive: 0x001122,
      transparent: true,
      opacity: 0.6
    });
    
    const strip = new THREE.Mesh(stripGeometry, stripMaterial);
    
    // Position strip between two hoops
    strip.position.set(
      (pos1.x + pos2.x) / 2,
      (pos1.y + pos2.y) / 2,
      (pos1.z + pos2.z) / 2
    );
    
    // Orient strip to connect the hoops
    const direction = new THREE.Vector3(pos2.x - pos1.x, pos2.y - pos1.y, pos2.z - pos1.z);
    strip.lookAt(new THREE.Vector3().addVectors(strip.position, direction));
    strip.rotateX(Math.PI / 2);
    
    this.scene.add(strip);
    this.raceTrack.strips.push(strip);
    this.objects.push({ mesh: strip, type: 'track-strip' });
  }

  // Check hoop collision and race progress with varied hoop sizes
  checkHoopCollisions() {
    if (!this.droneModel || this.raceTrack.hoops.length === 0) return;
    
    const dronePosition = this.droneState.pos;
    const currentHoop = this.raceTrack.hoops[this.raceTrack.currentCheckpoint];
    
    if (currentHoop && !currentHoop.passed) {
      const distance = dronePosition.distanceTo(new THREE.Vector3(
        currentHoop.position.x,
        currentHoop.position.y,
        currentHoop.position.z
      ));
      
      // Dynamic collision detection based on hoop bounding sphere
      const collisionRadius = currentHoop.boundingSphere.radius;
      
      if (distance < collisionRadius) {
        this.passedThroughHoop(currentHoop);
      }
    }
  }

  // Check environment object collisions
  // BOX3 COLLISION DETECTION - COMMENTED OUT FOR BVH IMPLEMENTATION
  // checkEnvironmentCollisions() {
  //   if (!this.droneModel || this.environmentColliders.length === 0) return;
    
  //   // Throttle collision detection - only check every 3rd frame for better performance
  //   this.collisionCheckInterval++;
  //   if (this.collisionCheckInterval < 3) return;
  //   this.collisionCheckInterval = 0;

  //   const dronePosition = this.droneState.pos;
  //   const droneRadius = 0.8; // Drone collision radius
    
  //   this.environmentColliders.forEach(collider => {
  //     // Use box collision detection instead of spherical
  //     let collision = false;
  //     let distance = 0;
      
  //     if (collider.box) {
  //       // Check if drone is inside the bounding box (expanded by drone radius)
  //       const expandedBox = collider.box.clone();
  //       expandedBox.expandByScalar(droneRadius);
        
  //       if (expandedBox.containsPoint(dronePosition)) {
  //         collision = true;
  //         distance = dronePosition.distanceTo(collider.position);
  //       }
  //     } else if (collider.radius) {
  //       // Fallback to old spherical collision for backwards compatibility
  //       distance = dronePosition.distanceTo(collider.position);
  //       collision = distance < (collider.radius + droneRadius);
  //     }
      
  //     if (collision) {
  //       // Collision detected - apply response
  //       console.warn(`Collision detected of ${collider.meshName || collider.type} at distance ${distance.toFixed(2)}`);
  //       this.handleEnvironmentCollision(collider, dronePosition);
  //     }
  //   });
  // }  // Handle collision response with environment objects
  handleEnvironmentCollision(collider, dronePosition) {
    // Calculate collision normal (direction from object to drone)
    const collisionNormal = new THREE.Vector3()
      .subVectors(dronePosition, collider.position)
      .normalize();
    
    // Push drone away from the object
    let pushDistance;
    if (collider.box) {
      // For box collision, push to nearest edge of box + drone radius
      const boxSize = collider.size;
      const maxDimension = Math.max(boxSize.x, boxSize.z);
      pushDistance = maxDimension * 0.7 + 0.8; // 70% of max dimension + drone radius
    } else {
      // Fallback to old spherical collision
      pushDistance = collider.radius + 0.8; // Drone radius
    }
    
    const targetPosition = new THREE.Vector3()
      .copy(collider.position)
      .addScaledVector(collisionNormal, pushDistance);
    
    // Smooth position correction
    this.droneState.pos.lerp(targetPosition, 0.3);
    
    // Reduce velocity in collision direction
    const velocityInNormal = this.droneState.vel.dot(collisionNormal);
    if (velocityInNormal < 0) {
      this.droneState.vel.addScaledVector(collisionNormal, -velocityInNormal * 0.8);
    }
    
    // Add some bounce effect based on object type
    let bounceStrength = 2;
    if (collider.type.includes('city-mesh')) {
      // Different bounce effects for different city objects
      if (collider.meshName && collider.meshName.includes('Building')) {
        bounceStrength = 3; // Buildings provide stronger bounce
      } else if (collider.meshName && collider.meshName.includes('Tree')) {
        bounceStrength = 1.5; // Trees provide softer bounce
      } else if (collider.meshName && collider.meshName.includes('Car')) {
        bounceStrength = 2.5; // Cars provide medium bounce
      }
    }
    this.droneState.vel.addScaledVector(collisionNormal, bounceStrength);
    
    // Enhanced visual feedback for city meshes
    if (collider.mesh && collider.mesh.material) {
      const originalColor = collider.mesh.material.color.clone();
      
      // Different flash colors for different city objects
      let flashColor = 0xff4444; // Default red
      if (collider.type.includes('city-mesh')) {
        if (collider.meshName && collider.meshName.includes('Building')) {
          flashColor = 0xff6600; // Orange for buildings
        } else if (collider.meshName && collider.meshName.includes('Tree')) {
          flashColor = 0xffff00; // Yellow for trees
        } else if (collider.meshName && collider.meshName.includes('Car')) {
          flashColor = 0xff0066; // Pink for cars
        }
      }
      
      collider.mesh.material.color.setHex(flashColor);
      setTimeout(() => {
        if (collider.mesh && collider.mesh.material) {
          collider.mesh.material.color.copy(originalColor);
        }
      }, 200);
    }
    
    // Enhanced logging for city mesh collisions
    const objectType = collider.meshName || collider.type;
    console.log(`Collision with ${objectType} at distance ${dronePosition.distanceTo(collider.position).toFixed(2)}`);
  }

  // Handle hoop passage
  passedThroughHoop(hoop) {
    hoop.passed = true;
    
    // Handle different hoop types (single mesh vs group)
    if (hoop.mesh.material) {
      // Single mesh hoop (torus, hexagon, triangle, oval)
      hoop.mesh.material.color.setHex(0x00ff00);
      hoop.mesh.material.emissive.setHex(0x002200);
    } else if (hoop.mesh.children && hoop.mesh.children.length > 0) {
      // Group hoop (square, double ring)
      hoop.mesh.children.forEach(child => {
        if (child.material) {
          child.material.color.setHex(0x00ff00);
          if (child.material.emissive) {
            child.material.emissive.setHex(0x002200);
          }
        }
      });
    }
    
    // Handle glow effect
    if (hoop.glow.material) {
      // Single glow mesh
      hoop.glow.material.color.setHex(0x00ff00);
    } else if (hoop.glow.children && hoop.glow.children.length > 0) {
      // Group glow
      hoop.glow.children.forEach(child => {
        if (child.material) {
          child.material.color.setHex(0x00ff00);
        }
      });
    }
    
    console.log(`Passed through hoop ${hoop.index + 1}/${this.raceTrack.totalCheckpoints} (${hoop.type})`);
    
    this.raceTrack.currentCheckpoint++;
    
    // Check if race completed
    if (this.raceTrack.currentCheckpoint >= this.raceTrack.totalCheckpoints) {
      this.completeRace();
    } else {
      // Highlight next hoop
      const nextHoop = this.raceTrack.hoops[this.raceTrack.currentCheckpoint];
      if (nextHoop) {
        this.highlightNextHoop(nextHoop);
      }
    }
  }

  // Highlight the next hoop to pass through
  highlightNextHoop(hoop) {
    // Handle different hoop types for highlighting
    if (hoop.mesh.material) {
      // Single mesh hoop
      if (hoop.mesh.material.emissive) {
        hoop.mesh.material.emissive.setHex(0x444400); // Yellow glow for next hoop
      }
    } else if (hoop.mesh.children && hoop.mesh.children.length > 0) {
      // Group hoop
      hoop.mesh.children.forEach(child => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(0x444400);
        }
      });
    }
  }

  // Complete race
  completeRace() {
    const raceTime = (performance.now() - this.raceTrack.startTime) / 1000;
    console.log(`Race completed! Time: ${raceTime.toFixed(2)} seconds`);
    
    if (!this.raceTrack.bestTime || raceTime < this.raceTrack.bestTime) {
      this.raceTrack.bestTime = raceTime;
      console.log('New best time!');
    }
    
    // Reset race
    setTimeout(() => {
      this.resetRace();
    }, 3000);
  }

  // Reset race
  // Create environment objects for racing track atmosphere
  createEnvironmentObjects() {
    console.log('Creating racing environment objects...');
    
    this.createTrees();
    this.createGrassPatches();
    this.createRacingFlags();
    this.createAdvertisementBanners();
    this.createStartFinishLine();
    this.createSpectatorStands();
    this.createBarriers();
    
    console.log('Racing environment created successfully');
  }

  // Create simple trees around the track
  createTrees() {
    console.log('Creating enhanced forest environment within ground boundaries...');
    
    // Define ground boundaries based on our extended ground layout
    // Ground extends from approximately X: -220 to +80, Z: -80 to +80
    const groundBounds = {
      minX: -210,
      maxX: 70,
      minZ: -75,
      maxZ: 75
    };
    
    // Primary tree positions (larger trees) - positioned within ground bounds
    const primaryTreePositions = [
      { x: -60, z: -60 }, { x: -60, z: 60 }, { x: 60, z: -60 }, { x: 60, z: 60 },
      { x: -80, z: 0 }, { x: 60, z: 0 }, { x: 0, z: -70 }, { x: 0, z: 70 },
      { x: -40, z: -40 }, { x: 40, z: 40 }, { x: -40, z: 40 }, { x: 40, z: -40 },
      { x: -120, z: -30 }, { x: -120, z: 30 }, { x: -180, z: 0 }, { x: -30, z: 70 }, { x: 30, z: -70 },
      // Add more trees on the extended left ground area
      { x: -140, z: -60 }, { x: -140, z: 60 }, { x: -180, z: -40 }, { x: -180, z: 40 },
      { x: -200, z: 0 }, { x: -160, z: 0 }, { x: -100, z: -60 }, { x: -100, z: 60 }
    ];
    
    // Add more secondary trees for forest feel - within ground boundaries
    const secondaryTreePositions = [];
    for (let i = 0; i < 35; i++) { // Increased to 35 for larger area
      let x, z, attempts = 0;
      let validPosition = false;
      
      while (!validPosition && attempts < 50) {
        // Generate random position within ground bounds
        x = groundBounds.minX + Math.random() * (groundBounds.maxX - groundBounds.minX);
        z = groundBounds.minZ + Math.random() * (groundBounds.maxZ - groundBounds.minZ);
        
        // Ensure distance from center racing area (avoid track area)
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        if (distanceFromCenter < 35) {
          attempts++;
          continue; // Too close to center racing area
        }
        
        // Check distance from existing trees
        let tooClose = false;
        for (const pos of [...primaryTreePositions, ...secondaryTreePositions]) {
          const dist = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
          if (dist < 15) { // Minimum 15 units apart
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          validPosition = true;
        }
        attempts++;
      }
      
      if (validPosition) {
        secondaryTreePositions.push({ x: Math.round(x), z: Math.round(z) });
      }
    }
    
    const allTreePositions = [...primaryTreePositions, ...secondaryTreePositions];
    console.log(`Placing ${allTreePositions.length} trees within ground boundaries`);
    
    allTreePositions.forEach((pos, index) => {
      const treeGroup = new THREE.Group();
      
      // More varied tree sizes
      const isPrimary = index < primaryTreePositions.length;
      const baseHeight = isPrimary ? 3 : 2;
      const trunkHeight = baseHeight + Math.random() * (isPrimary ? 4 : 2);
      const trunkRadius = isPrimary ? 0.3 + Math.random() * 0.2 : 0.2 + Math.random() * 0.15;
      
      // Tree trunk with more realistic proportions
      const trunkGeometry = new THREE.CylinderGeometry(
        trunkRadius * 0.8, // Top slightly smaller
        trunkRadius, 
        trunkHeight, 
        8
      );
      const trunkMaterial = new THREE.MeshLambertMaterial({ 
        color: new THREE.Color().setHSL(0.1, 0.6, 0.2 + Math.random() * 0.15) // Brown variations
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = trunkHeight / 2 + 0.3;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      
      // Tree canopy - more realistic with varied sizes
      const canopyColors = [0x228B22, 0x32CD32, 0x006400, 0x2E8B57, 0x3CB371];
      const canopyCount = isPrimary ? 4 : 3;
      
      for (let i = 0; i < canopyCount; i++) {
        const canopySize = (isPrimary ? 1.8 : 1.2) + Math.random() * (isPrimary ? 2 : 1.5);
        const canopyGeometry = new THREE.SphereGeometry(canopySize, 8, 6);
        const canopyMaterial = new THREE.MeshLambertMaterial({ 
          color: canopyColors[Math.floor(Math.random() * canopyColors.length)]
        });
        const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
        canopy.position.set(
          (Math.random() - 0.5) * (isPrimary ? 2 : 1.5),
          trunkHeight + canopySize * 0.6 + (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * (isPrimary ? 2 : 1.5)
        );
        canopy.castShadow = true;
        treeGroup.add(canopy);
      }
      
      treeGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(treeGroup);
      this.objects.push({ mesh: treeGroup, type: 'tree' });
      
      // Enhanced collision detection with better radius calculation
      const collisionRadius = isPrimary ? 3.2 : 2.5; // Larger trees have bigger collision
      this.environmentColliders.push({
        position: new THREE.Vector3(pos.x, trunkHeight / 2 + 0.3, pos.z),
        radius: collisionRadius,
        type: isPrimary ? 'tree-large' : 'tree-small',
        mesh: treeGroup
      });
      
      // if (index % 10 === 0) { 
      //   console.log(`Trees created: ${index + 1}/${allTreePositions.length}`);
      // }
    });
    
    console.log(`Forest environment completed - ${allTreePositions.length} trees with enhanced collision detection`);
  }

  // Create grass patches for natural look
  createGrassPatches() {
    console.log('Creating enhanced grass coverage within ground boundaries...');
    
    // Define ground boundaries matching our extended ground layout
    const groundBounds = {
      minX: -210,
      maxX: 70,
      minZ: -75,
      maxZ: 75
    };
    
    // Create grass patches within ground boundaries
    for (let i = 0; i < 250; i++) { // Increased for larger area
      const grassGroup = new THREE.Group();
      
      // Generate position within ground bounds
      let x, z, attempts = 0;
      let validPosition = false;
      
      while (!validPosition && attempts < 30) {
        x = groundBounds.minX + Math.random() * (groundBounds.maxX - groundBounds.minX);
        z = groundBounds.minZ + Math.random() * (groundBounds.maxZ - groundBounds.minZ);
        
        // Avoid center racing area
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        if (distanceFromCenter > 25) { // Stay away from racing track area
          validPosition = true;
        }
        attempts++;
      }
      
      if (!validPosition) continue; // Skip if couldn't find valid position
      
      // Create more grass blades per patch for density
      const bladesPerPatch = 12 + Math.floor(Math.random() * 8); // 12-20 blades per patch
      
      for (let j = 0; j < bladesPerPatch; j++) {
        const bladeHeight = 0.2 + Math.random() * 0.6; // More height variation
        const bladeWidth = 0.015 + Math.random() * 0.02; // Varied blade width
        const bladeGeometry = new THREE.ConeGeometry(bladeWidth, bladeHeight, 3);
        
        // More varied grass colors - different shades of green
        const hue = 0.22 + Math.random() * 0.15; // Green hues
        const saturation = 0.6 + Math.random() * 0.3;
        const lightness = 0.25 + Math.random() * 0.35;
        
        const bladeMaterial = new THREE.MeshLambertMaterial({
          color: new THREE.Color().setHSL(hue, saturation, lightness)
        });
        
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.set(
          (Math.random() - 0.5) * 3, // Larger spread per patch
          bladeHeight / 2 + 0.3,
          (Math.random() - 0.5) * 3
        );
        blade.rotation.y = Math.random() * Math.PI * 2;
        blade.rotation.z = (Math.random() - 0.5) * 0.3; // Slight lean
        grassGroup.add(blade);
      }
      
      grassGroup.position.set(x, 0, z);
      this.scene.add(grassGroup);
      this.objects.push({ mesh: grassGroup, type: 'grass' });
    }
    
    // Add additional scattered single grass blades for extra detail - within ground bounds
    for (let i = 0; i < 200; i++) { // Increased for larger area
      let x, z, attempts = 0;
      let validPosition = false;
      
      while (!validPosition && attempts < 20) {
        x = groundBounds.minX + Math.random() * (groundBounds.maxX - groundBounds.minX);
        z = groundBounds.minZ + Math.random() * (groundBounds.maxZ - groundBounds.minZ);
        
        // Avoid center racing area
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        if (distanceFromCenter > 30) {
          validPosition = true;
        }
        attempts++;
      }
      
      if (!validPosition) continue;
      
      const bladeHeight = 0.15 + Math.random() * 0.4;
      const bladeGeometry = new THREE.ConeGeometry(0.01, bladeHeight, 3);
      const bladeMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.7, 0.3 + Math.random() * 0.25)
      });
      
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(x, bladeHeight / 2 + 0.3, z);
      blade.rotation.y = Math.random() * Math.PI * 2;
      blade.rotation.z = (Math.random() - 0.5) * 0.4;
      
      this.scene.add(blade);
      this.objects.push({ mesh: blade, type: 'grass-single' });
    }
    
    console.log('Enhanced grass coverage created - 200 patches + 150 individual blades');
  }

  // Create racing flags
  createRacingFlags() {
    // Original flag positions (right side)
    const originalFlagPositions = [
      { x: -30, z: -30, color: 0xff0000 }, // Red
      { x: 30, z: -30, color: 0x0000ff },  // Blue
      { x: -30, z: 30, color: 0xffff00 },  // Yellow
      { x: 30, z: 30, color: 0x00ff00 },   // Green
      { x: -50, z: 0, color: 0xff6600 },   // Orange
      { x: 50, z: 0, color: 0x9900ff },    // Purple
      { x: 0, z: -50, color: 0xff0099 },   // Pink
      { x: 0, z: 50, color: 0x00ffff }     // Cyan
    ];

    // LEFT DUPLICATE flag positions (shifted -140 units on X axis)
    const leftFlagPositions = [
      { x: -170, z: -30, color: 0xff0000 }, // Red
      { x: -110, z: -30, color: 0x0000ff },  // Blue
      { x: -170, z: 30, color: 0xffff00 },  // Yellow
      { x: -110, z: 30, color: 0x00ff00 },   // Green
      { x: -190, z: 0, color: 0xff6600 },   // Orange
      { x: -90, z: 0, color: 0x9900ff },    // Purple
      { x: -140, z: -50, color: 0xff0099 },   // Pink
      { x: -140, z: 50, color: 0x00ffff }     // Cyan
    ];
    
    // Combine original and left flag positions
    const allFlagPositions = [...originalFlagPositions, ...leftFlagPositions];
    
    allFlagPositions.forEach(pos => {
      const flagGroup = new THREE.Group();
      
      // Flag pole
      const poleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 6, 8);
      const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const pole = new THREE.Mesh(poleGeometry, poleMaterial);
      pole.position.y = 3.3;
      pole.castShadow = true;
      flagGroup.add(pole);
      
      // Flag
      const flagGeometry = new THREE.PlaneGeometry(2, 1.2);
      const flagMaterial = new THREE.MeshLambertMaterial({ 
        color: pos.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const flag = new THREE.Mesh(flagGeometry, flagMaterial);
      flag.position.set(1, 5.5, 0);
      flag.rotation.y = Math.PI / 2;
      flagGroup.add(flag);
      
      flagGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(flagGroup);
      this.objects.push({ mesh: flagGroup, type: 'flag', animatable: true });
      
      // Add collision detection for flag poles
      this.environmentColliders.push({
        position: new THREE.Vector3(pos.x, 3.3, pos.z),
        radius: 1.2, // Flag pole collision radius
        type: 'flag',
        mesh: flagGroup
      });
    });
  }

  // Create advertisement banners
  createAdvertisementBanners() {
    const bannerTexts = [
      { text: 'SPEED RACING', color: 0xff0000 },
      { text: 'FLY HIGH', color: 0x0088ff },
      { text: 'DRONE ZONE', color: 0x00ff00 },
      { text: 'ADRENALINE', color: 0xff8800 },
      { text: 'CHAMPIONS', color: 0xff0088 },
      { text: 'VELOCITY', color: 0x8800ff }
    ];
    
    // Original banner positions (right side)
    const originalBannerPositions = [
      { x: -70, z: -20, rotation: 0 },
      { x: 70, z: 20, rotation: Math.PI },
      { x: -20, z: -70, rotation: Math.PI / 2 },
      { x: 20, z: 70, rotation: -Math.PI / 2 },
      { x: -50, z: 50, rotation: Math.PI / 4 },
      { x: 50, z: -50, rotation: -Math.PI / 4 }
    ];

    // LEFT DUPLICATE banner positions (shifted -140 units on X axis)
    const leftBannerPositions = [
      { x: -210, z: -20, rotation: 0 },
      { x: -70, z: 20, rotation: Math.PI },
      { x: -160, z: -70, rotation: Math.PI / 2 },
      { x: -120, z: 70, rotation: -Math.PI / 2 },
      { x: -190, z: 50, rotation: Math.PI / 4 },
      { x: -90, z: -50, rotation: -Math.PI / 4 }
    ];
    
    // Combine original and left banner positions
    const allBannerPositions = [...originalBannerPositions, ...leftBannerPositions];
    
    allBannerPositions.forEach((pos, index) => {
      const bannerGroup = new THREE.Group();
      const bannerData = bannerTexts[index % bannerTexts.length];
      
      // Banner support poles
      for (let i = 0; i < 2; i++) {
        const poleGeometry = new THREE.CylinderGeometry(0.12, 0.12, 8, 8);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(i * 6 - 3, 4.3, 0);
        pole.castShadow = true;
        bannerGroup.add(pole);
      }
      
      // Banner fabric
      const bannerGeometry = new THREE.PlaneGeometry(6, 2);
      const bannerMaterial = new THREE.MeshLambertMaterial({
        color: bannerData.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
      banner.position.set(0, 7, 0);
      banner.castShadow = true;
      bannerGroup.add(banner);
      
      // Banner text simulation with colored stripes
      for (let i = 0; i < 3; i++) {
        const stripeGeometry = new THREE.PlaneGeometry(5, 0.2);
        const stripeMaterial = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0, 7 + (i - 1) * 0.4, 0.01);
        bannerGroup.add(stripe);
      }
      
      bannerGroup.position.set(pos.x, 0.3, pos.z);
      bannerGroup.rotation.y = pos.rotation;
      this.scene.add(bannerGroup);
      this.objects.push({ mesh: bannerGroup, type: 'banner', animatable: true });
      
      // Add collision detection for banner poles
      this.environmentColliders.push({
        position: new THREE.Vector3(pos.x - 3, 4.3, pos.z),
        radius: 0.8,
        type: 'banner-pole',
        mesh: bannerGroup
      });
      this.environmentColliders.push({
        position: new THREE.Vector3(pos.x + 3, 4.3, pos.z),
        radius: 0.8,
        type: 'banner-pole',
        mesh: bannerGroup
      });
    });
  }

  // Create start/finish line
  createStartFinishLine() {
    const startLineGroup = new THREE.Group();
    
    // Start/Finish archway
    const archGeometry = new THREE.BoxGeometry(15, 8, 1);
    const archMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.set(0, 4.3, 0);
    arch.castShadow = true;
    startLineGroup.add(arch);
    
    // Checkered pattern simulation
    for (let i = 0; i < 14; i++) {
      for (let j = 0; j < 7; j++) {
        const checkGeometry = new THREE.PlaneGeometry(1, 1);
        const checkMaterial = new THREE.MeshLambertMaterial({
          color: (i + j) % 2 === 0 ? 0x000000 : 0xffffff,
          side: THREE.DoubleSide
        });
        const check = new THREE.Mesh(checkGeometry, checkMaterial);
        check.position.set(i - 7, j + 0.8, 0.01);
        startLineGroup.add(check);
      }
    }
    
    // Support pillars
    for (let i = 0; i < 2; i++) {
      const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
      const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(i * 14 - 7, 4.3, 0);
      pillar.castShadow = true;
      startLineGroup.add(pillar);
    }
    
    startLineGroup.position.set(0, 0.3, -35);
    this.scene.add(startLineGroup);
    this.objects.push({ mesh: startLineGroup, type: 'start-line' });
    
    // Add collision detection for start/finish line pillars
    this.environmentColliders.push({
      position: new THREE.Vector3(-7, 4.3, -35),
      radius: 1.0,
      type: 'start-pillar',
      mesh: startLineGroup
    });
    this.environmentColliders.push({
      position: new THREE.Vector3(7, 4.3, -35),
      radius: 1.0,
      type: 'start-pillar',
      mesh: startLineGroup
    });
  }

  // Create simple spectator stands
  createSpectatorStands() {
    // Original stand positions (right side)
    const originalStandPositions = [
      { x: -45, z: -15, rotation: Math.PI / 6 },
      { x: 45, z: 15, rotation: -Math.PI / 6 },
      { x: -15, z: 45, rotation: -Math.PI / 3 },
      { x: 15, z: -45, rotation: Math.PI / 3 }
    ];

    // LEFT DUPLICATE stand positions (shifted -140 units on X axis)
    const leftStandPositions = [
      { x: -185, z: -15, rotation: Math.PI / 6 },
      { x: -95, z: 15, rotation: -Math.PI / 6 },
      { x: -155, z: 45, rotation: -Math.PI / 3 },
      { x: -125, z: -45, rotation: Math.PI / 3 }
    ];
    
    // Combine original and left stand positions
    const allStandPositions = [...originalStandPositions, ...leftStandPositions];
    
    allStandPositions.forEach(pos => {
      const standGroup = new THREE.Group();
      
      // Stand structure
      const standGeometry = new THREE.BoxGeometry(12, 4, 8);
      const standMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
      const stand = new THREE.Mesh(standGeometry, standMaterial);
      stand.position.y = 2.3;
      stand.castShadow = true;
      standGroup.add(stand);
      
      // Seating rows
      for (let row = 0; row < 3; row++) {
        const seatGeometry = new THREE.BoxGeometry(10, 0.3, 1.5);
        const seatMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(0.6, 0.5, 0.3 + row * 0.1)
        });
        const seats = new THREE.Mesh(seatGeometry, seatMaterial);
        seats.position.set(0, 2 + row * 0.8, -3 + row * 1.5);
        standGroup.add(seats);
      }
      
      standGroup.position.set(pos.x, 0.3, pos.z);
      standGroup.rotation.y = pos.rotation;
      this.scene.add(standGroup);
      this.objects.push({ mesh: standGroup, type: 'stand' });
      
      // Add collision detection for spectator stands
      this.environmentColliders.push({
        position: new THREE.Vector3(pos.x, 2.3, pos.z),
        radius: 8.0, // Stand collision radius
        type: 'stand',
        mesh: standGroup
      });
    });
  }

  // Create track barriers
  createBarriers() {
    // Original barriers around drone spawn area (0, 0, 0) - UNIQUE HELIPAD AREA
    const barrierPositions = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const radius = 15;
      barrierPositions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        rotation: angle
      });
    }
    
    // Keep barriers only around drone spawn point - no duplication for helipad
    barrierPositions.forEach(pos => {
      const barrierGeometry = new THREE.BoxGeometry(2, 1, 0.2);
      const barrierMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xff4444,
        transparent: true,
        opacity: 0.8
      });
      const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
      barrier.position.set(pos.x, 1.3, pos.z);
      barrier.rotation.y = pos.rotation;
      barrier.castShadow = true;
      
      this.scene.add(barrier);
      this.objects.push({ mesh: barrier, type: 'barrier' });
      
      // Add collision detection for barriers
      this.environmentColliders.push({
        position: new THREE.Vector3(pos.x, 1.3, pos.z),
        radius: 1.5, // Barrier collision radius
        type: 'barrier',
        mesh: barrier
      });
    });
  }

  // Reset race
  resetRace() {
    this.raceTrack.currentCheckpoint = 0;
    this.raceTrack.raceStarted = false;
    
    this.raceTrack.hoops.forEach((hoop, index) => {
      hoop.passed = false;
      
      // Reset colors for different hoop types
      const originalColor = index === 0 ? 0x00ff00 : 0xff6b00;
      const originalEmissive = index === 0 ? 0x002200 : 0x331100;
      
      // Handle different hoop types (single mesh vs group)
      if (hoop.mesh.material) {
        // Single mesh hoop
        hoop.mesh.material.color.setHex(originalColor);
        if (hoop.mesh.material.emissive) {
          hoop.mesh.material.emissive.setHex(originalEmissive);
        }
      } else if (hoop.mesh.children && hoop.mesh.children.length > 0) {
        // Group hoop
        hoop.mesh.children.forEach(child => {
          if (child.material) {
            child.material.color.setHex(originalColor);
            if (child.material.emissive) {
              child.material.emissive.setHex(originalEmissive);
            }
          }
        });
      }
      
      // Reset glow colors
      if (hoop.glow.material) {
        // Single glow mesh
        hoop.glow.material.color.setHex(originalColor);
      } else if (hoop.glow.children && hoop.glow.children.length > 0) {
        // Group glow
        hoop.glow.children.forEach(child => {
          if (child.material) {
            child.material.color.setHex(originalColor);
          }
        });
      }
    });
    
    console.log('Race reset - ready for next attempt');
  }

  // Start race when drone moves
  startRace() {
    if (!this.raceTrack.raceStarted) {
      this.raceTrack.raceStarted = true;
      this.raceTrack.startTime = performance.now();
      console.log('Race started!');
    }
  }

  // Load GLTF model
  async loadMainDrone(url = '/static_drone/scene.gltf',
     position = { x: 0, y:2 , z: 0 }, 
     scale = 0.1) {

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
      
      // IMPORTANT: Force initial position sync to prevent visual/physics mismatch
      model.position.copy(this.droneState.pos);
      model.rotation.order = 'YXZ';
      model.rotation.y = this.droneState.yaw;
      model.rotation.x = this.droneState.pitch;
      model.rotation.z = -this.droneState.roll;
      
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
      console.log('Suggested ground height Y:', Math.abs(box.min.y) + 0.05);
 

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
  updateControls(controls, timestamp, powerState = true) {
    // Don't process controls if drone model isn't ready
    if (!this.droneModel) {
      console.warn("Controls received but drone model not ready yet");
      return;
    }
    
    // Only log when there are significant changes or issues
    const significantThrottle = controls.throttle > 0.1;
    const armingChange = (controls.throttle > 0.05 && !this.propState.isArmed && powerState);
    const powerChange = this.propState.powerOn !== powerState;
    
    // if (significantThrottle || armingChange || powerChange) {
    //   console.log(`updateControls called: power=${powerState}, throttle=${controls.throttle.toFixed(3)}, armed=${this.propState.isArmed}, currentRPM=${this.propState.currentRPM.toFixed(0)}`);
    // }
    
    this.currentControls = controls;
    this.lastControlTime = timestamp;
    
    // Update power state
    const wasPowerOff = !this.propState.powerOn;
    this.propState.powerOn = powerState;
    
    // Auto-arm when throttle is applied and power is on
    if (controls.throttle > 0.05 && !this.propState.isArmed && powerState) {
      this.propState.isArmed = true;
      console.log("🚁 Drone ARMED - throttle applied with power ON");
    }
    
    // Disarm when power is turned off
    if (!powerState) {
      if (this.propState.isArmed) {
        console.log("🚁 Drone DISARMED - power turned OFF");
      }
      this.propState.isArmed = false;
    }
    
    // If power just turned on, log for debugging
    if (wasPowerOff && powerState) {
      console.log("🔋 Power just turned ON - drone ready for control");
    }
  }

  // Realistic propeller RPM simulation
  updatePropellerRPM(throttleInput, deltaTime) {
    let targetRPM = 0;
    
    // Power off - completely stop propellers
    if (!this.propState.powerOn) {
      targetRPM = 0;
    }
    // Power on but not armed - slight idle movement like real drones
    else if (this.propState.powerOn && !this.propState.isArmed) {
      targetRPM = this.params.minRPM * 0.3; // 30% of min RPM for idle movement
    }
    // Power on and armed - normal operation
    else if (this.propState.isArmed) {
      if (throttleInput > 0.01) {
        // Non-linear throttle curve like real drones
        const normalizedThrottle = Math.pow(throttleInput, 1.5);
        targetRPM = this.params.minRPM + (this.params.maxRPM - this.params.minRPM) * normalizedThrottle;
      } else {
        targetRPM = this.params.minRPM; // Full idle RPM when armed
      }
    }

    this.propState.targetRPM = targetRPM;

    // Smooth RPM transitions
    const rpmDiff = this.propState.targetRPM - this.propState.currentRPM;
    const isSpinningUp = rpmDiff > 0;
    
    // Faster spindown when power is turned off for realistic behavior
    let transitionTime;
    if (!this.propState.powerOn) {
      transitionTime = this.params.propSpindownTime * 1.5; // Slower decay when power off
    } else {
      transitionTime = isSpinningUp ? this.params.propSpinupTime : this.params.propSpindownTime;
    }
    
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

  // Reset drone state when reconnecting
  resetDroneState() {
    console.log('Resetting drone state for reconnection...');
    
    // Reset physics state to initial values
    this.droneState = {
      pos: new THREE.Vector3(0, 1.5, 0),
      vel: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      roll: 0
    };

    // Reset propeller state
    this.propState = {
      currentRPM: 0,
      targetRPM: 0,
      isArmed: false,
      powerOn: false
    };

    // Reset control inputs
    this.currentControls = { throttle: 0, yaw: 0, pitch: 0, roll: 0 };
    this.lastControlTime = performance.now(); // Reset control time to prevent stale failsafe

    // If drone model exists, reset its position and rotation
    if (this.droneModel) {
      this.droneModel.position.copy(this.droneState.pos);
      this.droneModel.rotation.order = 'YXZ';
      this.droneModel.rotation.y = this.droneState.yaw;
      this.droneModel.rotation.x = this.droneState.pitch;
      this.droneModel.rotation.z = -this.droneState.roll;
    }

    console.log('Drone state reset completed');
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
      const rolIn = this.expo(this.applyDeadzone(target.roll), 0.4); 
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

      // Check race track collisions and progress
      this.checkHoopCollisions();
      
      // Check environment object collisions
      // this.checkEnvironmentCollisions(); // OLD BOX3 SYSTEM - COMMENTED OUT
      this.checkBVHCollisions(); // NEW BVH SYSTEM
      
      // Start race if drone is moving
      if (this.droneState.vel.length() > 0.5) {
        this.startRace();
      }

      const baseLandingHeight = 1.8; // Raised to account for higher ground surface
      
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
      
      // Simple ground collision detection with raised surface
      const baseLandingHeight = 1.8; // Raised to match ground surface
      const tiltMagnitude = Math.abs(this.droneState.pitch) + Math.abs(this.droneState.roll);
      const tiltOffset = tiltMagnitude * 0.5;
      const minHeight = baseLandingHeight + tiltOffset;
      
      if (this.droneState.pos.y < minHeight) {
        this.droneState.pos.y = minHeight;
        if (this.droneState.vel.y < 0) this.droneState.vel.y = 0;
      }
    }

    // Animate other objects including environment
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
      } else if (obj.type === 'flag' && obj.animatable) {
        // Animate flags - gentle waving motion
        const flag = obj.mesh.children.find(child => child.geometry instanceof THREE.PlaneGeometry);
        if (flag) {
          flag.rotation.z = Math.sin(elapsedTime * 2 + obj.mesh.position.x * 0.1) * 0.1;
          flag.position.x = 1 + Math.sin(elapsedTime * 3 + obj.mesh.position.z * 0.1) * 0.05;
        }
      } else if (obj.type === 'banner' && obj.animatable) {
        // Animate banners - realistic swaying motion
        const bannerFabric = obj.mesh.children.find(child => 
          child.geometry instanceof THREE.PlaneGeometry && 
          child.material.color.r !== 1 // Not the white text stripes
        );
        if (bannerFabric) {
          // More pronounced swaying with wind effect
          const windEffect = Math.sin(elapsedTime * 2.5 + obj.mesh.position.x * 0.05) * 0.15;
          const gustEffect = Math.sin(elapsedTime * 4 + obj.mesh.position.z * 0.03) * 0.08;
          
          bannerFabric.rotation.x = windEffect;
          bannerFabric.rotation.z = gustEffect;
          bannerFabric.position.y = 7 + Math.sin(elapsedTime * 3) * 0.1; // Slight vertical movement
        }
        
        // Also animate the text stripes
        obj.mesh.children.forEach((child, index) => {
          if (child.geometry instanceof THREE.PlaneGeometry && child.material.color.r === 1) {
            child.rotation.x = Math.sin(elapsedTime * 2.2 + index * 0.3) * 0.12;
            child.rotation.z = Math.sin(elapsedTime * 3.8 + index * 0.5) * 0.06;
          }
        });
      } else if (obj.type === 'tree') {
        // Animate tree canopies - gentle swaying
        obj.mesh.children.forEach((child, index) => {
          if (child.geometry instanceof THREE.SphereGeometry) {
            child.rotation.z = Math.sin(elapsedTime * 0.8 + index) * 0.02;
          }
        });
      } else if (obj.type === 'grass') {
        // Animate grass patches - subtle wind effect
        obj.mesh.children.forEach((blade, index) => {
          const windSpeed = 1.5 + Math.sin(elapsedTime * 0.5) * 0.3;
          const offset = (obj.mesh.position.x + obj.mesh.position.z) * 0.01;
          blade.rotation.z = Math.sin(elapsedTime * windSpeed + index * 0.2 + offset) * 0.08;
        });
      } else if (obj.type === 'grass-single') {
        // Animate individual grass blades
        const windSpeed = 1.8 + Math.sin(elapsedTime * 0.4) * 0.4;
        const offset = (obj.mesh.position.x + obj.mesh.position.z) * 0.015;
        obj.mesh.rotation.z = Math.sin(elapsedTime * windSpeed + offset) * 0.12;
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

  // Camera mode toggle - currently disabled
  // setCameraMode(mode) {
  //   this.cameraMode = mode;
  //   
  //   if (mode === 'free') {
  //     // Enable orbit controls for free camera
  //     this.controls.enabled = true;
  //   } else {
  //     // Disable orbit controls for chase camera
  //     this.controls.enabled = false;
  //   }
  // }

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

  // Get current drone velocity for real-time display
  getDroneVelocity() {
    const vel = this.droneState.vel;
    return {
      x: vel.x,
      y: vel.y,
      z: vel.z,
      total: vel.length(), // Total speed magnitude
      horizontal: Math.sqrt(vel.x * vel.x + vel.z * vel.z) // Horizontal speed (ignoring Y)
    };
  }

  // Get race track information for UI
  getRaceInfo() {
    const currentTime = this.raceTrack.raceStarted ? 
      (performance.now() - this.raceTrack.startTime) / 1000 : 0;
    
    return {
      currentCheckpoint: this.raceTrack.currentCheckpoint + 1,
      totalCheckpoints: this.raceTrack.totalCheckpoints,
      currentTime: currentTime.toFixed(2),
      bestTime: this.raceTrack.bestTime ? this.raceTrack.bestTime.toFixed(2) : 'N/A',
      raceStarted: this.raceTrack.raceStarted,
      raceCompleted: this.raceTrack.currentCheckpoint >= this.raceTrack.totalCheckpoints
    };
  }
}

export default MainScene;