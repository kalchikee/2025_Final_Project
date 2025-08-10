const DataLoader = {
    loadSampleData: function() {
        console.log('Loading sample data...');
        
        // Load population centers first
        if (typeof PopulationManager !== 'undefined') {
            PopulationManager.loadPopulationCenterMarkers();
        }
        
        // Use setTimeout to ensure all managers are loaded and map is ready
        setTimeout(() => {
            try {
                console.log('Loading fire data...');
                
                // Debug layer status
                if (typeof FireManager !== 'undefined' && FireManager.debugLayerStatus) {
                    FireManager.debugLayerStatus();
                }
                
                if (typeof FireManager !== 'undefined') {
                    FireManager.updateFireRiskSurface();
                    FireManager.createFirePerimeters();
                    console.log('Fire perimeters created successfully');
                } else {
                    console.error('FireManager not found!');
                }
                
                if (typeof WeatherManager !== 'undefined') {
                    WeatherManager.updateWeatherStations();
                }
                
                if (typeof NarrativeManager !== 'undefined') {
                    NarrativeManager.updateNarrative('🔥 Fire perimeters loaded. 🏘️ Monitoring 10 population centers for evacuation analysis...');
                }
            } catch (error) {
                console.error('Error in delayed data loading:', error);
            }
        }, 1000); // Increased delay to 1000ms
    },
    
    loadEvacuationCenters: function() {
        if (!WildfireApp.layers || !WildfireApp.layers.evacuationCenters) {
            console.error('Evacuation centers layer not available');
            return;
        }
        
        const evacuationCenters = [
            {name: "Riverside Community Center", lat: 33.7838, lon: -116.2089, capacity: 500, status: "available"},
            {name: "Desert Hot Springs Civic Center", lat: 33.9614, lon: -116.5019, capacity: 300, status: "available"},
            {name: "Palm Desert Community Center", lat: 33.7506, lon: -116.3756, capacity: 400, status: "available"},
            {name: "Indio Community Center", lat: 33.7206, lon: -116.2156, capacity: 600, status: "available"},
            {name: "Palm Springs Convention Center", lat: 33.8303, lon: -116.5453, capacity: 800, status: "available"},
            {name: "San Jacinto Community Center", lat: 33.7839, lon: -116.9400, capacity: 450, status: "available", specialFeatures: "Pet-friendly shelter, medical support"},
            {name: "Hemet Senior Center", lat: 33.7475, lon: -116.9600, capacity: 350, status: "available", specialFeatures: "Accessible for elderly, medical facilities"},
            {name: "Western Center Academy", lat: 33.7200, lon: -116.9300, capacity: 600, status: "available", specialFeatures: "Large capacity, gymnasium shelter"}
        ];
        
        evacuationCenters.forEach(center => {
            const marker = L.marker([center.lat, center.lon], {
                icon: L.divIcon({
                    className: 'evacuation-center-icon',
                    html: `<div style="background: ${center.status === 'available' ? '#4CAF50' : '#F44336'}; padding: 8px; border-radius: 50%; color: white; text-align: center; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏛️</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(WildfireApp.layers.evacuationCenters);
            
            // Enhanced popup for new evacuation centers
            let popupContent = `
                <div style="text-align: center; min-width: 200px;">
                    <h4 style="color: #4CAF50; margin-bottom: 8px;">🏛️ ${center.name}</h4>
                    <div style="font-size: 12px; margin-bottom: 10px;">
                        <strong>Capacity:</strong> ${center.capacity} people<br>
                        <strong>Status:</strong> <span style="color: ${center.status === 'available' ? 'green' : 'red'}; font-weight: bold;">${center.status.toUpperCase()}</span>
            `;
            
            // Add special features for new centers
            if (center.specialFeatures) {
                popupContent += `<br><strong>Features:</strong> <em style="color: #666;">${center.specialFeatures}</em>`;
            }
            
            popupContent += `
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="RouteManager.planRouteToCenter(${center.lat}, ${center.lon})" 
                                style="flex: 1; background: #2196F3; color: white; border: none; padding: 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                            Plan Route
                        </button>
                        <button onclick="DataLoader.showCenterDetails('${center.name}', ${center.capacity})" 
                                style="flex: 1; background: #4CAF50; color: white; border: none; padding: 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                            Details
                        </button>
                    </div>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        });
        
        console.log(`Loaded ${evacuationCenters.length} evacuation centers including facilities for San Jacinto and Hemet`);
    },
    
    loadHistoricalFireData: function() {
        if (!WildfireApp.layers || !WildfireApp.layers.historicalFires) {
            console.error('Historical fires layer not available');
            return;
        }
        
        console.log('Loading historical fire data with weather conditions...');
        
        const historicalFires = HistoricalFiresData.getHistoricalFires();
        
        historicalFires.forEach(fire => {
            // Create fire perimeter circle based on acres
            const radius = Math.sqrt(fire.acres / Math.PI) * 40; // Rough conversion to meters
            
            const fireCircle = L.circle(fire.coordinates, {
                radius: radius,
                fillColor: '#800080',
                color: '#4b0082',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4,
                className: 'historical-fire'
            }).addTo(WildfireApp.layers.historicalFires);
            
            // Create detailed popup with weather information
            fireCircle.bindPopup(this.createHistoricalFirePopup(fire));
            
            // Create fire marker
            const fireMarker = L.marker(fire.coordinates, {
                icon: L.divIcon({
                    className: 'historical-fire-marker',
                    html: `<div style="background: #800080; color: white; padding: 6px; border-radius: 50%; text-align: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">📚</div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(WildfireApp.layers.historicalFires);
            
            fireMarker.bindPopup(this.createHistoricalFirePopup(fire));
        });
        
        console.log(`Loaded ${historicalFires.length} historical fires with weather data`);
    },
    
    createHistoricalFirePopup: function(fire) {
        const weather = fire.weather;
        const damages = fire.damages;
        
        return `
            <div class="historical-fire-popup" style="min-width: 280px; max-width: 350px;">
                <h4 style="color: #800080; margin-bottom: 8px;">📚 ${fire.name}</h4>
                
                <!-- Fire Details -->
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                        <div><strong>Date:</strong><br>${fire.date}</div>
                        <div><strong>Size:</strong><br>${fire.acres.toLocaleString()} acres</div>
                        <div><strong>Cause:</strong><br>${fire.cause}</div>
                        <div><strong>Containment:</strong><br>${fire.containment}</div>
                    </div>
                </div>
                
                <!-- Weather Conditions -->
                <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <h5 style="color: #1976d2; margin-bottom: 6px;">🌡️ Weather Conditions</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
                        <div><strong>Temperature:</strong><br>${weather.temperature}°F</div>
                        <div><strong>Humidity:</strong><br>${weather.humidity}%</div>
                        <div><strong>Wind Speed:</strong><br>${weather.windSpeed} mph</div>
                        <div><strong>Wind Direction:</strong><br>${weather.windDirection}</div>
                    </div>
                    <div style="margin-top: 6px; font-size: 11px; font-style: italic; color: #666;">
                        ${weather.conditions}
                    </div>
                </div>
                
                <!-- Damage Assessment -->
                <div style="background: #ffebee; padding: 8px; border-radius: 4px; margin-bottom: 8px;">
                    <h5 style="color: #d32f2f; margin-bottom: 6px;">💰 Impact Assessment</h5>
                    <div style="font-size: 11px;">
                        <div><strong>Structures Destroyed:</strong> ${damages.structures}</div>
                        <div><strong>Estimated Cost:</strong> ${damages.cost}</div>
                    </div>
                </div>
                
                <!-- Comparison Button -->
                <div style="text-align: center;">
                    <button onclick="ComparisonManager.compareWithCurrent('${fire.id}')" 
                            style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-size: 11px; width: 100%;">
                        Compare with Current Conditions
                    </button>
                </div>
            </div>
        `;
    },
    
    showCenterDetails: function(name, capacity) {
        if (typeof NarrativeManager !== 'undefined') {
            NarrativeManager.updateNarrative(`🏛️ ${name}: Shelter capacity for ${capacity} evacuees. Facilities include emergency supplies, medical support, and temporary housing.`);
        }
        alert(`Evacuation Center Details:\n\nName: ${name}\nCapacity: ${capacity} people\nFacilities: Emergency supplies, medical support, temporary housing`);
    }
};