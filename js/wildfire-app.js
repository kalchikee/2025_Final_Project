$(document).ready(function() {
    // Initialize the wildfire mapping application
    const WildfireApp = {
        map: null,
        layers: {},
        currentTime: 6, // 6 AM start time
        
        // Initialize the application
        init: function() {
            this.initMap();
            this.loadSampleData();
            this.setupEventHandlers();
            console.log('Wildfire Risk & Evacuation Planner initialized');
        },
        
        // Initialize the Leaflet map
        initMap: function() {
            // Center on Riverside County, California
            this.map = L.map('map').setView([33.7175, -116.2023], 10);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            }).addTo(this.map);
            
            // Initialize layer groups
            this.layers = {
                weatherStations: L.layerGroup().addTo(this.map),
                fireRisk: L.layerGroup().addTo(this.map),
                evacuationCenters: L.layerGroup().addTo(this.map)
            };
        },
        
        // Load sample data for demonstration
        loadSampleData: function() {
            // Sample weather stations
            const weatherStations = [
                {id: "RAWS_123", lat: 33.7175, lon: -116.2023, 
                 windSpeed: 45, windDirection: 270, humidity: 12, temperature: 95},
                {id: "RAWS_124", lat: 33.8, lon: -116.5, 
                 windSpeed: 38, windDirection: 285, humidity: 15, temperature: 92},
                {id: "RAWS_125", lat: 33.6, lon: -115.9, 
                 windSpeed: 42, windDirection: 260, humidity: 10, temperature: 97}
            ];
            
            // Add weather stations to map
            weatherStations.forEach(station => {
                const marker = L.marker([station.lat, station.lon], {
                    icon: this.createWeatherStationIcon(station.windSpeed)
                }).addTo(this.layers.weatherStations);
                
                marker.bindPopup(`
                    <div class="weather-popup">
                        <h4>Station ${station.id}</h4>
                        <p><strong>Wind:</strong> ${station.windSpeed} mph @ ${station.windDirection}°</p>
                        <p><strong>Humidity:</strong> ${station.humidity}%</p>
                        <p><strong>Temperature:</strong> ${station.temperature}°F</p>
                    </div>
                `);
            });
            
            // Sample evacuation centers
            const evacuationCenters = [
                {name: "Riverside Community Center", lat: 33.7838, lon: -116.2089},
                {name: "Desert Hot Springs Civic Center", lat: 33.9614, lon: -116.5019},
                {name: "Palm Desert Community Center", lat: 33.7506, lon: -116.3756}
            ];
            
            evacuationCenters.forEach(center => {
                const marker = L.marker([center.lat, center.lon], {
                    icon: L.divIcon({
                        className: 'evacuation-center-icon',
                        html: '🏛️',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(this.layers.evacuationCenters);
                
                marker.bindPopup(`<strong>${center.name}</strong><br>Evacuation Center`);
            });
            
            // Add sample fire risk surface
            this.updateFireRiskSurface();
        },
        
        // Create weather station icon based on wind speed
        createWeatherStationIcon: function(windSpeed) {
            let color = 'green';
            if (windSpeed > 35) color = 'red';
            else if (windSpeed > 20) color = 'orange';
            
            return L.divIcon({
                className: 'weather-station-icon',
                html: `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
        },
        
        // Update fire risk surface based on current time
        updateFireRiskSurface: function() {
            this.layers.fireRisk.clearLayers();
            
            // Sample risk areas
            const riskAreas = [
                {
                    id: 1, 
                    coordinates: [[33.75, -116.25], [33.75, -116.15], [33.65, -116.15], [33.65, -116.25]], 
                    riskLevel: "high", 
                    score: 8.5
                },
                {
                    id: 2, 
                    coordinates: [[33.8, -116.3], [33.8, -116.2], [33.7, -116.2], [33.7, -116.3]], 
                    riskLevel: "moderate", 
                    score: 4.2
                }
            ];
            
            riskAreas.forEach(area => {
                const color = this.getRiskColor(area.riskLevel);
                const polygon = L.polygon(area.coordinates, {
                    fillColor: color,
                    fillOpacity: 0.4,
                    color: color,
                    weight: 2
                }).addTo(this.layers.fireRisk);
                
                polygon.bindPopup(`
                    <strong>Risk Level:</strong> ${area.riskLevel}<br>
                    <strong>Score:</strong> ${area.score}<br>
                    <strong>Time:</strong> ${this.formatTime(this.currentTime)}
                `);
            });
        },
        
        // Get color for risk level
        getRiskColor: function(level) {
            const colors = {
                'high': '#d32f2f',
                'moderate': '#ff9800',
                'low': '#4caf50'
            };
            return colors[level] || '#757575';
        },
        
        // Format time display
        formatTime: function(hour) {
            return `${hour.toString().padStart(2, '0')}:00`;
        },
        
        // Setup event handlers
        setupEventHandlers: function() {
            const self = this;
            
            // Time slider
            $('#time-slider').on('input', function() {
                self.currentTime = parseInt($(this).val()) + 6; // Start at 6 AM
                if (self.currentTime >= 24) self.currentTime -= 24;
                
                $('#time-display').text(self.formatTime(self.currentTime));
                self.updateFireRiskSurface();
            });
            
            // Layer toggles
            $('#weather-stations').change(function() {
                if ($(this).is(':checked')) {
                    self.map.addLayer(self.layers.weatherStations);
                } else {
                    self.map.removeLayer(self.layers.weatherStations);
                }
            });
            
            $('#fire-risk').change(function() {
                if ($(this).is(':checked')) {
                    self.map.addLayer(self.layers.fireRisk);
                } else {
                    self.map.removeLayer(self.layers.fireRisk);
                }
            });
            
            $('#evacuation-centers').change(function() {
                if ($(this).is(':checked')) {
                    self.map.addLayer(self.layers.evacuationCenters);
                } else {
                    self.map.removeLayer(self.layers.evacuationCenters);
                }
            });
            
            // Export report
            $('#export-report').click(function() {
                self.exportRiskAssessment();
            });
            
            // Map click event for routing
            this.map.on('click', function(e) {
                console.log('Map clicked at:', e.latlng);
            });
        },
        
        // Export risk assessment report
        exportRiskAssessment: function() {
            const assessmentData = {
                timestamp: new Date().toISOString(),
                scenario: "Current Conditions",
                currentTime: this.formatTime(this.currentTime),
                riskSummary: {
                    highRiskAreas: 1,
                    moderateRiskAreas: 1,
                    peopleAtRisk: "Estimated 15,420",
                    evacuationRoutesAvailable: 3
                }
            };
            
            console.log('Risk Assessment Report:', assessmentData);
            alert('Risk assessment exported! (Check console for details)');
        }
    };
    
    // Initialize the application
    WildfireApp.init();
});