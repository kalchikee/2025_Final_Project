$(document).ready(function() {
    // Initialize the wildfire mapping application
    const WildfireApp = {
        map: null,
        layers: {},
        currentTime: 6,
        zoomLevel: 10,
        narrativeMessages: {},
        routingControl: null,
        comparisonMode: false,
        
        // Initialize the application
        init: function() {
            this.initMap();
            this.initNarrativePanel();
            this.loadSampleData();
            this.setupEventHandlers();
            this.setupProgressiveDisclosure();
            console.log('Wildfire Risk & Evacuation Planner initialized');
        },
        
        // Initialize the Leaflet map
        initMap: function() {
            this.map = L.map('map').setView([33.7175, -116.2023], 10);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            }).addTo(this.map);
            
            // Initialize layer groups with progressive disclosure
            this.layers = {
                weatherStations: L.layerGroup(),
                fireRisk: L.layerGroup().addTo(this.map),
                evacuationCenters: L.layerGroup(),
                roads: L.layerGroup(),
                historicalFires: L.layerGroup(),
                routePlanning: L.layerGroup().addTo(this.map)
            };
            
            // Track zoom level for progressive disclosure
            this.map.on('zoomend', () => {
                this.zoomLevel = this.map.getZoom();
                this.updateLayerVisibility();
            });
        },
        
        // Initialize narrative panel
        initNarrativePanel: function() {
            this.narrativeMessages = {
                6: "Early morning conditions: Light winds, low humidity. Fire risk is moderate.",
                8: "Morning warming begins. Humidity dropping, wind speeds increasing slightly.",
                10: "Mid-morning: Temperatures rising, fire weather conditions developing.",
                12: "Noon conditions: Heat building, relative humidity falling below critical thresholds.",
                14: "Peak danger time: Winds reaching maximum speeds at 2:00 PM. Highest fire risk across the region.",
                16: "Late afternoon: Extreme fire weather continues. Enhanced evacuation readiness recommended.",
                18: "Evening approach: Conditions may begin to moderate but remain dangerous.",
                20: "Sunset: Fire weather typically begins to calm, but risks persist overnight."
            };
        },
        
        // Progressive disclosure based on zoom level
        updateLayerVisibility: function() {
            // Weather stations visible at zoom 9+
            if (this.zoomLevel >= 9 && !this.map.hasLayer(this.layers.weatherStations)) {
                this.map.addLayer(this.layers.weatherStations);
                $('#weather-stations').prop('checked', true);
            } else if (this.zoomLevel < 9 && this.map.hasLayer(this.layers.weatherStations)) {
                this.map.removeLayer(this.layers.weatherStations);
                $('#weather-stations').prop('checked', false);
            }
            
            // Evacuation centers visible at zoom 8+
            if (this.zoomLevel >= 8 && !this.map.hasLayer(this.layers.evacuationCenters)) {
                this.map.addLayer(this.layers.evacuationCenters);
                $('#evacuation-centers').prop('checked', true);
            } else if (this.zoomLevel < 8 && this.map.hasLayer(this.layers.evacuationCenters)) {
                this.map.removeLayer(this.layers.evacuationCenters);
                $('#evacuation-centers').prop('checked', false);
            }
            
            // Road network visible at zoom 11+
            if (this.zoomLevel >= 11 && $('#roads').is(':checked') && !this.map.hasLayer(this.layers.roads)) {
                this.loadRoadNetwork();
            }
        },
        
        // Setup progressive disclosure
        setupProgressiveDisclosure: function() {
            // Add zoom level indicator
            const zoomControl = L.control({position: 'bottomleft'});
            zoomControl.onAdd = function() {
                const div = L.DomUtil.create('div', 'zoom-info');
                div.innerHTML = '<div id="zoom-level">Zoom: 10</div><div id="layer-info">Zoom in to see more details</div>';
                return div;
            };
            zoomControl.addTo(this.map);
            
            this.map.on('zoomend', () => {
                document.getElementById('zoom-level').textContent = `Zoom: ${this.map.getZoom()}`;
                this.updateLayerInfo();
            });
        },
        
        // Update layer information based on zoom
        updateLayerInfo: function() {
            const zoom = this.map.getZoom();
            let info = '';
            if (zoom < 8) info = 'Zoom in to see evacuation centers and weather stations';
            else if (zoom < 9) info = 'Weather stations visible at zoom 9+';
            else if (zoom < 11) info = 'Road network visible at zoom 11+';
            else info = 'All layers available';
            
            document.getElementById('layer-info').textContent = info;
        },
        
        // Load road network with color-coding for evacuation routes
        loadRoadNetwork: function() {
            this.layers.roads.clearLayers();
            
            // Simplified road network with capacity-based color coding
            const roads = [
                {
                    name: "I-10 Highway",
                    coordinates: [[33.7, -117.0], [33.7, -116.0]],
                    capacity: "high",
                    trafficStatus: "normal"
                },
                {
                    name: "Highway 62",
                    coordinates: [[33.9, -116.6], [33.8, -115.8]],
                    capacity: "medium",
                    trafficStatus: "congested"
                },
                {
                    name: "Local Arterial",
                    coordinates: [[33.75, -116.25], [33.78, -116.21]],
                    capacity: "low",
                    trafficStatus: "normal"
                }
            ];
            
            roads.forEach(road => {
                const color = this.getRoadColor(road.capacity, road.trafficStatus);
                const polyline = L.polyline(road.coordinates, {
                    color: color,
                    weight: this.getRoadWeight(road.capacity),
                    opacity: 0.8
                }).addTo(this.layers.roads);
                
                polyline.bindPopup(`
                    <strong>${road.name}</strong><br>
                    Capacity: ${road.capacity}<br>
                    Traffic: ${road.trafficStatus}<br>
                    Evacuation Viability: ${this.getEvacuationViability(road.capacity, road.trafficStatus)}
                `);
            });
        },
        
        // Get road color based on capacity and traffic
        getRoadColor: function(capacity, traffic) {
            if (capacity === 'high' && traffic === 'normal') return '#4CAF50'; // Green - Good evacuation route
            if (capacity === 'high' && traffic === 'congested') return '#FF9800'; // Orange - Caution
            if (capacity === 'medium' && traffic === 'normal') return '#2196F3'; // Blue - Moderate
            if (capacity === 'medium' && traffic === 'congested') return '#FF5722'; // Red-orange - Poor
            return '#F44336'; // Red - Avoid
        },
        
        // Get road weight based on capacity
        getRoadWeight: function(capacity) {
            const weights = { 'high': 6, 'medium': 4, 'low': 2 };
            return weights[capacity] || 2;
        },
        
        // Get evacuation viability assessment
        getEvacuationViability: function(capacity, traffic) {
            if (capacity === 'high' && traffic === 'normal') return 'Excellent';
            if (capacity === 'high' && traffic === 'congested') return 'Fair';
            if (capacity === 'medium' && traffic === 'normal') return 'Good';
            if (capacity === 'medium' && traffic === 'congested') return 'Poor';
            return 'Not Recommended';
        },
        
        // Load sample data with enhanced features
        loadSampleData: function() {
            // Sample weather stations (initially not added due to progressive disclosure)
            const weatherStations = [
                {id: "RAWS_123", lat: 33.7175, lon: -116.2023, 
                 windSpeed: 45, windDirection: 270, humidity: 12, temperature: 95},
                {id: "RAWS_124", lat: 33.8, lon: -116.5, 
                 windSpeed: 38, windDirection: 285, humidity: 15, temperature: 92},
                {id: "RAWS_125", lat: 33.6, lon: -115.9, 
                 windSpeed: 42, windDirection: 260, humidity: 10, temperature: 97}
            ];
            
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
                        <div class="risk-indicator" style="color: ${this.getWindRiskColor(station.windSpeed)}">
                            Risk Level: ${this.getWindRiskLevel(station.windSpeed)}
                        </div>
                    </div>
                `);
            });
            
            // Enhanced evacuation centers
            const evacuationCenters = [
                {name: "Riverside Community Center", lat: 33.7838, lon: -116.2089, capacity: 500, status: "available"},
                {name: "Desert Hot Springs Civic Center", lat: 33.9614, lon: -116.5019, capacity: 300, status: "available"},
                {name: "Palm Desert Community Center", lat: 33.7506, lon: -116.3756, capacity: 400, status: "available"}
            ];
            
            evacuationCenters.forEach(center => {
                const marker = L.marker([center.lat, center.lon], {
                    icon: L.divIcon({
                        className: 'evacuation-center-icon',
                        html: `<div style="background: ${center.status === 'available' ? '#4CAF50' : '#F44336'}; padding: 5px; border-radius: 50%; color: white; text-align: center;">🏛️</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(this.layers.evacuationCenters);
                
                marker.bindPopup(`
                    <strong>${center.name}</strong><br>
                    Capacity: ${center.capacity} people<br>
                    Status: <span style="color: ${center.status === 'available' ? 'green' : 'red'}">${center.status}</span><br>
                    <button onclick="WildfireApp.planRouteToCenter(${center.lat}, ${center.lon})">Plan Route</button>
                `);
            });
            
            // Load historical fire data for comparison
            this.loadHistoricalFireData();
            this.updateFireRiskSurface();
            this.updateNarrative();
        },
        
        // Load historical fire data
        loadHistoricalFireData: function() {
            const historicalFires = [
                {
                    name: "Apple Fire 2020",
                    coordinates: [[33.8, -116.9], [33.8, -116.7], [33.6, -116.7], [33.6, -116.9]],
                    year: 2020,
                    acres: 33424
                },
                {
                    name: "Cranston Fire 2018",
                    coordinates: [[33.65, -116.8], [33.65, -116.6], [33.5, -116.6], [33.5, -116.8]],
                    year: 2018,
                    acres: 13139
                }
            ];
            
            historicalFires.forEach(fire => {
                const polygon = L.polygon(fire.coordinates, {
                    fillColor: '#FFA500',
                    fillOpacity: 0.3,
                    color: '#FF8C00',
                    weight: 2,
                    dashArray: '5, 5'
                }).addTo(this.layers.historicalFires);
                
                polygon.bindPopup(`
                    <strong>${fire.name}</strong><br>
                    Year: ${fire.year}<br>
                    Acres Burned: ${fire.acres.toLocaleString()}
                `);
            });
        },
        
        // Enhanced route planning with simplified approach
        planRouteToCenter: function(centerLat, centerLon) {
            // Clear existing routes
            this.layers.routePlanning.clearLayers();
            
            // Get map center as starting point (simplified)
            const startPoint = this.map.getCenter();
            
            // Create a simple route line with waypoints
            const routeCoordinates = [
                [startPoint.lat, startPoint.lng],
                [centerLat, centerLon]
            ];
            
            const routeLine = L.polyline(routeCoordinates, {
                color: '#2196F3',
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(this.layers.routePlanning);
            
            // Add route markers
            L.marker([startPoint.lat, startPoint.lng], {
                icon: L.divIcon({
                    html: '🏠',
                    iconSize: [25, 25],
                    className: 'route-marker'
                })
            }).addTo(this.layers.routePlanning);
            
            L.marker([centerLat, centerLon], {
                icon: L.divIcon({
                    html: '🎯',
                    iconSize: [25, 25],
                    className: 'route-marker'
                })
            }).addTo(this.layers.routePlanning);
            
            // Calculate estimated travel time and distance (simplified)
            const distance = this.calculateDistance(startPoint.lat, startPoint.lng, centerLat, centerLon);
            const estimatedTime = Math.round(distance / 30 * 60); // Assuming 30 mph average
            
            routeLine.bindPopup(`
                <strong>Evacuation Route</strong><br>
                Distance: ${distance.toFixed(1)} miles<br>
                Estimated Time: ${estimatedTime} minutes<br>
                <div style="color: ${this.getRouteRiskColor(estimatedTime)}">
                    Route Risk: ${this.getRouteRisk(estimatedTime)}
                </div>
            `);
            
            // Fit map to show the route
            this.map.fitBounds(routeLine.getBounds(), {padding: [20, 20]});
            
            this.updateNarrative(`Route planned to evacuation center. Estimated travel time: ${estimatedTime} minutes.`);
        },
        
        // Calculate distance between two points (simplified)
        calculateDistance: function(lat1, lon1, lat2, lon2) {
            const R = 3959; // Earth's radius in miles
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        },
        
        // Get route risk assessment
        getRouteRisk: function(travelTime) {
            if (travelTime < 15) return 'Low';
            if (travelTime < 30) return 'Moderate';
            return 'High';
        },
        
        // Get route risk color
        getRouteRiskColor: function(travelTime) {
            if (travelTime < 15) return 'green';
            if (travelTime < 30) return 'orange';
            return 'red';
        },
        
        // Get wind risk level and color
        getWindRiskLevel: function(windSpeed) {
            if (windSpeed > 35) return 'High';
            if (windSpeed > 20) return 'Moderate';
            return 'Low';
        },
        
        getWindRiskColor: function(windSpeed) {
            if (windSpeed > 35) return 'red';
            if (windSpeed > 20) return 'orange';
            return 'green';
        },
        
        // Enhanced narrative update
        updateNarrative: function(customMessage = null) {
            const hour = Math.round(this.currentTime);
            let message = customMessage || this.narrativeMessages[hour] || `Current time: ${this.formatTime(hour)}`;
            
            // Add dynamic risk assessment
            if (!customMessage) {
                if (hour >= 14 && hour <= 16) {
                    message += " CRITICAL PERIOD: Maximum fire danger. All evacuation routes should be clear and ready.";
                } else if (hour >= 12 && hour < 18) {
                    message += " HIGH ALERT: Fire conditions are dangerous. Monitor weather stations closely.";
                }
            }
            
            document.getElementById('narrative-text').innerHTML = message;
            
            // Add timestamp
            document.getElementById('narrative-timestamp').textContent = 
                `Updated: ${new Date().toLocaleTimeString()} | Forecast Time: ${this.formatTime(hour)}`;
        },
        
        // Toggle comparison mode
        toggleComparisonMode: function() {
            this.comparisonMode = !this.comparisonMode;
            
            if (this.comparisonMode) {
                // Add historical comparison
                this.map.addLayer(this.layers.historicalFires);
                this.updateNarrative("Comparison mode enabled. Historical fire perimeters are now visible for context.");
                document.getElementById('comparison-toggle').textContent = 'Exit Comparison';
                document.getElementById('comparison-toggle').style.background = '#FF5722';
            } else {
                // Remove historical comparison
                this.map.removeLayer(this.layers.historicalFires);
                this.updateNarrative();
                document.getElementById('comparison-toggle').textContent = 'Historical Comparison';
                document.getElementById('comparison-toggle').style.background = '#2196F3';
            }
        },
        
        // Create weather station icon based on wind speed
        createWeatherStationIcon: function(windSpeed) {
            let color = '#4CAF50';
            let size = 20;
            if (windSpeed > 35) {
                color = '#F44336';
                size = 26;
            } else if (windSpeed > 20) {
                color = '#FF9800';
                size = 23;
            }
            
            return L.divIcon({
                className: 'weather-station-icon',
                html: `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 10px;">${windSpeed}</div>`,
                iconSize: [size + 6, size + 6],
                iconAnchor: [(size + 6)/2, (size + 6)/2]
            });
        },
        
        // Update fire risk surface with enhanced temporal variation
        updateFireRiskSurface: function() {
            this.layers.fireRisk.clearLayers();
            
            // Dynamic risk calculation based on time
            const hour = Math.round(this.currentTime);
            const riskMultiplier = this.getTimeRiskMultiplier(hour);
            
            const riskAreas = [
                {
                    id: 1, 
                    coordinates: [[33.75, -116.25], [33.75, -116.15], [33.65, -116.15], [33.65, -116.25]], 
                    baseRiskLevel: "high", 
                    baseScore: 7.5
                },
                {
                    id: 2, 
                    coordinates: [[33.8, -116.3], [33.8, -116.2], [33.7, -116.2], [33.7, -116.3]], 
                    baseRiskLevel: "moderate", 
                    baseScore: 4.0
                },
                {
                    id: 3,
                    coordinates: [[33.85, -116.1], [33.85, -116.0], [33.75, -116.0], [33.75, -116.1]],
                    baseRiskLevel: "low",
                    baseScore: 2.5
                }
            ];
            
            riskAreas.forEach(area => {
                const adjustedScore = area.baseScore * riskMultiplier;
                const adjustedLevel = this.getAdjustedRiskLevel(adjustedScore);
                const color = this.getRiskColor(adjustedLevel);
                const opacity = Math.min(0.8, adjustedScore / 10);
                
                const polygon = L.polygon(area.coordinates, {
                    fillColor: color,
                    fillOpacity: opacity,
                    color: color,
                    weight: 2
                }).addTo(this.layers.fireRisk);
                
                polygon.bindPopup(`
                    <strong>Risk Assessment</strong><br>
                    Current Level: <span style="color: ${color}; font-weight: bold;">${adjustedLevel}</span><br>
                    Risk Score: ${adjustedScore.toFixed(1)}/10<br>
                    Base Score: ${area.baseScore}/10<br>
                    Time Factor: ${riskMultiplier.toFixed(2)}x<br>
                    Time: ${this.formatTime(hour)}
                `);
            });
        },
        
        // Get time-based risk multiplier
        getTimeRiskMultiplier: function(hour) {
            // Fire risk peaks in mid-afternoon
            if (hour >= 14 && hour <= 16) return 1.5; // Peak danger
            if (hour >= 12 && hour <= 18) return 1.3; // High danger
            if (hour >= 10 && hour <= 20) return 1.1; // Elevated
            return 0.8; // Lower overnight/early morning
        },
        
        // Get adjusted risk level based on score
        getAdjustedRiskLevel: function(score) {
            if (score >= 8) return 'extreme';
            if (score >= 6) return 'high';
            if (score >= 4) return 'moderate';
            if (score >= 2) return 'low';
            return 'minimal';
        },
        
        // Enhanced risk color scheme
        getRiskColor: function(level) {
            const colors = {
                'extreme': '#8B0000',    // Dark red
                'high': '#DC143C',       // Crimson
                'moderate': '#FF8C00',   // Dark orange
                'low': '#32CD32',        // Lime green
                'minimal': '#228B22'     // Forest green
            };
            return colors[level] || '#757575';
        },
        
        // Format time display
        formatTime: function(hour) {
            const h = hour % 24;
            return `${h.toString().padStart(2, '0')}:00`;
        },
        
        // Setup enhanced event handlers
        setupEventHandlers: function() {
            const self = this;
            
            // Enhanced time slider with narrative updates
            $('#time-slider').on('input', function() {
                self.currentTime = parseInt($(this).val()) + 6;
                if (self.currentTime >= 24) self.currentTime -= 24;
                
                $('#time-display').text(self.formatTime(self.currentTime));
                self.updateFireRiskSurface();
                self.updateNarrative();
                
                // Update slider background color based on risk
                const riskLevel = self.getTimeRiskLevel(self.currentTime);
                $(this).css('background', self.getTimeSliderColor(riskLevel));
            });
            
            // Layer toggles with progressive disclosure awareness
            $('#weather-stations').change(function() {
                if ($(this).is(':checked') && self.zoomLevel >= 9) {
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
                if ($(this).is(':checked') && self.zoomLevel >= 8) {
                    self.map.addLayer(self.layers.evacuationCenters);
                } else {
                    self.map.removeLayer(self.layers.evacuationCenters);
                }
            });
            
            $('#roads').change(function() {
                if ($(this).is(':checked') && self.zoomLevel >= 11) {
                    self.loadRoadNetwork();
                    self.map.addLayer(self.layers.roads);
                } else {
                    self.map.removeLayer(self.layers.roads);
                }
            });
            
            // Historical comparison toggle
            $('#comparison-toggle').click(function() {
                self.toggleComparisonMode();
            });
            
            // Clear routes button
            $('#clear-routes').click(function() {
                self.layers.routePlanning.clearLayers();
                self.updateNarrative("Evacuation routes cleared.");
            });
            
            // Export report with enhanced data
            $('#export-report').click(function() {
                self.exportRiskAssessment();
            });
            
            // Map click event for route planning
            this.map.on('click', function(e) {
                console.log('Map clicked at:', e.latlng);
                // Could implement click-to-route functionality here
            });
        },
        
        // Get time-based risk level for slider styling
        getTimeRiskLevel: function(hour) {
            const multiplier = this.getTimeRiskMultiplier(hour);
            if (multiplier >= 1.4) return 'extreme';
            if (multiplier >= 1.2) return 'high';
            if (multiplier >= 1.0) return 'moderate';
            return 'low';
        },
        
        // Get slider color based on time risk
        getTimeSliderColor: function(level) {
            const colors = {
                'extreme': 'linear-gradient(to right, #ffeb3b, #f44336)',
                'high': 'linear-gradient(to right, #ffeb3b, #ff9800)',
                'moderate': 'linear-gradient(to right, #4caf50, #ffeb3b)',
                'low': 'linear-gradient(to right, #4caf50, #8bc34a)'
            };
            return colors[level] || 'linear-gradient(to right, #e0e0e0, #bdbdbd)';
        },
        
        // Enhanced export with comprehensive data
        exportRiskAssessment: function() {
            const hour = Math.round(this.currentTime);
            const riskMultiplier = this.getTimeRiskMultiplier(hour);
            
            const assessmentData = {
                timestamp: new Date().toISOString(),
                scenario: "Dynamic Fire Weather Assessment",
                forecastTime: this.formatTime(hour),
                currentZoomLevel: this.zoomLevel,
                comparisonModeActive: this.comparisonMode,
                riskMultiplier: riskMultiplier,
                riskSummary: {
                    timeBasedRiskLevel: this.getTimeRiskLevel(hour),
                    extremeRiskAreas: riskMultiplier > 1.4 ? 2 : 1,
                    highRiskAreas: riskMultiplier > 1.2 ? 3 : 2,
                    peopleAtRisk: `Estimated ${Math.round(15420 * riskMultiplier).toLocaleString()}`,
                    evacuationRoutesPlanned: this.layers.routePlanning.getLayers().length,
                    weatherStationsMonitored: 3,
                    evacuationCentersAvailable: 3
                },
                recommendations: this.generateRecommendations(hour, riskMultiplier),
                narrativeContext: document.getElementById('narrative-text').innerHTML
            };
            
            console.log('Enhanced Risk Assessment Report:', assessmentData);
            
            // Create a more detailed alert
            alert(`Risk Assessment Exported!\n\nTime: ${this.formatTime(hour)}\nRisk Level: ${this.getTimeRiskLevel(hour)}\nRisk Multiplier: ${riskMultiplier.toFixed(2)}x\n\nCheck console for detailed report.`);
            
            this.updateNarrative("Risk assessment report generated and exported.");
        },
        
        // Generate context-aware recommendations
        generateRecommendations: function(hour, riskMultiplier) {
            const recommendations = [];
            
            if (riskMultiplier >= 1.4) {
                recommendations.push("IMMEDIATE ACTION: Issue mandatory evacuation orders for high-risk areas");
                recommendations.push("Deploy all available emergency resources");
                recommendations.push("Close high-risk roads to non-emergency traffic");
            } else if (riskMultiplier >= 1.2) {
                recommendations.push("Issue pre-evacuation advisory for vulnerable populations");
                recommendations.push("Stage emergency resources at evacuation centers");
                recommendations.push("Monitor weather conditions every 15 minutes");
            } else if (riskMultiplier >= 1.0) {
                recommendations.push("Maintain heightened awareness");
                recommendations.push("Prepare evacuation resources for rapid deployment");
            } else {
                recommendations.push("Continue routine monitoring");
                recommendations.push("Use this time for preparation and planning");
            }
            
            // Time-specific recommendations
            if (hour >= 12 && hour <= 16) {
                recommendations.push("Peak fire weather period - maximum vigilance required");
            }
            
            return recommendations;
        }
    };
    
    // Make WildfireApp globally accessible for popup buttons
    window.WildfireApp = WildfireApp;
    
    // Initialize the application
    WildfireApp.init();
});