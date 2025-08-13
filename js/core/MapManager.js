// Map initialization and management
const MapManager = {
    initializeMap: function() {
        console.log('Initializing map...');
        
        // Create map centered on Riverside County with closer zoom for better community visibility
        WildfireApp.map = L.map('map', {
            center: [33.7175, -116.2023], // Riverside County center
            zoom: 10, // Changed from 9 to 10 for closer default view
            minZoom: 7,  // Allow zooming out further
            maxZoom: 18
        });
        
        // Add base layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(WildfireApp.map);
        
        // Initialize all layer groups
        this.initializeLayers();
        
        // Fit bounds to show all communities after a delay (with closer max zoom)
        setTimeout(() => {
            this.fitToAllCommunities();
        }, 2000);
        
        console.log('Map initialized successfully with zoom level 10');
    },
    
    initializeLayers: function() {
        console.log('Initializing layers...');
        
        // Initialize all layer groups
        WildfireApp.layers = {
            fireRisk: L.layerGroup().addTo(WildfireApp.map),
            firePerimeters: L.layerGroup().addTo(WildfireApp.map),
            weatherStations: L.layerGroup(),
            populationCenters: L.layerGroup().addTo(WildfireApp.map), // ALWAYS ADD TO MAP
            evacuationCenters: L.layerGroup(),
            evacuationZones: L.layerGroup().addTo(WildfireApp.map),
            routePlanning: L.layerGroup(),
            bufferIntersections: L.layerGroup().addTo(WildfireApp.map),
            historicalFires: L.layerGroup()
        };
        
        console.log('Layers initialized:', Object.keys(WildfireApp.layers));
    },
    
    setupMapEvents: function() {
        if (!WildfireApp.map) {
            console.error('Map not available for event setup');
            return;
        }
        
        WildfireApp.map.on('zoomend', function() {
            WildfireApp.zoomLevel = WildfireApp.map.getZoom();
            console.log('Zoom level changed to:', WildfireApp.zoomLevel);
            
            // Update layers based on zoom level
            if (WildfireApp.zoomLevel >= 10 && $('#population-centers').is(':checked')) {
                if (WildfireApp.layers.populationCenters && !WildfireApp.layers.populationCenters._map) {
                    WildfireApp.layers.populationCenters.addTo(WildfireApp.map);
                    if (typeof PopulationManager !== 'undefined') {
                        PopulationManager.loadPopulationCenterMarkers();
                    }
                }
            } else if (WildfireApp.zoomLevel < 10) {
                if (WildfireApp.layers.populationCenters && WildfireApp.layers.populationCenters._map) {
                    WildfireApp.map.removeLayer(WildfireApp.layers.populationCenters);
                }
            }
            
            if (WildfireApp.zoomLevel >= 9 && $('#weather-stations').is(':checked')) {
                if (WildfireApp.layers.weatherStations && !WildfireApp.layers.weatherStations._map) {
                    WildfireApp.layers.weatherStations.addTo(WildfireApp.map);
                    if (typeof WeatherManager !== 'undefined') {
                        WeatherManager.updateWeatherStations();
                    }
                }
            } else if (WildfireApp.zoomLevel < 9) {
                if (WildfireApp.layers.weatherStations && WildfireApp.layers.weatherStations._map) {
                    WildfireApp.map.removeLayer(WildfireApp.layers.weatherStations);
                }
            }
        });
    },
    
    // Add this new method to fit the map to show all communities:
    fitToAllCommunities: function() {
        if (!WildfireApp.populationCenters || WildfireApp.populationCenters.length === 0) {
            console.log('No population centers available for bounds fitting');
            return;
        }
        
        console.log('Fitting map to show all communities...');
        
        // Create bounds that include all population centers
        const group = new L.featureGroup();
        
        WildfireApp.populationCenters.forEach(center => {
            L.marker(center.coordinates).addTo(group);
        });
        
        // Fit the map to show all communities with padding
        if (group.getLayers().length > 0) {
            WildfireApp.map.fitBounds(group.getBounds(), {
                padding: [15, 15], // Reduced padding for closer view
                maxZoom: 10 // Changed from 9 to 10 for closer view
            });
        }
        
        console.log('Map fitted to show all communities at zoom level 10');
    }
};