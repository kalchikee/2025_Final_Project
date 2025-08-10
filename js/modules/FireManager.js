// Fire perimeter and risk management
const FireManager = {
    updateFireRiskSurface: function() {
        if (!WildfireApp.layers || !WildfireApp.layers.fireRisk) {
            console.error('Fire risk layer not available');
            return;
        }
        
        console.log('Updating fire risk surface...');
        
        // Clear existing fire risk data
        WildfireApp.layers.fireRisk.clearLayers();
        
        // Create risk zones based on current time and conditions
        const riskLevel = this.getTimeRiskLevel(WildfireApp.currentTime);
        const riskAreas = this.generateRiskAreas(riskLevel);
        
        riskAreas.forEach(area => {
            const polygon = L.polygon(area.coordinates, {
                fillColor: area.color,
                fillOpacity: area.opacity,
                color: area.borderColor,
                weight: 2,
                opacity: 0.8
            }).addTo(WildfireApp.layers.fireRisk);
            
            polygon.bindPopup(`
                <strong>Fire Risk Zone</strong><br>
                Risk Level: ${area.level}<br>
                Time: ${this.formatTime(WildfireApp.currentTime)}<br>
                Conditions: ${area.description}
            `);
        });
        
        console.log(`Updated fire risk surface with ${riskAreas.length} risk areas`);
    },
    
    createFirePerimeters: function(currentTime = 12) {
        console.log('FireManager.createFirePerimeters called at time:', currentTime);
        
        // Enhanced safety checks with better retry mechanism
        if (!WildfireApp) {
            console.error('WildfireApp not available');
            return;
        }
        
        if (!WildfireApp.map) {
            console.log('WildfireApp.map not available, scheduling retry...');
            
            // Initialize retry counter if it doesn't exist
            if (!this.retryCount) this.retryCount = 0;
            this.retryCount++;
            
            if (this.retryCount <= 5) {
                const delay = Math.min(this.retryCount * 500, 3000);
                console.log(`Retry attempt ${this.retryCount} in ${delay}ms`);
                
                setTimeout(() => {
                    this.createFirePerimeters(currentTime);
                }, delay);
            } else {
                console.error('❌ Max retries exceeded for fire perimeter creation');
                this.retryCount = 0;
            }
            return;
        }
        
        // Reset retry counter on successful access
        this.retryCount = 0;
        
        if (!WildfireApp.layers || !WildfireApp.layers.firePerimeters) {
            console.error('Fire perimeters layer not available');
            return;
        }
        
        console.log('✅ All dependencies available, creating fire perimeters...');
        
        // Clear existing fire perimeters
        WildfireApp.layers.firePerimeters.clearLayers();
        
        // Create active fire perimeters based on time
        const activeFireAreas = [
            {
                name: 'San Jacinto Fire',
                center: [33.8144, -116.9428],
                baseRadius: 1000,
                maxRadius: 2500,
                intensity: this.getFireIntensityForTime(currentTime)
            },
            {
                name: 'Desert Hills Fire',
                center: [33.7500, -116.4000],
                baseRadius: 800,
                maxRadius: 2000,
                intensity: this.getFireIntensityForTime(currentTime)
            }
        ];
        
        let createdCount = 0;
        activeFireAreas.forEach(fire => {
            try {
                // Calculate dynamic radius based on time and intensity
                const timeMultiplier = Math.max(0.3, Math.min(1.5, (currentTime - 6) / 12));
                const currentRadius = fire.baseRadius + (fire.maxRadius - fire.baseRadius) * fire.intensity * timeMultiplier;
                
                // Determine color based on intensity
                let color = '#FF4444'; // Default red
                let fillOpacity = 0.3;
                
                if (fire.intensity > 0.8) {
                    color = '#8B0000'; // Dark red for high intensity
                    fillOpacity = 0.4;
                } else if (fire.intensity > 0.6) {
                    color = '#DC143C'; // Crimson for medium-high intensity
                    fillOpacity = 0.35;
                } else if (fire.intensity > 0.4) {
                    color = '#FF6347'; // Tomato for medium intensity
                    fillOpacity = 0.3;
                }
                
                const firePerimeter = L.circle(fire.center, {
                    color: color,
                    fillColor: color,
                    fillOpacity: fillOpacity,
                    weight: 3,
                    radius: currentRadius
                }).addTo(WildfireApp.layers.firePerimeters);
                
                // Add popup with fire information
                firePerimeter.bindPopup(`
                    <div style="min-width: 200px;">
                        <h4 style="color: ${color};">🔥 ${fire.name}</h4>
                        <div style="font-size: 12px;">
                            <strong>Current Size:</strong> ${Math.round(currentRadius/1000 * 2.47)} acres<br>
                            <strong>Intensity:</strong> ${Math.round(fire.intensity * 100)}%<br>
                            <strong>Time:</strong> ${this.formatTime(currentTime)}<br>
                            <strong>Status:</strong> Active<br>
                            <strong>Containment:</strong> ${Math.max(0, 100 - fire.intensity * 100).toFixed(0)}%
                        </div>
                    </div>
                `);
                
                createdCount++;
            } catch (error) {
                console.error(`Error creating fire perimeter for ${fire.name}:`, error);
            }
        });
        
        console.log(`Created ${createdCount} fire perimeters for time ${this.formatTime(currentTime)}`);
        
        // Update narrative if available
        if (typeof WildfireApp !== 'undefined' && typeof WildfireApp.updateNarrative === 'function') {
            const timeStr = this.formatTime(currentTime);
            WildfireApp.updateNarrative(`🔥 Fire perimeters updated for ${timeStr}. ${createdCount} active fires detected.`);
        }
    },
    
    getFireIntensityForTime: function(hour) {
        // Fire intensity typically peaks in mid-afternoon (14:00-16:00)
        // and is lowest in early morning (06:00-08:00)
        
        try {
            // Ensure hour is a valid number
            hour = parseFloat(hour) || 12;
            
            if (hour < 8) {
                // Early morning: Low intensity (30-50%)
                return Math.max(0.3, 0.3 + (hour - 6) * 0.1);
            } else if (hour < 12) {
                // Late morning: Rising intensity (50-80%)
                return Math.max(0.5, 0.5 + (hour - 8) * 0.075);
            } else if (hour < 18) {
                // Afternoon: Peak intensity (80-100%)
                const peakIntensity = 0.8 + Math.sin((hour - 12) * Math.PI / 6) * 0.2;
                return Math.min(1.0, Math.max(0.8, peakIntensity));
            } else {
                // Evening: Declining intensity (30-60%)
                return Math.max(0.3, 0.6 - (hour - 18) * 0.05);
            }
        } catch (error) {
            console.error('Error calculating fire intensity for time:', hour, error);
            return 0.5; // Default to moderate intensity
        }
    },
    
    generateActiveFirePerimeters: function() {
        console.log('Generating active fire perimeters for time:', WildfireApp.currentTime);
        
        try {
            const baseTime = WildfireApp.currentTime || 12;
            const windConditions = this.getWindConditions(baseTime);
            const riskLevel = this.getTimeRiskLevel(baseTime);
            
            // Generate fires based on time of day and risk conditions
            const fires = [
                {
                    id: 'fire_001',
                    name: 'San Jacinto Fire',
                    currentCenter: [33.8144, -116.9428], // San Jacinto Mountains (near San Jacinto community)
                    baseRadius: 1.5,
                    currentRadius: this.calculateFireRadius(1.5, baseTime, windConditions),
                    intensity: 'high',
                    color: '#d32f2f',
                    borderColor: '#b71c1c',
                    startTime: 6,
                    growthRate: 0.3
                },
                {
                    id: 'fire_002', 
                    name: 'Desert Hills Fire',
                    currentCenter: [33.7500, -116.4000], // Desert area
                    baseRadius: 2.0,
                    currentRadius: this.calculateFireRadius(2.0, baseTime, windConditions),
                    intensity: 'moderate',
                    color: '#ff5722',
                    borderColor: '#d84315',
                    startTime: 8,
                    growthRate: 0.2
                }
            ];
            
            // Add fires that could threaten San Jacinto and Hemet during high-risk periods
            if (riskLevel >= 4 || (baseTime >= 12 && baseTime <= 18)) {
                fires.push({
                    id: 'fire_003',
                    name: 'Riverside Canyon Fire',
                    currentCenter: [33.9000, -117.1000],
                    baseRadius: 1.0,
                    currentRadius: this.calculateFireRadius(1.0, baseTime, windConditions),
                    intensity: 'moderate',
                    color: '#ff9800',
                    borderColor: '#ef6c00',
                    startTime: 10,
                    growthRate: 0.25
                });
                
                // Potential fire near Hemet (only during extreme conditions)
                if (riskLevel >= 5 && baseTime >= 14 && baseTime <= 17) {
                    fires.push({
                        id: 'fire_004',
                        name: 'Hemet Valley Fire',
                        currentCenter: [33.7200, -116.9900], // Southwest of Hemet
                        baseRadius: 0.8,
                        currentRadius: this.calculateFireRadius(0.8, baseTime, windConditions),
                        intensity: 'high',
                        color: '#d32f2f',
                        borderColor: '#b71c1c',
                        startTime: 14,
                        growthRate: 0.35
                    });
                }
            }
            
            // Filter active fires
            let activeFires = fires.filter(fire => {
                return baseTime >= fire.startTime && fire.currentRadius > 0.1;
            });
            
            console.log(`Generated ${activeFires.length} active fires for time ${baseTime}:00`);
            
            return activeFires.length > 0 ? activeFires : [{
                id: 'fire_demo',
                name: 'Demo Fire',
                currentCenter: [33.8000, -116.5000],
                baseRadius: 1.0,
                currentRadius: 1.2,
                intensity: 'low',
                color: '#ff9800',
                borderColor: '#ef6c00',
                startTime: 0,
                growthRate: 0.1
            }];
            
        } catch (error) {
            console.error('Error generating fire perimeters:', error);
            return [this.getFallbackFire()];
        }
    },
    
    calculateFireRadius: function(baseRadius, currentTime, windConditions) {
        let radius = baseRadius;
        
        // Time-based growth simulation
        if (currentTime >= 12 && currentTime <= 18) {
            // Peak fire conditions (noon to 6 PM)
            radius *= 1.5;
        } else if (currentTime >= 6 && currentTime < 12) {
            // Morning growth
            radius *= 1.2;
        } else {
            // Night time - slower growth
            radius *= 0.8;
        }
        
        // Wind factor
        if (windConditions && windConditions.speed) {
            if (windConditions.speed > 15) {
                radius *= 1.4;
            } else if (windConditions.speed > 10) {
                radius *= 1.2;
            }
        }
        
        // Ensure minimum size
        return Math.max(radius, 0.5);
    },
    
    getWindConditions: function(time) {
        // Simulate wind conditions based on time
        if (time >= 12 && time <= 18) {
            return { speed: 18, direction: 'SW' }; // Afternoon winds
        } else if (time >= 6 && time < 12) {
            return { speed: 8, direction: 'W' }; // Morning calm
        } else {
            return { speed: 5, direction: 'N' }; // Night calm
        }
    },
    
    createFirePopup: function(fire) {
        try {
            const windConditions = this.getWindConditions(WildfireApp.currentTime);
            
            // Safely format values
            const radius = fire.currentRadius ? fire.currentRadius.toFixed(1) : 'Unknown';
            const intensity = fire.intensity || 'Unknown';
            const growthRate = fire.growthRate ? (fire.growthRate * 100).toFixed(0) : '0';
            const windSpeed = windConditions && windConditions.speed ? windConditions.speed : 'Unknown';
            const windDirection = windConditions && windConditions.direction ? windConditions.direction : '';
            
            return `
                <div class="fire-popup" style="min-width: 220px;">
                    <h4 style="color: #d32f2f; margin-bottom: 8px;">🔥 ${fire.name || 'Unknown Fire'}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                        <div><strong>Current Size:</strong><br>${radius} mile radius</div>
                        <div><strong>Intensity:</strong><br>${intensity}</div>
                        <div><strong>Growth Rate:</strong><br>${growthRate}% per hour</div>
                        <div><strong>Wind Speed:</strong><br>${windSpeed} mph ${windDirection}</div>
                    </div>
                    
                    <div style="margin-top: 10px; padding: 8px; background: #ffebee; border-radius: 4px; font-size: 11px;">
                        <strong>⚠️ Fire Behavior:</strong><br>
                        ${this.getFireBehaviorDescription(fire, WildfireApp.currentTime)}
                    </div>
                    
                    <div style="margin-top: 8px;">
                        <button onclick="FireManager.triggerEvacuationAnalysis()" 
                                style="background: #d32f2f; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                            Analyze Evacuation Needs
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error creating fire popup:', error);
            return `<div>Fire: ${fire.name || 'Unknown'}</div>`;
        }
    },
    
    // Add helper method for popup button
    triggerEvacuationAnalysis: function() {
        try {
            if (typeof EvacuationManager !== 'undefined' && EvacuationManager.analyzeEvacuationNeeds) {
                EvacuationManager.analyzeEvacuationNeeds();
            } else {
                console.error('EvacuationManager not available');
            }
        } catch (error) {
            console.error('Error triggering evacuation analysis:', error);
        }
    },
    
    getFireBehaviorDescription: function(fire, currentTime) {
        if (currentTime >= 12 && currentTime <= 18) {
            return "Peak fire conditions. Rapid spread expected due to high temperatures and wind.";
        } else if (currentTime >= 6 && currentTime < 12) {
            return "Moderate fire behavior. Warming temperatures increasing activity.";
        } else {
            return "Reduced fire activity during cooler nighttime hours.";
        }
    },
    
    // Add missing utility functions
    getTimeRiskLevel: function(time) {
        // Calculate fire risk level based on time of day (1-5 scale)
        if (time >= 14 && time <= 17) {
            return 5; // Peak risk - hottest part of day
        } else if ((time >= 12 && time < 14) || (time > 17 && time <= 19)) {
            return 4; // High risk
        } else if ((time >= 10 && time < 12) || (time > 19 && time <= 21)) {
            return 3; // Moderate risk
        } else if ((time >= 6 && time < 10) || (time > 21 && time < 24)) {
            return 2; // Low risk
        } else {
            return 1; // Very low risk - overnight
        }
    },
    
    formatTime: function(hour) {
        // Format 24-hour time to 12-hour with AM/PM
        try {
            hour = parseInt(hour) || 12;
            if (hour === 0) return "12:00 AM";
            if (hour === 12) return "12:00 PM";
            if (hour < 12) return hour + ":00 AM";
            return (hour - 12) + ":00 PM";
        } catch (error) {
            console.error('Error formatting time:', hour, error);
            return "12:00 PM";
        }
    },
    
    generateRiskAreas: function(riskLevel) {
        // Create risk areas based on topography and conditions
        const riskAreas = [
            {
                coordinates: [
                    [33.9, -117.0], [33.9, -116.8], [33.7, -116.8], [33.7, -117.0]
                ],
                level: 'High',
                color: '#ff5722',
                borderColor: '#d84315',
                opacity: 0.4,
                description: 'Steep terrain with dry vegetation'
            },
            {
                coordinates: [
                    [33.8, -116.7], [33.8, -116.5], [33.6, -116.5], [33.6, -116.7]
                ],
                level: 'Moderate',
                color: '#ff9800',
                borderColor: '#ef6c00',
                opacity: 0.3,
                description: 'Mixed vegetation with moderate slopes'
            },
            {
                coordinates: [
                    [33.6, -116.4], [33.6, -116.2], [33.4, -116.2], [33.4, -116.4]
                ],
                level: 'Low',
                color: '#ffc107',
                borderColor: '#ff8f00',
                opacity: 0.2,
                description: 'Desert areas with sparse vegetation'
            }
        ];
        
        // Adjust risk based on current conditions (using Object.assign instead of spread operator)
        return riskAreas.map(area => {
            // Create a copy of the area object without spread operator
            const adjustedArea = {
                coordinates: area.coordinates,
                level: area.level,
                color: area.color,
                borderColor: area.borderColor,
                opacity: area.opacity,
                description: area.description
            };
            
            if (riskLevel >= 4) {
                adjustedArea.opacity = Math.min(area.opacity + 0.2, 0.6);
            }
            
            return adjustedArea;
        });
    },
    
    debugLayerStatus: function() {
        console.log('=== LAYER DEBUG INFO ===');
        console.log('WildfireApp exists:', typeof WildfireApp !== 'undefined');
        console.log('WildfireApp.map exists:', WildfireApp && !!WildfireApp.map);
        console.log('WildfireApp.layers exists:', WildfireApp && !!WildfireApp.layers);
        
        if (WildfireApp && WildfireApp.layers) {
            console.log('Available layers:', Object.keys(WildfireApp.layers));
            console.log('firePerimeters layer exists:', !!WildfireApp.layers.firePerimeters);
            console.log('fireRisk layer exists:', !!WildfireApp.layers.fireRisk);
            console.log('evacuationZones layer exists:', !!WildfireApp.layers.evacuationZones);
        }
        console.log('========================');
    },
    
    getFallbackFire: function() {
        return {
            id: 'fallback_fire',
            name: 'Default Fire',
            currentCenter: [33.7500, -116.5000],
            baseRadius: 1.0,
            currentRadius: 1.2,
            intensity: 'moderate',
            color: '#ff9800',
            borderColor: '#ef6c00',
            startTime: 0,
            growthRate: 0.1
        };
    }
};

// Listen for WildfireApp ready event
window.addEventListener('wildfireAppReady', function() {
    console.log('🎯 WildfireApp ready event received');
    
    // Now it's safe to call FireManager methods
    if (typeof FireManager !== 'undefined' && FireManager.createFirePerimeters) {
        setTimeout(() => {
            console.log('Creating fire perimeters after WildfireApp ready...');
            FireManager.createFirePerimeters(12);
        }, 100);
    }
});

// Weather Station Manager
const WeatherStationManager = {
    createWeatherStations: function() {
        if (!WildfireApp.layers || !WildfireApp.layers.weatherStations) {
            console.error('Weather stations layer not available');
            return 0;
        }
        
        console.log('Creating weather stations...');
        WildfireApp.layers.weatherStations.clearLayers();
        
        const stations = [
            {
                name: 'Palm Springs Station',
                coordinates: [33.8303, -116.5453],
                temp: 95,
                humidity: 15,
                windSpeed: 12,
                windDirection: 'SW'
            },
            {
                name: 'Desert Hot Springs Station',
                coordinates: [33.9614, -116.5019],
                temp: 98,
                humidity: 12,
                windSpeed: 18,
                windDirection: 'W'
            },
            {
                name: 'San Jacinto Station',
                coordinates: [33.7839, -116.9586],
                temp: 92,
                humidity: 18,
                windSpeed: 15,
                windDirection: 'SW'
            },
            {
                name: 'Hemet Station',
                coordinates: [33.7475, -116.9719],
                temp: 89,
                humidity: 22,
                windSpeed: 10,
                windDirection: 'S'
            }
        ];
        
        let successCount = 0;
        stations.forEach(station => {
            try {
                const marker = L.marker(station.coordinates, {
                    icon: L.divIcon({
                        className: 'weather-station-icon',
                        html: '<div style="background: #00BCD4; color: white; padding: 6px; border-radius: 50%; text-align: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); width: 28px; height: 28px; line-height: 16px;">🌡️</div>',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    })
                }).addTo(WildfireApp.layers.weatherStations);
                
                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <h4 style="color: #00BCD4;">🌡️ ${station.name}</h4>
                        <div style="font-size: 12px;">
                            <strong>Temperature:</strong> ${station.temp}°F<br>
                            <strong>Humidity:</strong> ${station.humidity}%<br>
                            <strong>Wind:</strong> ${station.windSpeed} mph ${station.windDirection}<br>
                            <strong>Fire Risk:</strong> ${station.humidity < 20 ? 'High' : 'Moderate'}
                        </div>
                    </div>
                `);
                
                successCount++;
            } catch (error) {
                console.error(`Error creating weather station ${station.name}:`, error);
            }
        });
        
        console.log(`✅ Created ${successCount} weather stations`);
        return successCount;
    }
};

// Buffer Intersection Manager
const BufferIntersectionManager = {
    createBufferIntersections: function() {
        if (!WildfireApp.layers || !WildfireApp.layers.bufferIntersections) {
            console.error('Buffer intersections layer not available');
            return 0;
        }
        
        console.log('Creating buffer intersections...');
        WildfireApp.layers.bufferIntersections.clearLayers();
        
        const bufferZones = [
            {
                name: 'San Jacinto Fire Buffer',
                center: [33.8144, -116.9428],
                radius: 2000,
                color: '#FF6B35'
            },
            {
                name: 'Desert Hills Fire Buffer',
                center: [33.7500, -116.4000],
                radius: 2500,
                color: '#FF8E53'
            },
            {
                name: 'Hemet Protection Buffer',
                center: [33.7475, -116.9719],
                radius: 1800,
                color: '#FF9068'
            }
        ];
        
        let successCount = 0;
        bufferZones.forEach(zone => {
            try {
                const circle = L.circle(zone.center, {
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.3,
                    weight: 2,
                    radius: zone.radius
                }).addTo(WildfireApp.layers.bufferIntersections);
                
                circle.bindPopup(`
                    <div style="min-width: 200px;">
                        <h4 style="color: ${zone.color};">⚠️ ${zone.name}</h4>
                        <div style="font-size: 12px;">
                            <strong>Buffer Radius:</strong> ${(zone.radius/1000).toFixed(1)} km<br>
                            <strong>Purpose:</strong> Fire containment zone<br>
                            <strong>Status:</strong> Active monitoring<br>
                            <strong>Risk Level:</strong> Moderate to High
                        </div>
                    </div>
                `);
                
                successCount++;
            } catch (error) {
                console.error(`Error creating buffer zone ${zone.name}:`, error);
            }
        });
        
        console.log(`✅ Created ${successCount} buffer intersections`);
        return successCount;
    }
};