// Main WildfireApp object - make sure this is the ONLY declaration:

const WildfireApp = {
    // Application state
    map: null,
    layers: {},
    currentTime: 12,
    zoomLevel: 10,
    populationCenters: [
        { name: 'Palm Springs', coordinates: [33.8303, -116.5453], population: 48518, riskLevel: 'High' },
        { name: 'Desert Hot Springs', coordinates: [33.9614, -116.5019], population: 29280, riskLevel: 'Very High' },
        { name: 'Palm Desert', coordinates: [33.7222, -116.3747], population: 51163, riskLevel: 'Moderate' },
        { name: 'Cathedral City', coordinates: [33.7797, -116.4653], population: 54812, riskLevel: 'High' },
        { name: 'Rancho Mirage', coordinates: [33.7397, -116.4128], population: 18493, riskLevel: 'Moderate' },
        { name: 'La Quinta', coordinates: [33.6603, -116.3100], population: 41926, riskLevel: 'Moderate' },
        { name: 'Coachella', coordinates: [33.6803, -116.1739], population: 45658, riskLevel: 'High' },
        { name: 'Indio', coordinates: [33.7206, -116.2156], population: 89137, riskLevel: 'High' },
        { name: 'San Jacinto', coordinates: [33.7839, -116.9586], population: 48899, riskLevel: 'Very High' },
        { name: 'Hemet', coordinates: [33.7475, -116.9719], population: 84686, riskLevel: 'High' }
    ],
    activeFirePerimeters: [],
    comparisonMode: false,
    isPlaying: false,

    // Enhanced evacuation buffer system
    evacuationBuffers: {
        immediate: 0.5,    // 0.5 miles - immediate evacuation
        warning: 2.0,      // 2 miles - evacuation warning
        advisory: 5.0      // 5 miles - evacuation advisory
    },
    
    // Initialize the application
    init: function() {
        console.log('WildfireApp initializing...');
        
        try {
            // Step 1: Create layers first
            this.setupLayers(); // Use setupLayers instead of createMissingLayers
            
            // Step 2: Initialize map
            if (typeof MapManager !== 'undefined') {
                MapManager.initializeMap();
            } else {
                console.warn('MapManager not available, using fallback');
                this.initializeFallbackMap();
            }
            
            // Step 3: Wait a moment for map to be fully ready
            setTimeout(() => {
                // Step 4: Initialize managers after map is ready
                this.initializeManagers();
                
                // Step 5: Load initial data
                setTimeout(() => {
                    this.loadInitialData();
                    
                    // Step 6: Notify that WildfireApp is ready
                    if (typeof window.dispatchEvent === 'function') {
                        window.dispatchEvent(new CustomEvent('wildfireAppReady'));
                        console.log('✅ WildfireApp initialization complete and ready event fired');
                    }
                }, 500);
            }, 300);
            
        } catch (error) {
            console.error('Error during WildfireApp initialization:', error);
        }
    },

    // Initialize fallback map if MapManager is not available
    initializeFallbackMap: function() {
        console.log('Initializing fallback map...');
        
        if (!document.getElementById('map')) {
            console.error('Map container not found');
            return;
        }

        this.map = L.map('map', {
            center: [33.7175, -116.2023],
            zoom: 10,
            minZoom: 7,
            maxZoom: 18
        });
        
        // Add base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Set up zoom event listener
        this.map.on('zoomend', () => {
            this.zoomLevel = this.map.getZoom();
            console.log('Zoom level changed to:', this.zoomLevel);
        });
        
        console.log('Fallback map initialized');
    },

    // Helper method to create missing layers
    createMissingLayers: function() {
        console.log('Creating missing layers...');
        
        if (!this.layers) {
            this.layers = {};
        }
        
        const layerNames = [
            'firePerimeters', 'fireRisk', 'evacuationZones', 'populationCenters',
            'weatherStations', 'evacuationCenters', 'routePlanning', 
            'bufferIntersections', 'historicalFires'
        ];
        
        layerNames.forEach(layerName => {
            if (!this.layers[layerName]) {
                console.log(`Creating ${layerName} layer`);
                this.layers[layerName] = L.layerGroup();
            }
        });
        
        console.log('Available layers:', Object.keys(this.layers));
    },

    // Initialize available managers
    initializeManagers: function() {
        console.log('Initializing managers...');
        
        const managers = [
            { name: 'PopulationManager', required: false },
            { name: 'RouteManager', required: false }, 
            { name: 'FireManager', required: false }, // Changed from true to false
            { name: 'WeatherManager', required: false },
            { name: 'EvacuationManager', required: false },
            { name: 'ComparisonManager', required: false }
        ];

        const availableManagers = [];
        const missingManagers = [];

        managers.forEach(manager => {
            if (typeof window[manager.name] !== 'undefined' && window[manager.name].init) {
                try {
                    console.log(`✅ Initializing ${manager.name}...`);
                    window[manager.name].init();
                    availableManagers.push(manager.name);
                } catch (error) {
                    console.error(`❌ Error initializing ${manager.name}:`, error);
                    missingManagers.push(manager.name);
                }
            } else {
                console.log(`ℹ️ Manager ${manager.name} not available - will use fallback`);
                missingManagers.push(manager.name);
            }
        });

        console.log(`Managers initialized: ${availableManagers.length}/${managers.length}`);
        if (availableManagers.length > 0) {
            console.log('Available:', availableManagers);
        }
        if (missingManagers.length > 0) {
            console.log('Missing/Failed (using fallbacks):', missingManagers);
        }
    },

    // Load initial data
    loadInitialData: function() {
        console.log('Loading initial data...');
        
        if (typeof DataLoader !== 'undefined' && DataLoader.loadSampleData) {
            DataLoader.loadSampleData();
        } else {
            console.warn('DataLoader not available, using fallback data loading');
            this.loadFallbackData();
        }
    },

    // Fallback data loading
    loadFallbackData: function() {
        console.log('Loading fallback data...');
        
        // Create basic population centers
        this.createBasicPopulationCenters();
        
        // Create basic fire perimeters
        this.createBasicFirePerimeters();
        
        console.log('Fallback data loaded');
    },

    // Create basic population centers
    createBasicPopulationCenters: function() {
        if (!this.layers.populationCenters) return;
        
        const centers = [
            {name: 'San Jacinto', coordinates: [33.7839, -116.9586], population: 48899, riskLevel: 'Extreme'},
            {name: 'Hemet', coordinates: [33.7475, -116.9719], population: 84686, riskLevel: 'High'},
            {name: 'Palm Springs', coordinates: [33.8303, -116.5453], population: 48518, riskLevel: 'Moderate'}
        ];

        centers.forEach(center => {
            const marker = L.marker(center.coordinates, {
                icon: L.divIcon({
                    html: '<div style="background: #d32f2f; color: white; padding: 6px; border-radius: 50%; font-size: 14px;">🏘️</div>',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(this.layers.populationCenters);
            
            marker.bindPopup(`<h4>${center.name}</h4><p>Population: ${center.population.toLocaleString()}</p>`);
        });
        
        console.log(`Created ${centers.length} population centers`);
    },

    // Create basic fire perimeters
    createBasicFirePerimeters: function() {
        if (!this.layers.firePerimeters) return;
        
        const fires = [
            {name: 'San Jacinto Fire', center: [33.8144, -116.9428], radius: 1500},
            {name: 'Desert Hills Fire', center: [33.7500, -116.4000], radius: 2000}
        ];

        fires.forEach(fire => {
            const circle = L.circle(fire.center, {
                color: '#d32f2f',
                fillColor: '#d32f2f',
                fillOpacity: 0.3,
                radius: fire.radius
            }).addTo(this.layers.firePerimeters);
            
            circle.bindPopup(`<h4>🔥 ${fire.name}</h4>`);
        });
        
        console.log(`Created ${fires.length} fire perimeters`);
    },

    // Add layers to map
    addLayersToMap: function() {
        console.log('Adding default layers to map...');
        
        if (this.layers.populationCenters) {
            this.layers.populationCenters.addTo(this.map);
        }
        
        if (this.layers.firePerimeters) {
            this.layers.firePerimeters.addTo(this.map);
        }
    },

    // In WildfireApp.js, ensure these layers exist in setupLayers():
    setupLayers: function() {
        console.log('Setting up layers...');
        
        this.layers = {
            fireRisk: L.layerGroup(),
            firePerimeters: L.layerGroup(),
            evacuationZones: L.layerGroup(),
            evacuationCenters: L.layerGroup(),
            populationCenters: L.layerGroup(),
            historicalFires: L.layerGroup(),
            weatherStations: L.layerGroup(),          // MUST BE HERE
            bufferIntersections: L.layerGroup(),      // MUST BE HERE
            routePlanning: L.layerGroup()
        };
        
        console.log('✅ Created layers:', Object.keys(this.layers));
    }
};

// Make WildfireApp available globally
window.WildfireApp = WildfireApp;

console.log('WildfireApp object created and available globally');