const RouteManager = {
    init: function() {
        console.log('RouteManager initializing...');
        this.activeRoutes = [];
        this.useAPIRouting = false; // Use offline routing for straight lines
        this.apiKey = '5b3ce3597851110001cf6248d4c7e2d3a7c049e3b73b1d62a7e3dd8a'; // Demo key
        
        // Ensure route planning layer exists
        if (typeof WildfireApp !== 'undefined' && WildfireApp.layers) {
            if (!WildfireApp.layers.routePlanning) {
                console.log('Creating route planning layer...');
                WildfireApp.layers.routePlanning = L.layerGroup();
            }
            console.log('RouteManager: Route planning layer ready');
        } else {
            console.warn('RouteManager: WildfireApp.layers not available during init');
        }
        
        console.log('RouteManager: Using offline straight line routing');
    },
    
    loadRoadNetwork: function() {
        WildfireApp.layers.roads.clearLayers();
        
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
            }
        ];
        
        roads.forEach(road => {
            const color = this.getRoadColor(road.capacity, road.trafficStatus);
            const polyline = L.polyline(road.coordinates, {
                color: color,
                weight: this.getRoadWeight(road.capacity),
                opacity: 0.8
            }).addTo(WildfireApp.layers.roads);
            
            polyline.bindPopup(`
                <strong>${road.name}</strong><br>
                Capacity: ${road.capacity}<br>
                Traffic: ${road.trafficStatus}<br>
                Evacuation Viability: ${this.getEvacuationViability(road.capacity, road.trafficStatus)}
            `);
        });
    },
    
    getRoadColor: function(capacity, traffic) {
        if (capacity === 'high' && traffic === 'normal') return '#4CAF50';
        if (capacity === 'high' && traffic === 'congested') return '#FF9800';
        if (capacity === 'medium' && traffic === 'normal') return '#2196F3';
        if (capacity === 'medium' && traffic === 'congested') return '#FF5722';
        return '#F44336';
    },
    
    getRoadWeight: function(capacity) {
        const weights = { 'high': 6, 'medium': 4, 'low': 2 };
        return weights[capacity] || 2;
    },
    
    getEvacuationViability: function(capacity, traffic) {
        if (capacity === 'high' && traffic === 'normal') return 'Excellent';
        if (capacity === 'high' && traffic === 'congested') return 'Fair';
        if (capacity === 'medium' && traffic === 'normal') return 'Good';
        if (capacity === 'medium' && traffic === 'congested') return 'Poor';
        return 'Not Recommended';
    },
    
    planRouteToCenter: function(lat, lon) {
        console.log('Planning straight line route to center at:', lat, lon);
        
        if (!WildfireApp.map) {
            console.error('Map not available for route planning');
            return;
        }
        
        // Use map center as starting point
        const mapCenter = WildfireApp.map.getCenter();
        const startLatLng = [mapCenter.lat, mapCenter.lng];
        const endLatLng = [lat, lon];
        
        console.log('Creating straight line route from', startLatLng, 'to', endLatLng);
        
        // Create straight line route
        this.createOfflineStreetRoute(startLatLng, endLatLng);
    },
    
    getStreetRoute: function(startPoint, endPoint, callback) {
        console.log('Attempting to get street route...');
        console.log('Start:', startPoint, 'End:', endPoint);
        
        const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
        
        const requestData = {
            coordinates: [startPoint, endPoint],
            format: 'geojson',
            instructions: true,
            geometry: true
        };
        
        console.log('Sending request to:', url);
        console.log('Request data:', JSON.stringify(requestData, null, 2));
        
        // Use fetch API for the routing request
        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log('API Response status:', response.status);
            console.log('API Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        })
        .then(data => {
            console.log('API Response data:', data);
            
            if (data.error) {
                console.error('API returned error:', data.error);
                throw new Error(data.error.message || 'API error');
            }
            
            if (data.features && data.features.length > 0) {
                console.log('Street route found! Coordinates length:', data.features[0].geometry.coordinates.length);
                callback(data.features[0]);
            } else {
                console.warn('No route found in API response, falling back to direct route');
                this.fallbackDirectRoute(startPoint, endPoint, callback);
            }
        })
        .catch(error => {
            console.error('Routing API error:', error);
            console.log('Error details:', error.message);
            console.log('Falling back to direct route');
            this.fallbackDirectRoute(startPoint, endPoint, callback);
        });
    },
    
    fallbackDirectRoute: function(startPoint, endPoint, callback) {
        // Create a simple direct route as fallback
        const routeData = {
            geometry: {
                coordinates: [startPoint, endPoint]
            },
            properties: {
                segments: [{
                    distance: this.calculateDistance(startPoint[1], startPoint[0], endPoint[1], endPoint[0]) * 1609.34, // Convert to meters
                    duration: 0,
                    steps: [{
                        instruction: 'Direct route to evacuation center',
                        distance: this.calculateDistance(startPoint[1], startPoint[0], endPoint[1], endPoint[0]) * 1609.34,
                        duration: 0
                    }]
                }]
            }
        };
        callback(routeData);
    },
    
    displayStreetRoute: function(routeData, startLatLng, endLatLng) {
        console.log('Displaying street route:', routeData);
        
        try {
            // Convert coordinates from lng,lat to lat,lng for Leaflet
            const coordinates = routeData.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Create route line following streets
            const routeLine = L.polyline(coordinates, {
                color: '#2196F3',
                weight: 5,
                opacity: 0.8,
                className: 'street-route'
            }).addTo(WildfireApp.layers.routePlanning);
            
            // Add start marker
            const startMarker = L.marker(startLatLng, {
                icon: L.divIcon({
                    className: 'route-start-marker',
                    html: '<div style="background: #4CAF50; color: white; padding: 8px; border-radius: 50%; text-align: center; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">🚗</div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(WildfireApp.layers.routePlanning);
            
            // Add end marker
            const endMarker = L.marker(endLatLng, {
                icon: L.divIcon({
                    className: 'route-end-marker',
                    html: '<div style="background: #2196F3; color: white; padding: 8px; border-radius: 50%; text-align: center; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">🏛️</div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })
            }).addTo(WildfireApp.layers.routePlanning);
            
            // Get route information
            const segment = routeData.properties.segments[0];
            const distanceMiles = (segment.distance / 1609.34).toFixed(1);
            const durationMinutes = segment.duration ? Math.round(segment.duration / 60) : this.estimateTravelTime(distanceMiles);
            
            // Create detailed popup with turn-by-turn directions
            const directions = this.formatDirections(segment.steps || []);
            
            routeLine.bindPopup(`
                <div style="min-width: 250px; max-height: 300px; overflow-y: auto;">
                    <h4 style="color: #2196F3; margin-bottom: 8px;">🛣️ Evacuation Route</h4>
                    <div style="font-size: 12px; margin-bottom: 10px;">
                        <strong>Distance:</strong> ${distanceMiles} miles<br>
                        <strong>Est. Time:</strong> ${durationMinutes} minutes<br>
                        <strong>Route Type:</strong> Street routing
                    </div>
                    
                    <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px;">
                        <strong>Turn-by-turn directions:</strong>
                        <div style="max-height: 150px; overflow-y: auto; font-size: 11px; margin-top: 5px;">
                            ${directions}
                        </div>
                    </div>
                    
                    <div style="margin-top: 10px; text-align: center;">
                        <button onclick="RouteManager.clearRoutes()" 
                                style="background: #f44336; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                            Clear Route
                        </button>
                    </div>
                </div>
            `).openPopup();
            
            // Store route for later clearing
            this.activeRoutes.push({
                line: routeLine,
                startMarker: startMarker,
                endMarker: endMarker
            });
            
            // Add route to map if not already added
            if (!WildfireApp.layers.routePlanning._map) {
                WildfireApp.layers.routePlanning.addTo(WildfireApp.map);
            }
            
            // Fit map to show entire route
            const routeBounds = routeLine.getBounds();
            WildfireApp.map.fitBounds(routeBounds, { padding: [20, 20] });
            
            // Update narrative
            if (typeof NarrativeManager !== 'undefined') {
                NarrativeManager.updateNarrative(`🛣️ Street route planned to evacuation center. Distance: ${distanceMiles} miles. Estimated time: ${durationMinutes} minutes. Following actual roads and traffic patterns.`);
            }
            
            console.log('Street route displayed successfully');
            
        } catch (error) {
            console.error('Error displaying street route:', error);
            // Fallback to simple route
            this.displaySimpleRoute(startLatLng, endLatLng);
        }
    },
    
    formatDirections: function(steps) {
        if (!steps || steps.length === 0) {
            return '<div style="color: #666;">Detailed directions not available</div>';
        }
        
        let directions = '';
        steps.forEach((step, index) => {
            const distance = step.distance ? `(${(step.distance / 1609.34).toFixed(1)} mi)` : '';
            const instruction = step.instruction || 'Continue';
            
            directions += `
                <div style="margin-bottom: 5px; padding: 3px; background: ${index % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                    <strong>${index + 1}.</strong> ${instruction} ${distance}
                </div>
            `;
        });
        
        return directions;
    },
    
    displaySimpleRoute: function(startLatLng, endLatLng) {
        console.log('Displaying simple fallback route');
        
        // Create simple direct route as fallback
        const routeLine = L.polyline([startLatLng, endLatLng], {
            color: '#ff9800',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 5'
        }).addTo(WildfireApp.layers.routePlanning);
        
        // Add markers
        const startMarker = L.marker(startLatLng, {
            icon: L.divIcon({
                className: 'route-start-marker',
                html: '<div style="background: #4CAF50; color: white; padding: 5px; border-radius: 50%; text-align: center; font-size: 14px;">📍</div>',
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            })
        }).addTo(WildfireApp.layers.routePlanning);
        
        const endMarker = L.marker(endLatLng, {
            icon: L.divIcon({
                className: 'route-end-marker',
                html: '<div style="background: #2196F3; color: white; padding: 5px; border-radius: 50%; text-align: center; font-size: 14px;">🏛️</div>',
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            })
        }).addTo(WildfireApp.layers.routePlanning);
        
        // Calculate distance
        const distance = this.calculateDistance(startLatLng[0], startLatLng[1], endLatLng[0], endLatLng[1]);
        
        routeLine.bindPopup(`
            <div style="text-align: center;">
                <h4 style="color: #ff9800; margin-bottom: 8px;">🛣️ Direct Route (Fallback)</h4>
                <div style="font-size: 12px;">
                    <strong>Distance:</strong> ${distance.toFixed(1)} miles<br>
                    <strong>Est. Time:</strong> ${this.estimateTravelTime(distance)} minutes<br>
                    <strong>Route Type:</strong> Direct path<br>
                    <em style="color: #666;">Street routing unavailable</em>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="RouteManager.clearRoutes()" 
                            style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        Clear Route
                    </button>
                </div>
            </div>
        `).openPopup();
        
        // Store route
        this.activeRoutes.push({
            line: routeLine,
            startMarker: startMarker,
            endMarker: endMarker
        });
    },
    
    planEvacuationRoute: function(populationCenterId) {
        console.log('Planning evacuation route for population center:', populationCenterId);
        
        if (!WildfireApp.populationCenters) {
            console.error('Population centers not available');
            return;
        }
        
        // Find the population center
        const center = WildfireApp.populationCenters.find(c => c.id === populationCenterId);
        if (!center) {
            console.error('Population center not found:', populationCenterId);
            return;
        }
        
        // Find nearest evacuation center
        const nearestEvacuationCenter = this.findNearestEvacuationCenter(center.coordinates);
        
        if (nearestEvacuationCenter) {
            // Set map view to population center first
            WildfireApp.map.setView(center.coordinates, 12);
            
            setTimeout(() => {
                this.planRouteToCenter(nearestEvacuationCenter.lat, nearestEvacuationCenter.lon);
            }, 500);
        } else {
            alert('No evacuation centers available');
        }
    },
    
    findNearestEvacuationCenter: function(fromCoords) {
        const evacuationCenters = [
            {name: "Riverside Community Center", lat: 33.7838, lon: -116.2089, capacity: 500, status: "available"},
            {name: "Desert Hot Springs Civic Center", lat: 33.9614, lon: -116.5019, capacity: 300, status: "available"},
            {name: "Palm Desert Community Center", lat: 33.7506, lon: -116.3756, capacity: 400, status: "available"},
            {name: "Indio Community Center", lat: 33.7206, lon: -116.2156, capacity: 600, status: "available"},
            {name: "Palm Springs Convention Center", lat: 33.8303, lon: -116.5453, capacity: 800, status: "available"}
        ];
        
        let nearest = null;
        let shortestDistance = Infinity;
        
        evacuationCenters.forEach(center => {
            if (center.status === 'available') {
                const distance = this.calculateDistance(fromCoords[0], fromCoords[1], center.lat, center.lon);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearest = center;
                }
            }
        });
        
        return nearest;
    },
    
    calculateDistance: function(lat1, lon1, lat2, lon2) {
        // Haversine formula for calculating distance between two points
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },
    
    toRadians: function(degrees) {
        return degrees * (Math.PI / 180);
    },
    
    calculateRouteDistance: function(waypoints) {
        if (!waypoints || waypoints.length < 2) {
            return 0;
        }
        
        let totalDistance = 0;
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const point1 = waypoints[i];
            const point2 = waypoints[i + 1];
            
            const distance = this.calculateDistance(
                point1[0], point1[1],
                point2[0], point2[1]
            );
            
            totalDistance += distance;
        }
        
        console.log(`Total route distance: ${totalDistance.toFixed(2)} miles`);
        return totalDistance;
    },
    
    estimateTravelTime: function(distanceMiles) {
        // Estimate based on average evacuation speed (accounting for traffic)
        const avgSpeedMph = 25; // Slower due to evacuation traffic
        const timeHours = distanceMiles / avgSpeedMph;
        return Math.round(timeHours * 60); // Convert to minutes
    },
    
    clearRoutes: function() {
        console.log('Clearing all routes');
        
        if (!WildfireApp.layers || !WildfireApp.layers.routePlanning) {
            console.warn('Route planning layer not available for clearing');
            return;
        }
        
        try {
            // Clear the entire route planning layer
            WildfireApp.layers.routePlanning.clearLayers();
            
            // Clear stored routes array
            this.activeRoutes = [];
            
            // Update narrative
            if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative('🗑️ Evacuation routes cleared.');
            }
            
            console.log('Routes cleared successfully');
            
        } catch (error) {
            console.error('Error clearing routes:', error);
        }
    },
    
    createOfflineStreetRoute: function(startLatLng, endLatLng) {
        console.log('=== CREATING STRAIGHT LINE ROUTE ===');
        console.log('Start:', startLatLng, 'End:', endLatLng);
        
        // Ensure we have the route planning layer
        if (!WildfireApp.layers || !WildfireApp.layers.routePlanning) {
            console.error('Route planning layer not available');
            return;
        }
        
        // Clear existing routes
        WildfireApp.layers.routePlanning.clearLayers();
        
        // Create simple straight line route (just two points)
        const routePoints = [startLatLng, endLatLng];
        console.log('Route points:', routePoints);
        
        // Create route line as straight line
        const routeLine = L.polyline(routePoints, {
            color: '#2196F3',
            weight: 5,
            opacity: 0.8,
            className: 'straight-evacuation-route'
        }).addTo(WildfireApp.layers.routePlanning);
        
        console.log('Straight line route created');
        
        // Add start marker
        const startMarker = L.marker(startLatLng, {
            icon: L.divIcon({
                className: 'route-start-marker',
                html: '<div style="background: #4CAF50; color: white; padding: 8px; border-radius: 50%; text-align: center; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">🚗</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        }).addTo(WildfireApp.layers.routePlanning);
        
        // Add end marker
        const endMarker = L.marker(endLatLng, {
            icon: L.divIcon({
                className: 'route-end-marker',
                html: '<div style="background: #2196F3; color: white; padding: 8px; border-radius: 50%; text-align: center; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.3);">🏛️</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        }).addTo(WildfireApp.layers.routePlanning);
        
        // Calculate straight line distance
        const totalDistance = this.calculateDistance(
            startLatLng[0], startLatLng[1],
            endLatLng[0], endLatLng[1]
        );
        
        const estimatedTime = this.estimateTravelTime(totalDistance);
        
        // Simple popup for straight line route
        routeLine.bindPopup(`
            <div style="min-width: 250px;">
                <h4 style="color: #2196F3; margin-bottom: 8px;">🛣️ Direct Evacuation Route</h4>
                <div style="font-size: 12px; margin-bottom: 10px; padding: 8px; background: #f0f8ff; border-radius: 4px;">
                    <strong>Distance:</strong> ${totalDistance.toFixed(2)} miles<br>
                    <strong>Est. Time:</strong> ${estimatedTime} minutes<br>
                    <strong>Route Type:</strong> Straight line path<br>
                    <strong>Note:</strong> Actual route will follow available roads
                </div>
                
                <div style="font-size: 11px; color: #666; margin-bottom: 10px;">
                    <strong>Directions:</strong><br>
                    1. Head directly toward evacuation center (${totalDistance.toFixed(2)} mi)<br>
                    2. Arrive at evacuation center
                </div>
                
                <div style="text-align: center;">
                    <button onclick="RouteManager.clearRoutes()" 
                            style="background: #f44336; color: white; border: none; padding: 6px 15px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        Clear Route
                    </button>
                </div>
            </div>
        `).openPopup();
        
        // Store route for later clearing
        this.activeRoutes.push({
            line: routeLine,
            startMarker: startMarker,
            endMarker: endMarker
        });
        
        // Ensure route layer is added to map
        if (!WildfireApp.layers.routePlanning._map && WildfireApp.map) {
            WildfireApp.layers.routePlanning.addTo(WildfireApp.map);
        }
        
        // Fit map to show entire route
        try {
            const routeBounds = routeLine.getBounds();
            WildfireApp.map.fitBounds(routeBounds, { padding: [20, 20] });
        } catch (error) {
            console.warn('Could not fit bounds to route:', error);
        }
        
        // Update narrative
        if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
            NarrativeManager.updateNarrative(`🛣️ Direct evacuation route planned. Distance: ${totalDistance.toFixed(2)} miles. Est. time: ${estimatedTime} minutes.`);
        }
        
        console.log('=== STRAIGHT LINE ROUTE COMPLETE ===');
    },
    
    generateStreetWaypoints: function(start, end) {
        console.log('Generating straight line waypoints from', start, 'to', end);
        
        // Return just start and end points for straight line
        const waypoints = [start, end];
        
        console.log(`Generated straight line route with ${waypoints.length} points:`, waypoints);
        return waypoints;
    }
};

const populationCenters = [
    { name: 'Palm Springs', coords: [33.8303, -116.5453] },
    { name: 'Desert Hot Springs', coords: [33.9614, -116.5019] },
    { name: 'Palm Desert', coords: [33.7222, -116.3747] },
    { name: 'Cathedral City', coords: [33.7797, -116.4653] },
    { name: 'Rancho Mirage', coords: [33.7397, -116.4128] },
    { name: 'La Quinta', coords: [33.6603, -116.3100] },
    { name: 'Coachella', coords: [33.6803, -116.1739] },
    { name: 'Indio', coords: [33.7206, -116.2156] },
    { name: 'San Jacinto', coords: [33.7839, -116.9586] },
    { name: 'Hemet', coords: [33.7475, -116.9719] }
    // Bermuda Dunes and Indian Wells removed
];

