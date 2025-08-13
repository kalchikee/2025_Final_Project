// Fire perimeter and risk management
const FireManager = {
    currentFirePerimeters: [],
    
    updateFireRiskSurface: function(currentHour = 6) {
        if (!WildfireApp.layers || !WildfireApp.layers.fireRisk) {
            console.warn('Fire risk layer not available');
            return;
        }
        
        console.log(`🌡️ Updating fire risk surface for ${currentHour}:00`);
        
        // Clear existing risk surface
        WildfireApp.layers.fireRisk.clearLayers();
        
        // Define risk zones based on time of day and weather conditions
        const riskZones = this.calculateRiskZones(currentHour);
        
        riskZones.forEach(zone => {
            const polygon = L.polygon(zone.coordinates, {
                color: zone.color,
                fillColor: zone.fillColor,
                fillOpacity: zone.opacity,
                weight: 2
            }).addTo(WildfireApp.layers.fireRisk);
            
            polygon.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="color: ${zone.color};">🔥 ${zone.name}</h4>
                    <div style="font-size: 12px;">
                        <strong>Risk Level:</strong> ${zone.level}<br>
                        <strong>Time:</strong> ${this.formatHour(currentHour)}<br>
                        <strong>Conditions:</strong> ${zone.conditions}<br>
                        <strong>Recommendation:</strong> ${zone.recommendation}
                    </div>
                </div>
            `);
        });
        
        console.log(`✅ Updated fire risk surface with ${riskZones.length} risk zones`);
    },
    
    calculateRiskZones: function(currentHour) {
        const zones = [];
        
        // High-risk mountainous areas (always elevated risk)
        zones.push({
            name: 'San Jacinto Mountains High Risk Zone',
            coordinates: [
                [33.85, -116.95],
                [33.80, -116.90],
                [33.75, -116.95],
                [33.80, -117.00]
            ],
            level: currentHour >= 12 && currentHour <= 16 ? 'EXTREME' : 'HIGH',
            color: currentHour >= 12 && currentHour <= 16 ? '#B71C1C' : '#D32F2F',
            fillColor: currentHour >= 12 && currentHour <= 16 ? '#B71C1C' : '#D32F2F',
            opacity: 0.4,
            conditions: this.getRiskConditions(currentHour),
            recommendation: currentHour >= 12 && currentHour <= 16 ? 'Extreme caution - avoid outdoor activities' : 'High caution - monitor conditions'
        });
        
        // Desert foothills (moderate risk, increases with heat/wind)
        zones.push({
            name: 'Desert Foothills Moderate Risk Zone',
            coordinates: [
                [33.80, -116.60],
                [33.70, -116.50],
                [33.60, -116.60],
                [33.70, -116.70]
            ],
            level: currentHour >= 13 && currentHour <= 17 ? 'HIGH' : 'MODERATE',
            color: currentHour >= 13 && currentHour <= 17 ? '#FF5722' : '#FF9800',
            fillColor: currentHour >= 13 && currentHour <= 17 ? '#FF5722' : '#FF9800',
            opacity: 0.3,
            conditions: this.getRiskConditions(currentHour),
            recommendation: currentHour >= 13 && currentHour <= 17 ? 'Be prepared - high fire danger' : 'Stay alert - moderate conditions'
        });
        
        // Urban-wildland interface
        zones.push({
            name: 'Urban-Wildland Interface Risk Zone',
            coordinates: [
                [33.90, -116.70],
                [33.85, -116.40],
                [33.75, -116.40],
                [33.80, -116.70]
            ],
            level: currentHour >= 14 && currentHour <= 16 ? 'HIGH' : 'MODERATE',
            color: currentHour >= 14 && currentHour <= 16 ? '#D32F2F' : '#FF9800',
            fillColor: currentHour >= 14 && currentHour <= 16 ? '#D32F2F' : '#FF9800',
            opacity: 0.25,
            conditions: this.getRiskConditions(currentHour),
            recommendation: 'Monitor closely - residential areas at interface'
        });
        
        return zones;
    },
    
    getRiskConditions: function(currentHour) {
        if (currentHour >= 6 && currentHour < 10) {
            return 'Morning - Low humidity, light winds';
        } else if (currentHour >= 10 && currentHour < 14) {
            return 'Late morning - Increasing temperatures and winds';
        } else if (currentHour >= 14 && currentHour < 18) {
            return 'Afternoon - CRITICAL: Peak winds, lowest humidity';
        } else if (currentHour >= 18 && currentHour < 22) {
            return 'Evening - Conditions moderating';
        } else {
            return 'Night - Calm conditions, higher humidity';
        }
    },

    // Population centers with coordinates for risk assessment
    populationCenters: [
        { name: 'La Quinta', coords: [33.6603, -116.3100], baseRisk: 'moderate' },
        { name: 'Palm Desert', coords: [33.7222, -116.3747], baseRisk: 'moderate' },
        { name: 'Rancho Mirage', coords: [33.7397, -116.4128], baseRisk: 'moderate' },
        { name: 'Desert Hot Springs', coords: [33.9611, -116.5019], baseRisk: 'high' },
        { name: 'Cathedral City', coords: [33.7794, -116.4658], baseRisk: 'moderate' },
        { name: 'Palm Springs', coords: [33.8303, -116.5453], baseRisk: 'moderate' },
        { name: 'Indio', coords: [33.7206, -116.2156], baseRisk: 'low' },
        { name: 'Coachella', coords: [33.6803, -116.1739], baseRisk: 'low' },
        { name: 'San Jacinto', coords: [33.7839, -116.9586], baseRisk: 'extreme' },
        { name: 'Hemet', coords: [33.7475, -117.0219], baseRisk: 'high' }
    ],

    // Fire perimeter and risk management functions
    createFirePerimeters: function(currentHour) {
        if (!WildfireApp.layers.firePerimeters) {
            return;
        }
        
        // Clear existing fire perimeters
        WildfireApp.layers.firePerimeters.clearLayers();
        this.currentFirePerimeters = [];
        
        // Get fire data for current time
        const fireData = fireProgressionData.timeSteps[currentHour];
        
        if (!fireData) {
            console.log(`No fire data for hour ${currentHour}`);
            return;
        }
        
        console.log(`🔥 Updating fire perimeters for ${currentHour}:00 - ${fireData.perimeters.length} active fires`);
        
        let totalAcres = 0;
        
        fireData.perimeters.forEach((fire, index) => {
            totalAcres += fire.acres;
            
            // Determine colors based on intensity
            const colors = {
                'low': { color: '#FF9800', fillColor: '#FF9800', fillOpacity: 0.3 },
                'moderate': { color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.4 },
                'high': { color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.5 },
                'extreme': { color: '#B71C1C', fillColor: '#B71C1C', fillOpacity: 0.6 },
                'contained': { color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.3 }
            };
            
            const style = colors[fire.intensity] || colors['moderate'];
            
            // Create fire perimeter circle
            const firePerimeter = L.circle(fire.center, {
                ...style,
                weight: 3,
                radius: fire.radius
            });
            
            // Add pulsing effect for active fires
            if (fire.intensity === 'extreme') {
                firePerimeter.options.className = 'fire-pulse-extreme';
            } else if (fire.intensity === 'high') {
                firePerimeter.options.className = 'fire-pulse-high';
            }
            
            // Create detailed popup
            const timeDisplay = this.formatHour(currentHour);
            firePerimeter.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="color: ${style.color};">🔥 Active Wildfire #${index + 1}</h4>
                    <div style="font-size: 12px; line-height: 1.4;">
                        <strong>Time:</strong> ${timeDisplay}<br>
                        <strong>Size:</strong> ${fire.acres} acres<br>
                        <strong>Intensity:</strong> ${fire.intensity.toUpperCase()}<br>
                        <strong>Containment:</strong> ${fire.containment}%<br>
                        <strong>Perimeter:</strong> ${(fire.radius * 2 * Math.PI / 1000).toFixed(1)} km<br>
                        <strong>Threat Level:</strong> ${this.getThreatLevel(fire.intensity, fire.containment)}
                    </div>
                </div>
            `);
            
            firePerimeter.addTo(WildfireApp.layers.firePerimeters);
            this.currentFirePerimeters.push(firePerimeter);
        });
        
        // UPDATE COMMUNITY RISK LEVELS based on new fire positions
        this.updateCommunityRiskLevels(currentHour);
        
        // UPDATE EVACUATION ZONES to move with fires
        this.updateDynamicEvacuationZones(currentHour);
        
        // Update narrative with fire status
        if (WildfireApp.updateNarrative) {
            const timeDisplay = this.formatHour(currentHour);
            const fireCount = fireData.perimeters.length;
            const status = this.getFireStatus(currentHour, fireData);
            
            // Count communities at each risk level
            const riskCounts = this.getCommunityRiskCounts(currentHour);
            const riskSummary = riskCounts.extreme > 0 ? `🚨 ${riskCounts.extreme} communities at EXTREME risk!` :
                               riskCounts.high > 0 ? `⚠️ ${riskCounts.high} communities at HIGH risk` :
                               riskCounts.moderate > 0 ? `${riskCounts.moderate} communities at elevated risk` :
                               'All communities at normal risk levels';
            
            WildfireApp.updateNarrative(`🔥 ${timeDisplay}: ${fireCount} active fire${fireCount > 1 ? 's' : ''} burning ${totalAcres} acres. ${status} ${riskSummary}`);
        }
        
        console.log(`✅ Fire perimeters updated: ${fireData.perimeters.length} fires, ${totalAcres} total acres`);
    },
    
    updateCommunityRiskLevels: function(currentHour) {
        if (!WildfireApp.layers || !WildfireApp.layers.populationCenters) {
            console.warn('Population centers layer not available for risk updates');
            return;
        }

        console.log(`🏘️ Updating community risk levels for ${currentHour}:00`);

        // Get current fire data
        const fireData = fireProgressionData.timeSteps[currentHour];
        if (!fireData) {
            console.log(`No fire data for community risk updates at hour ${currentHour}`);
            return;
        }

        // Clear existing community markers and recreate with updated risk levels
        WildfireApp.layers.populationCenters.clearLayers();

        let updatedCommunities = 0;

        // Check each community against all active fires
        this.populationCenters.forEach(community => {
            let highestRiskLevel = community.baseRisk;
            let nearestFire = null;
            let minimumDistance = Infinity;

            // Check distance to each active fire
            fireData.perimeters.forEach((fire, fireIndex) => {
                const distance = this.calculateDistanceInKm(community.coords, fire.center);
                
                if (distance < minimumDistance) {
                    minimumDistance = distance;
                    nearestFire = {
                        name: this.getFireName(fire, fireIndex),
                        distance: distance,
                        intensity: fire.intensity,
                        acres: fire.acres,
                        containment: fire.containment
                    };
                }

                // Update risk level based on proximity and fire intensity
                if (distance <= 10) { // Within 10km
                    const fireRisk = this.calculateFireThreatLevel(distance, fire.intensity, fire.containment);
                    if (this.getRiskPriority(fireRisk) > this.getRiskPriority(highestRiskLevel)) {
                        highestRiskLevel = fireRisk;
                    }
                }
            });

            // Create community marker with updated risk level
            this.createCommunityMarker(community, highestRiskLevel, nearestFire, currentHour);
            updatedCommunities++;
        });

        console.log(`✅ Updated ${updatedCommunities} community risk levels for hour ${currentHour}`);
    },

    getFireName: function(fire, index) {
        // Determine fire name based on location and index
        const lat = fire.center[0];
        const lng = fire.center[1];
        
        // San Jacinto area fires (around -116.95 longitude)
        if (lng < -116.90) {
            if (index === 0) return 'San Jacinto Fire';
            if (index === 1) return 'San Jacinto Spot Fire';
            return `San Jacinto Fire #${index + 1}`;
        }
        
        // Desert Hills area fires (around -116.4 to -116.3 longitude)
        if (lng > -116.45 && lng < -116.25) {
            return 'Desert Hills Fire';
        }
        
        // Default naming
        return `Active Wildfire #${index + 1}`;
    },

    calculateEvacuationRadius: function(fire) {
        // Calculate evacuation radius based on fire size and intensity
        let baseRadius = fire.radius + 2000; // 2km beyond fire perimeter
        
        // Adjust based on intensity
        const intensityMultipliers = {
            'low': 1.0,
            'moderate': 1.2,
            'high': 1.5,
            'extreme': 2.0,
            'contained': 0.8
        };
        
        const multiplier = intensityMultipliers[fire.intensity] || 1.0;
        return Math.round(baseRadius * multiplier);
    },

    getEvacuationThreatLevel: function(fire, currentHour) {
        // Determine if evacuation should be mandatory or warning based on fire characteristics
        
        // Extreme intensity fires always require mandatory evacuation
        if (fire.intensity === 'extreme') {
            return 'Mandatory';
        }
        
        // High intensity fires with low containment during peak hours
        if (fire.intensity === 'high' && fire.containment < 25 && currentHour >= 12 && currentHour <= 18) {
            return 'Mandatory';
        }
        
        // High intensity fires with moderate containment
        if (fire.intensity === 'high' && fire.containment < 50) {
            return 'Mandatory';
        }
        
        // Large fires (over 1000 acres) with low containment
        if (fire.acres > 1000 && fire.containment < 30) {
            return 'Mandatory';
        }
        
        // High or moderate intensity fires during peak fire weather
        if ((fire.intensity === 'high' || fire.intensity === 'moderate') && currentHour >= 13 && currentHour <= 17) {
            return 'Warning';
        }
        
        // Well-contained fires
        if (fire.containment >= 75) {
            return 'Advisory';
        }
        
        // Default to warning level
        return 'Warning';
    },

    getThreatenedCommunities: function(fire, evacuationRadius) {
        // Determine which communities are within the evacuation radius
        const threatenedCommunities = [];
        
        this.populationCenters.forEach(community => {
            const distance = this.calculateDistanceInKm(community.coords, fire.center);
            const distanceInMeters = distance * 1000;
            
            if (distanceInMeters <= evacuationRadius) {
                threatenedCommunities.push(community.name);
            }
        });
        
        // If no specific communities, provide general area description
        if (threatenedCommunities.length === 0) {
            const lat = fire.center[0];
            const lng = fire.center[1];
            
            if (lng < -116.90) {
                threatenedCommunities.push('San Jacinto Mountain Communities');
            } else if (lng > -116.45) {
                threatenedCommunities.push('Desert Communities');
            } else {
                threatenedCommunities.push('Surrounding Communities');
            }
        }
        
        return threatenedCommunities;
    },

    // Fire perimeter and risk management functions
    createFirePerimeters: function(currentHour) {
        if (!WildfireApp.layers.firePerimeters) {
            return;
        }
        
        // Clear existing fire perimeters
        WildfireApp.layers.firePerimeters.clearLayers();
        this.currentFirePerimeters = [];
        
        // Get fire data for current time
        const fireData = fireProgressionData.timeSteps[currentHour];
        
        if (!fireData) {
            console.log(`No fire data for hour ${currentHour}`);
            return;
        }
        
        console.log(`🔥 Updating fire perimeters for ${currentHour}:00 - ${fireData.perimeters.length} active fires`);
        
        let totalAcres = 0;
        
        fireData.perimeters.forEach((fire, index) => {
            totalAcres += fire.acres;
            
            // Determine colors based on intensity
            const colors = {
                'low': { color: '#FF9800', fillColor: '#FF9800', fillOpacity: 0.3 },
                'moderate': { color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.4 },
                'high': { color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.5 },
                'extreme': { color: '#B71C1C', fillColor: '#B71C1C', fillOpacity: 0.6 },
                'contained': { color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.3 }
            };
            
            const style = colors[fire.intensity] || colors['moderate'];
            
            // Create fire perimeter circle
            const firePerimeter = L.circle(fire.center, {
                ...style,
                weight: 3,
                radius: fire.radius
            });
            
            // Add pulsing effect for active fires
            if (fire.intensity === 'extreme') {
                firePerimeter.options.className = 'fire-pulse-extreme';
            } else if (fire.intensity === 'high') {
                firePerimeter.options.className = 'fire-pulse-high';
            }
            
            // Create detailed popup
            const timeDisplay = this.formatHour(currentHour);
            firePerimeter.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="color: ${style.color};">🔥 Active Wildfire #${index + 1}</h4>
                    <div style="font-size: 12px; line-height: 1.4;">
                        <strong>Time:</strong> ${timeDisplay}<br>
                        <strong>Size:</strong> ${fire.acres} acres<br>
                        <strong>Intensity:</strong> ${fire.intensity.toUpperCase()}<br>
                        <strong>Containment:</strong> ${fire.containment}%<br>
                        <strong>Perimeter:</strong> ${(fire.radius * 2 * Math.PI / 1000).toFixed(1)} km<br>
                        <strong>Threat Level:</strong> ${this.getThreatLevel(fire.intensity, fire.containment)}
                    </div>
                </div>
            `);
            
            firePerimeter.addTo(WildfireApp.layers.firePerimeters);
            this.currentFirePerimeters.push(firePerimeter);
        });
        
        // UPDATE COMMUNITY RISK LEVELS based on new fire positions
        this.updateCommunityRiskLevels(currentHour);
        
        // UPDATE EVACUATION ZONES to move with fires
        this.updateDynamicEvacuationZones(currentHour);
        
        // Update narrative with fire status
        if (WildfireApp.updateNarrative) {
            const timeDisplay = this.formatHour(currentHour);
            const fireCount = fireData.perimeters.length;
            const status = this.getFireStatus(currentHour, fireData);
            
            // Count communities at each risk level
            const riskCounts = this.getCommunityRiskCounts(currentHour);
            const riskSummary = riskCounts.extreme > 0 ? `🚨 ${riskCounts.extreme} communities at EXTREME risk!` :
                               riskCounts.high > 0 ? `⚠️ ${riskCounts.high} communities at HIGH risk` :
                               riskCounts.moderate > 0 ? `${riskCounts.moderate} communities at elevated risk` :
                               'All communities at normal risk levels';
            
            WildfireApp.updateNarrative(`🔥 ${timeDisplay}: ${fireCount} active fire${fireCount > 1 ? 's' : ''} burning ${totalAcres} acres. ${status} ${riskSummary}`);
        }
        
        console.log(`✅ Fire perimeters updated: ${fireData.perimeters.length} fires, ${totalAcres} total acres`);
    },
    
    updateCommunityRiskLevels: function(currentHour) {
        if (!WildfireApp.layers || !WildfireApp.layers.populationCenters) {
            console.warn('Population centers layer not available for risk updates');
            return;
        }

        console.log(`🏘️ Updating community risk levels for ${currentHour}:00`);

        // Get current fire data
        const fireData = fireProgressionData.timeSteps[currentHour];
        if (!fireData) {
            console.log(`No fire data for community risk updates at hour ${currentHour}`);
            return;
        }

        // Clear existing community markers and recreate with updated risk levels
        WildfireApp.layers.populationCenters.clearLayers();

        let updatedCommunities = 0;

        // Check each community against all active fires
        this.populationCenters.forEach(community => {
            let highestRiskLevel = community.baseRisk;
            let nearestFire = null;
            let minimumDistance = Infinity;

            // Check distance to each active fire
            fireData.perimeters.forEach((fire, fireIndex) => {
                const distance = this.calculateDistanceInKm(community.coords, fire.center);
                
                if (distance < minimumDistance) {
                    minimumDistance = distance;
                    nearestFire = {
                        name: this.getFireName(fire, fireIndex),
                        distance: distance,
                        intensity: fire.intensity,
                        acres: fire.acres,
                        containment: fire.containment
                    };
                }

                // Update risk level based on proximity and fire intensity
                if (distance <= 10) { // Within 10km
                    const fireRisk = this.calculateFireThreatLevel(distance, fire.intensity, fire.containment);
                    if (this.getRiskPriority(fireRisk) > this.getRiskPriority(highestRiskLevel)) {
                        highestRiskLevel = fireRisk;
                    }
                }
            });

            // Create community marker with updated risk level
            this.createCommunityMarker(community, highestRiskLevel, nearestFire, currentHour);
            updatedCommunities++;
        });

        console.log(`✅ Updated ${updatedCommunities} community risk levels for hour ${currentHour}`);
    },

    getFireName: function(fire, index) {
        // Determine fire name based on location and index
        const lat = fire.center[0];
        const lng = fire.center[1];
        
        // San Jacinto area fires (around -116.95 longitude)
        if (lng < -116.90) {
            if (index === 0) return 'San Jacinto Fire';
            if (index === 1) return 'San Jacinto Spot Fire';
            return `San Jacinto Fire #${index + 1}`;
        }
        
        // Desert Hills area fires (around -116.4 to -116.3 longitude)
        if (lng > -116.45 && lng < -116.25) {
            return 'Desert Hills Fire';
        }
        
        // Default naming
        return `Active Wildfire #${index + 1}`;
    },

    calculateEvacuationRadius: function(fire) {
        // Calculate evacuation radius based on fire size and intensity
        let baseRadius = fire.radius + 2000; // 2km beyond fire perimeter
        
        // Adjust based on intensity
        const intensityMultipliers = {
            'low': 1.0,
            'moderate': 1.2,
            'high': 1.5,
            'extreme': 2.0,
            'contained': 0.8
        };
        
        const multiplier = intensityMultipliers[fire.intensity] || 1.0;
        return Math.round(baseRadius * multiplier);
    },

    getEvacuationThreatLevel: function(fire, currentHour) {
        // Determine if evacuation should be mandatory or warning based on fire characteristics
        
        // Extreme intensity fires always require mandatory evacuation
        if (fire.intensity === 'extreme') {
            return 'Mandatory';
        }
        
        // High intensity fires with low containment during peak hours
        if (fire.intensity === 'high' && fire.containment < 25 && currentHour >= 12 && currentHour <= 18) {
            return 'Mandatory';
        }
        
        // High intensity fires with moderate containment
        if (fire.intensity === 'high' && fire.containment < 50) {
            return 'Mandatory';
        }
        
        // Large fires (over 1000 acres) with low containment
        if (fire.acres > 1000 && fire.containment < 30) {
            return 'Mandatory';
        }
        
        // High or moderate intensity fires during peak fire weather
        if ((fire.intensity === 'high' || fire.intensity === 'moderate') && currentHour >= 13 && currentHour <= 17) {
            return 'Warning';
        }
        
        // Well-contained fires
        if (fire.containment >= 75) {
            return 'Advisory';
        }
        
        // Default to warning level
        return 'Warning';
    },

    getThreatenedCommunities: function(fire, evacuationRadius) {
        // Determine which communities are within the evacuation radius
        const threatenedCommunities = [];
        
        this.populationCenters.forEach(community => {
            const distance = this.calculateDistanceInKm(community.coords, fire.center);
            const distanceInMeters = distance * 1000;
            
            if (distanceInMeters <= evacuationRadius) {
                threatenedCommunities.push(community.name);
            }
        });
        
        // If no specific communities, provide general area description
        if (threatenedCommunities.length === 0) {
            const lat = fire.center[0];
            const lng = fire.center[1];
            
            if (lng < -116.90) {
                threatenedCommunities.push('San Jacinto Mountain Communities');
            } else if (lng > -116.45) {
                threatenedCommunities.push('Desert Communities');
            } else {
                threatenedCommunities.push('Surrounding Communities');
            }
        }
        
        return threatenedCommunities;
    },

    // Fire perimeter and risk management functions
    createFirePerimeters: function(currentHour) {
        if (!WildfireApp.layers.firePerimeters) {
            return;
        }
        
        // Clear existing fire perimeters
        WildfireApp.layers.firePerimeters.clearLayers();
        this.currentFirePerimeters = [];
        
        // Get fire data for current time
        const fireData = fireProgressionData.timeSteps[currentHour];
        
        if (!fireData) {
            console.log(`No fire data for hour ${currentHour}`);
            return;
        }
        
        console.log(`🔥 Updating fire perimeters for ${currentHour}:00 - ${fireData.perimeters.length} active fires`);
        
        let totalAcres = 0;
        
        fireData.perimeters.forEach((fire, index) => {
            totalAcres += fire.acres;
            
            // Determine colors based on intensity
            const colors = {
                'low': { color: '#FF9800', fillColor: '#FF9800', fillOpacity: 0.3 },
                'moderate': { color: '#FF5722', fillColor: '#FF5722', fillOpacity: 0.4 },
                'high': { color: '#D32F2F', fillColor: '#D32F2F', fillOpacity: 0.5 },
                'extreme': { color: '#B71C1C', fillColor: '#B71C1C', fillOpacity: 0.6 },
                'contained': { color: '#4CAF50', fillColor: '#4CAF50', fillOpacity: 0.3 }
            };
            
            const style = colors[fire.intensity] || colors['moderate'];
            
            // Create fire perimeter circle
            const firePerimeter = L.circle(fire.center, {
                ...style,
                weight: 3,
                radius: fire.radius
            });
            
            // Add pulsing effect for active fires
            if (fire.intensity === 'extreme') {
                firePerimeter.options.className = 'fire-pulse-extreme';
            } else if (fire.intensity === 'high') {
                firePerimeter.options.className = 'fire-pulse-high';
            }
            
            // Create detailed popup
            const timeDisplay = this.formatHour(currentHour);
            firePerimeter.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="color: ${style.color};">🔥 Active Wildfire #${index + 1}</h4>
                    <div style="font-size: 12px; line-height: 1.4;">
                        <strong>Time:</strong> ${timeDisplay}<br>
                        <strong>Size:</strong> ${fire.acres} acres<br>
                        <strong>Intensity:</strong> ${fire.intensity.toUpperCase()}<br>
                        <strong>Containment:</strong> ${fire.containment}%<br>
                        <strong>Perimeter:</strong> ${(fire.radius * 2 * Math.PI / 1000).toFixed(1)} km<br>
                        <strong>Threat Level:</strong> ${this.getThreatLevel(fire.intensity, fire.containment)}
                    </div>
                </div>
            `);
            
            firePerimeter.addTo(WildfireApp.layers.firePerimeters);
            this.currentFirePerimeters.push(firePerimeter);
        });
        
        // UPDATE COMMUNITY RISK LEVELS based on new fire positions
        this.updateCommunityRiskLevels(currentHour);
        
        // UPDATE EVACUATION ZONES to move with fires
        this.updateDynamicEvacuationZones(currentHour);
        
        // Update narrative with fire status
        if (WildfireApp.updateNarrative) {
            const timeDisplay = this.formatHour(currentHour);
            const fireCount = fireData.perimeters.length;
            const status = this.getFireStatus(currentHour, fireData);
            
            // Count communities at each risk level
            const riskCounts = this.getCommunityRiskCounts(currentHour);
            const riskSummary = riskCounts.extreme > 0 ? `🚨 ${riskCounts.extreme} communities at EXTREME risk!` :
                               riskCounts.high > 0 ? `⚠️ ${riskCounts.high} communities at HIGH risk` :
                               riskCounts.moderate > 0 ? `${riskCounts.moderate} communities at elevated risk` :
                               'All communities at normal risk levels';
            
            WildfireApp.updateNarrative(`🔥 ${timeDisplay}: ${fireCount} active fire${fireCount > 1 ? 's' : ''} burning ${totalAcres} acres. ${status} ${riskSummary}`);
        }
        
        console.log(`✅ Fire perimeters updated: ${fireData.perimeters.length} fires, ${totalAcres} total acres`);
    },
    
    updateCommunityRiskLevels: function(currentHour) {
        if (!WildfireApp.layers || !WildfireApp.layers.populationCenters) {
            console.warn('Population centers layer not available for risk updates');
            return;
        }

        console.log(`🏘️ Updating community risk levels for ${currentHour}:00`);

        // Get current fire data
        const fireData = fireProgressionData.timeSteps[currentHour];
        if (!fireData) {
            console.log(`No fire data for community risk updates at hour ${currentHour}`);
            return;
        }

        // Clear existing community markers and recreate with updated risk levels
        WildfireApp.layers.populationCenters.clearLayers();

        let updatedCommunities = 0;

        // Check each community against all active fires
        this.populationCenters.forEach(community => {
            let highestRiskLevel = community.baseRisk;
            let nearestFire = null;
            let minimumDistance = Infinity;

            // Check distance to each active fire
            fireData.perimeters.forEach((fire, fireIndex) => {
                const distance = this.calculateDistanceInKm(community.coords, fire.center);
                
                if (distance < minimumDistance) {
                    minimumDistance = distance;
                    nearestFire = {
                        name: this.getFireName(fire, fireIndex),
                        distance: distance,
                        intensity: fire.intensity,
                        acres: fire.acres,
                        containment: fire.containment
                    };
                }

                // Update risk level based on proximity and fire intensity
                if (distance <= 10) { // Within 10km
                    const fireRisk = this.calculateFireThreatLevel(distance, fire.intensity, fire.containment);
                    if (this.getRiskPriority(fireRisk) > this.getRiskPriority(highestRiskLevel)) {
                        highestRiskLevel = fireRisk;
                    }
                }
            });

            // Create community marker with updated risk level
            this.createCommunityMarker(community, highestRiskLevel, nearestFire, currentHour);
            updatedCommunities++;
        });

        console.log(`✅ Updated ${updatedCommunities} community risk levels for hour ${currentHour}`);
    },

    calculateFireThreatLevel: function(distance, fireIntensity, containment) {
        // Calculate threat level based on distance, fire intensity, and containment
        
        // Base threat on distance (closer = higher threat)
        let threat = 'low';
        
        if (distance <= 2) { // Within 2km
            if (fireIntensity === 'extreme' || (fireIntensity === 'high' && containment < 25)) {
                threat = 'extreme';
            } else if (fireIntensity === 'high' || (fireIntensity === 'moderate' && containment < 50)) {
                threat = 'high';
            } else {
                threat = 'high';
            }
        } else if (distance <= 5) { // 2-5km
            if (fireIntensity === 'extreme') {
                threat = 'extreme';
            } else if (fireIntensity === 'high' && containment < 50) {
                threat = 'high';
            } else if (fireIntensity === 'high' || fireIntensity === 'moderate') {
                threat = 'moderate';
            } else {
                threat = 'moderate';
            }
        } else if (distance <= 10) { // 5-10km
            if (fireIntensity === 'extreme' && containment < 25) {
                threat = 'high';
            } else if (fireIntensity === 'extreme' || (fireIntensity === 'high' && containment < 75)) {
                threat = 'moderate';
            } else {
                threat = 'low';
            }
        }

        // Adjust for containment level
        if (containment >= 75) {
            threat = this.reduceRiskLevel(threat);
        }

        return threat;
    },

    getRiskPriority: function(riskLevel) {
        // Return numeric priority for risk comparison
        const priorities = {
            'low': 1,
            'moderate': 2,
            'high': 3,
            'extreme': 4
        };
        return priorities[riskLevel] || 1;
    },

    reduceRiskLevel: function(currentRisk) {
        // Reduce risk level by one step for high containment
        const reductionMap = {
            'extreme': 'high',
            'high': 'moderate',
            'moderate': 'low',
            'low': 'low'
        };
        return reductionMap[currentRisk] || 'low';
    },

    calculateDistanceInKm: function(point1, point2) {
        // Haversine formula for calculating distance between two lat/lng points
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(point2[0] - point1[0]);
        const dLon = this.toRadians(point2[1] - point1[1]);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRadians(point1[0])) * Math.cos(this.toRadians(point2[0])) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    toRadians: function(degrees) {
        return degrees * (Math.PI / 180);
    },

    createCommunityMarker: function(community, riskLevel, nearestFire, currentHour) {
        // Ensure population centers layer exists
        if (!WildfireApp.layers || !WildfireApp.layers.populationCenters) {
            console.error('Population centers layer not available for marker creation');
            // Try to create it if it doesn't exist
            if (WildfireApp.layers) {
                WildfireApp.layers.populationCenters = L.layerGroup().addTo(WildfireApp.map);
            } else {
                console.error('WildfireApp.layers not initialized');
                return;
            }
        }

        // Create marker with risk-appropriate styling
        const riskStyles = {
            'low': { 
                color: '#4CAF50', 
                icon: '🟢', 
                bgColor: '#E8F5E8',
                alertLevel: 'Normal Conditions'
            },
            'moderate': { 
                color: '#FF9800', 
                icon: '🟡', 
                bgColor: '#FFF3E0',
                alertLevel: 'Elevated Risk'
            },
            'high': { 
                color: '#FF5722', 
                icon: '🟠', 
                bgColor: '#FFEBEE',
                alertLevel: 'High Risk'
            },
            'extreme': { 
                color: '#D32F2F', 
                icon: '🔴', 
                bgColor: '#FFEBEE',
                alertLevel: 'EXTREME DANGER'
            }
        };

        const style = riskStyles[riskLevel] || riskStyles['low'];

        try {
            // Create custom icon based on risk level
            const customIcon = L.divIcon({
                className: `community-risk-marker ${riskLevel === 'extreme' ? 'extreme-risk-pulse' : ''}`,
                html: `
                    <div style="
                        background: ${style.bgColor}; 
                        border: 3px solid ${style.color}; 
                        border-radius: 50%; 
                        width: 35px; 
                        height: 35px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        font-size: 16px;
                        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                        position: relative;
                        z-index: 1000;
                    ">
                        ${style.icon}
                    </div>
                `,
                iconSize: [35, 35],
                iconAnchor: [17, 17],
                popupAnchor: [0, -17]
            });

            // Create marker
            const marker = L.marker(community.coords, { 
                icon: customIcon,
                riseOnHover: true,
                zIndexOffset: 1000 // Keep community markers above other features
            });

            // Add to population centers layer
            marker.addTo(WildfireApp.layers.populationCenters);

            // Create detailed popup with fire threat information
            const timeDisplay = this.formatHour(currentHour);
            const threatDescription = this.getThreatDescription(riskLevel, nearestFire);
            
            marker.bindPopup(`
                <div style="min-width: 280px;">
                    <h4 style="color: ${style.color}; margin-bottom: 10px;">
                        ${style.icon} ${community.name}
                    </h4>
                    
                    <div style="background: ${style.bgColor}; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
                        <strong style="color: ${style.color};">Risk Level: ${style.alertLevel}</strong>
                    </div>
                    
                    <div style="font-size: 12px; line-height: 1.5;">
                        <strong>Current Time:</strong> ${timeDisplay}<br>
                        <strong>Base Risk:</strong> ${community.baseRisk.toUpperCase()}<br>
                        
                        ${nearestFire ? `
                            <div style="margin-top: 10px; padding: 8px; background: #FFF8E1; border-radius: 4px;">
                                <strong>🔥 Nearest Fire Threat:</strong><br>
                                <strong>Fire:</strong> ${nearestFire.name}<br>
                                <strong>Distance:</strong> ${nearestFire.distance.toFixed(1)} km<br>
                                <strong>Fire Size:</strong> ${nearestFire.acres} acres<br>
                                <strong>Intensity:</strong> ${nearestFire.intensity.toUpperCase()}<br>
                                <strong>Containment:</strong> ${nearestFire.containment}%
                            </div>
                        ` : `
                            <div style="margin-top: 10px; padding: 8px; background: #E8F5E8; border-radius: 4px;">
                                <strong>✅ No immediate fire threats</strong><br>
                                All fires are more than 10km away.
                            </div>
                        `}
                        
                        <div style="margin-top: 10px; padding: 8px; background: #F3E5F5; border-radius: 4px;">
                            <strong>📋 Recommendations:</strong><br>
                            ${this.getRiskRecommendations(riskLevel)}
                        </div>
                    </div>
                </div>
            `);

            console.log(`✅ Created community marker for ${community.name} with ${riskLevel} risk level`);

            return marker;

        } catch (error) {
            console.error(`Error creating community marker for ${community.name}:`, error);
            return null;
        }
    },

    getThreatDescription: function(riskLevel, nearestFire) {
        if (!nearestFire) {
            return "No immediate fire threats detected.";
        }

        const distance = nearestFire.distance;
        if (distance <= 2) {
            return `IMMEDIATE THREAT: ${nearestFire.name} is only ${distance.toFixed(1)}km away!`;
        } else if (distance <= 5) {
            return `HIGH THREAT: ${nearestFire.name} is ${distance.toFixed(1)}km away and may spread rapidly.`;
        } else {
            return `MODERATE THREAT: ${nearestFire.name} is ${distance.toFixed(1)}km away. Monitor conditions.`;
        }
    },

    getRiskRecommendations: function(riskLevel) {
        const recommendations = {
            'low': 'Continue normal activities. Stay informed about fire conditions.',
            'moderate': 'Stay alert. Prepare emergency kits. Monitor fire conditions closely.',
            'high': 'Be ready to evacuate. Pack essential items. Stay tuned to emergency alerts.',
            'extreme': '🚨 EVACUATE NOW or be prepared to evacuate immediately. Follow official evacuation routes.'
        };
        return recommendations[riskLevel] || recommendations['low'];
    },
    
    formatHour: function(hour) {
        const times = [
            '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
            '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
            '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
        ];
        return times[hour - 6] || `${hour}:00`;
    },
    
    getThreatLevel: function(intensity, containment) {
        // Get threat level description based on fire characteristics
        if (containment >= 75) return 'LOW - Well Contained';
        if (intensity === 'extreme') return 'EXTREME - Immediate Threat';
        if (intensity === 'high') return 'HIGH - Major Threat';
        if (intensity === 'moderate') return 'MODERATE - Monitor Closely';
        return 'LOW - Manageable';
    },
    
    getFireStatus: function(hour, fireData) {
        // Get narrative fire status based on time of day
        if (hour <= 8) return 'Early detection and initial response.';
        if (hour <= 12) return 'Fire spreading due to increasing winds.';
        if (hour <= 16) return 'CRITICAL: Peak fire behavior. Multiple spot fires.';
        if (hour <= 18) return 'Containment efforts showing progress.';
        return 'Fire activity decreasing. Night suppression operations.';
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
    },

    // ADD THIS NEW FUNCTION:
    updateDynamicEvacuationZones: function(currentHour) {
        if (!WildfireApp.layers || !WildfireApp.layers.evacuationZones) {
            console.warn('Evacuation zones layer not available');
            return;
        }

        console.log(`🚨 Updating dynamic evacuation zones for ${currentHour}:00`);
        
        // Clear existing evacuation zones
        WildfireApp.layers.evacuationZones.clearLayers();

        // Get current fire data
        const fireData = fireProgressionData.timeSteps[currentHour];
        if (!fireData) {
            console.log(`No fire data for evacuation zone updates at hour ${currentHour}`);
            return;
        }

        let evacuationZones = [];

        // Process each active fire perimeter and create moving evacuation zones
        fireData.perimeters.forEach((fire, index) => {
            // Create evacuation zones based on fire's CURRENT location and intensity
            const evacuationRadius = this.calculateEvacuationRadius(fire);
            const threatLevel = this.getEvacuationThreatLevel(fire, currentHour);
            const zoneColor = threatLevel === 'Mandatory' ? '#D32F2F' : '#FF9800';

            // Determine which communities are threatened at this time
            const threatenedCommunities = this.getThreatenedCommunities(fire, evacuationRadius);

            // Create evacuation zone that follows the fire
            evacuationZones.push({
                name: this.getFireName(fire, index),
                center: fire.center, // THIS MOVES WITH THE FIRE!
                radius: evacuationRadius,
                level: threatLevel,
                color: zoneColor,
                communities: threatenedCommunities,
                fireIntensity: fire.intensity,
                containment: fire.containment,
                acres: fire.acres,
                fireIndex: index
            });
        });

        // SPECIAL MOVING EVACUATION ZONE for Desert Hills Fire as it approaches La Quinta
        const desertHillsFire = this.findDesertHillsFire(fireData.perimeters);

        if (desertHillsFire) {
            const distanceToLaQuinta = this.calculateDistanceInKm([33.6603, -116.3100], desertHillsFire.center);
            
            if (distanceToLaQuinta <= 8) { // Within 8 km of La Quinta
                const emergencyLevel = distanceToLaQuinta <= 3 ? 'Mandatory' : 'Warning';
                const emergencyColor = distanceToLaQuinta <= 3 ? '#B71C1C' : '#FF5722';
                
                // Create La Quinta-specific evacuation zone that adjusts as fire moves
                evacuationZones.push({
                    name: distanceToLaQuinta <= 3 ? 
                          'La Quinta EMERGENCY Evacuation Zone' : 
                          'La Quinta Pre-Evacuation Warning Zone',
                    center: this.calculateEvacuationZoneCenter(desertHillsFire.center, [33.6603, -116.3100]),
                    radius: distanceToLaQuinta <= 3 ? 4000 : 6000,
                    level: emergencyLevel,
                    color: emergencyColor,
                    communities: ['La Quinta', 'Desert Club Estates', 'PGA West'],
                    fireIntensity: desertHillsFire.intensity,
                    containment: desertHillsFire.containment,
                    acres: desertHillsFire.acres,
                    specialAlert: true,
                    distanceToTarget: distanceToLaQuinta
                });
            }
        }

        // Create the evacuation zone circles on the map
        let zoneCount = 0;
        evacuationZones.forEach((zone, zoneIndex) => {
            try {
                const circle = L.circle(zone.center, {
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: zone.specialAlert ? 0.35 : 0.25,
                    weight: zone.specialAlert ? 4 : 3,
                    radius: zone.radius,
                    className: zone.specialAlert ? 'emergency-evacuation-zone pulse-border' : 'evacuation-zone'
                }).addTo(WildfireApp.layers.evacuationZones);

                // Create detailed popup showing movement
                const timeDisplay = this.formatHour(currentHour);
                const movementInfo = this.getZoneMovementInfo(zone, currentHour);
                
                circle.bindPopup(`
                    <div style="min-width: 280px;">
                        <h4 style="color: ${zone.color};">${zone.specialAlert ? '🚨' : '⚠️'} ${zone.name}</h4>
                        <div style="font-size: 12px; line-height: 1.4;">
                            <strong>Evacuation Level:</strong> ${zone.level}<br>
                            <strong>Time:</strong> ${timeDisplay}<br>
                            <strong>Threatened Communities:</strong> ${zone.communities.join(', ')}<br>
                            <strong>Fire Size:</strong> ${zone.acres} acres<br>
                            <strong>Fire Intensity:</strong> ${zone.fireIntensity.toUpperCase()}<br>
                            <strong>Containment:</strong> ${zone.containment}%<br>
                            <strong>Buffer Radius:</strong> ${(zone.radius/1000).toFixed(1)} km<br>
                            
                            ${zone.distanceToTarget ? `
                                <div style="background: #fff3e0; padding: 6px; margin: 8px 0; border-radius: 4px;">
                                    <strong>🎯 Distance to La Quinta:</strong> ${zone.distanceToTarget.toFixed(1)} km<br>
                                    <strong>Fire Direction:</strong> ${this.getFireDirection(currentHour)}
                                </div>
                            ` : ''}
                            
                            <div style="background: #e3f2fd; padding: 6px; margin: 8px 0; border-radius: 4px;">
                                <strong>📍 Zone Movement:</strong><br>
                                ${movementInfo}
                            </div>
                            
                            ${zone.level === 'Mandatory' ? 
                                '<div style="background: #ffebee; padding: 8px; margin-top: 8px; border-radius: 4px;"><strong style="color: #d32f2f;">🚨 EVACUATE IMMEDIATELY</strong><br>Leave the area now via established evacuation routes.</div>' : 
                                '<div style="background: #fff3e0; padding: 8px; margin-top: 8px; border-radius: 4px;"><strong style="color: #ef6c00;">⚠️ BE PREPARED TO EVACUATE</strong><br>Monitor conditions and be ready to leave quickly.</div>'
                            }
                        </div>
                    </div>
                `);

                // Add pulsing animation for urgent zones
                if (zone.specialAlert && zone.distanceToTarget <= 3) {
                    circle.setStyle({
                        className: 'emergency-evacuation-zone pulse-urgent'
                    });
                }

                zoneCount++;
            } catch (error) {
                console.error(`Error creating evacuation zone ${zone.name}:`, error);
            }
        });

        // ALSO UPDATE THE FIRE BUFFERS to move with fires
        this.updateMovingFireBuffers(currentHour, fireData);

        console.log(`✅ Created ${zoneCount} dynamic evacuation zones that move with fires for hour ${currentHour}`);
    },

    // NEW FUNCTION: Update fire buffers that move with the fires
    updateMovingFireBuffers: function(currentHour, fireData) {
        if (!WildfireApp.layers || !WildfireApp.layers.bufferIntersections) {
            return;
        }

        console.log(`🛡️ Updating moving fire buffers for ${currentHour}:00`);
        
        // Clear existing buffer zones
        WildfireApp.layers.bufferIntersections.clearLayers();

        fireData.perimeters.forEach((fire, index) => {
            // Create containment buffer that moves with each fire
            const bufferRadius = fire.radius + 1000; // 1km beyond fire perimeter
            const bufferColor = this.getBufferColor(fire.intensity, fire.containment);
            
            try {
                const bufferCircle = L.circle(fire.center, { // Moves with fire center!
                    color: bufferColor,
                    fillColor: bufferColor,
                    fillOpacity: 0.15,
                    weight: 2,
                    radius: bufferRadius,
                    dashArray: '5, 10', // Dashed line for buffers
                    className: 'fire-buffer-zone'
                }).addTo(WildfireApp.layers.bufferIntersections);

                const fireTypeName = this.getFireName(fire, index).replace(' Evacuation Zone', '');
                const timeDisplay = this.formatHour(currentHour);
                
                bufferCircle.bindPopup(`
                    <div style="min-width: 220px;">
                        <h4 style="color: ${bufferColor};">🛡️ ${fireTypeName} Buffer Zone</h4>
                        <div style="font-size: 12px; line-height: 1.4;">
                            <strong>Time:</strong> ${timeDisplay}<br>
                            <strong>Buffer Type:</strong> Containment Line<br>
                            <strong>Buffer Radius:</strong> ${(bufferRadius/1000).toFixed(1)} km<br>
                            <strong>Fire Size:</strong> ${fire.acres} acres<br>
                            <strong>Fire Containment:</strong> ${fire.containment}%<br>
                            <strong>Status:</strong> ${this.getBufferStatus(fire.containment)}<br>
                            
                            <div style="background: #f3e5f5; padding: 6px; margin-top: 8px; border-radius: 4px;">
                                <strong>🚒 Purpose:</strong> This buffer zone moves with the fire to maintain safe containment boundaries for firefighting operations.
                            </div>
                        </div>
                    </div>
                `);
            } catch (error) {
                console.error(`Error creating moving buffer for fire ${index}:`, error);
            }
        });
    },

    // HELPER FUNCTIONS for the moving zones:
    findDesertHillsFire: function(perimeters) {
        // Find the Desert Hills Fire based on location (fires in the -116.4 to -116.3 longitude range)
        return perimeters.find(fire => 
            fire.center[1] > -116.45 && fire.center[1] < -116.25 &&
            fire.center[0] > 33.65 && fire.center[0] < 33.80
        );
    },

    calculateEvacuationZoneCenter: function(fireCenter, targetCenter) {
        // Position evacuation zone between fire and target community
        const midLat = (fireCenter[0] + targetCenter[0]) / 2;
        const midLng = (fireCenter[1] + targetCenter[1]) / 2;
        return [midLat, midLng];
    },

    getZoneMovementInfo: function(zone, currentHour) {
        if (zone.fireIndex !== undefined) {
            return `Following fire movement - zone repositions based on fire location at ${this.formatHour(currentHour)}`;
        } else if (zone.specialAlert) {
            return `Protective zone positioned between Desert Hills Fire and La Quinta community`;
        } else {
            return `Dynamic zone - adjusts to fire behavior and containment progress`;
        }
    },

    getFireDirection: function(currentHour) {
        // Desert Hills Fire generally moves southward toward La Quinta
        if (currentHour >= 8 && currentHour <= 16) {
            return 'Moving southeast toward La Quinta';
        } else if (currentHour >= 17 && currentHour <= 20) {
            return 'Fire advance slowing, being pushed back';
        } else {
            return 'Contained/controlled spread';
        }
    },

    getBufferColor: function(fireIntensity, containment) {
        if (containment >= 75) return '#4CAF50'; // Green for well-contained
        if (fireIntensity === 'extreme') return '#FF1744'; // Deep red
        if (fireIntensity === 'high') return '#FF5722'; // Red-orange
        if (fireIntensity === 'moderate') return '#FF9800'; // Orange
        return '#FFC107'; // Yellow for low intensity
    },

    getBufferStatus: function(containment) {
        if (containment >= 75) return 'Effective - fire well contained';
        if (containment >= 50) return 'Moderate - containment progressing';
        if (containment >= 25) return 'Challenging - active firefighting';
        return 'Critical - establishing containment';
    },

    getCommunityRiskCounts: function(currentHour) {
        const fireData = fireProgressionData.timeSteps[currentHour];
        if (!fireData) return { extreme: 0, high: 0, moderate: 0, low: 0 };

        const counts = { extreme: 0, high: 0, moderate: 0, low: 0 };

        this.populationCenters.forEach(community => {
            let highestRiskLevel = community.baseRisk;

            fireData.perimeters.forEach(fire => {
                const distance = this.calculateDistanceInKm(community.coords, fire.center);
                
                if (distance <= 10) {
                    const fireRisk = this.calculateFireThreatLevel(distance, fire.intensity, fire.containment);
                    if (this.getRiskPriority(fireRisk) > this.getRiskPriority(highestRiskLevel)) {
                        highestRiskLevel = fireRisk;
                    }
                }
            });

            counts[highestRiskLevel]++;
        });

        return counts;
    },

}; // <-- Properly close FireManager object here

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

// Complete the WeatherStationManager that was cut off:

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
                        <div style="font-size: 12px; line-height: 1.4;">
                            <strong>Temperature:</strong> ${station.temp}°F<br>
                            <strong>Humidity:</strong> ${station.humidity}%<br>
                            <strong>Wind Speed:</strong> ${station.windSpeed} mph<br>
                            <strong>Wind Direction:</strong> ${station.windDirection}<br>
                            
                            <div style="margin-top: 8px; padding: 6px; background: ${this.getFireRiskColor(station)}; border-radius: 4px;">
                                <strong>Fire Risk Level:</strong> ${this.calculateFireRisk(station)}
                            </div>
                            
                            <div style="margin-top: 8px; font-size: 11px; color: #666;">
                                Last Updated: ${new Date().toLocaleTimeString()}
                            </div>
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
    },

    updateWeatherConditions: function(currentHour) {
        console.log(`🌡️ Updating weather conditions for ${currentHour}:00`);
        
        // Clear and recreate weather stations with time-based conditions
        if (WildfireApp.layers && WildfireApp.layers.weatherStations) {
            WildfireApp.layers.weatherStations.clearLayers();
            
            const timeBasedStations = this.getTimeBasedWeatherData(currentHour);
            
            timeBasedStations.forEach(station => {
                try {
                    const riskLevel = this.calculateFireRisk(station);
                    const iconColor = this.getStationIconColor(riskLevel);
                    
                    const marker = L.marker(station.coordinates, {
                        icon: L.divIcon({
                            className: 'weather-station-icon',
                            html: `<div style="background: ${iconColor}; color: white; padding: 6px; border-radius: 50%; text-align: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); width: 32px; height: 32px; line-height: 20px;">🌡️</div>`,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        })
                    }).addTo(WildfireApp.layers.weatherStations);
                    
                    const timeDisplay = FireManager.formatHour(currentHour);
                    
                    marker.bindPopup(`
                        <div style="min-width: 220px;">
                            <h4 style="color: ${iconColor};">🌡️ ${station.name}</h4>
                            <div style="font-size: 12px; line-height: 1.4;">
                                <strong>Time:</strong> ${timeDisplay}<br>
                                <strong>Temperature:</strong> ${station.temp}°F<br>
                                <strong>Humidity:</strong> ${station.humidity}%<br>
                                <strong>Wind Speed:</strong> ${station.windSpeed} mph<br>
                                <strong>Wind Direction:</strong> ${station.windDirection}<br>
                                <strong>Pressure:</strong> ${station.pressure} mb<br>
                                
                                <div style="margin-top: 8px; padding: 6px; background: ${this.getFireRiskColor(station)}; border-radius: 4px;">
                                    <strong>Fire Risk Level:</strong> ${riskLevel}<br>
                                    <strong>Fire Weather Index:</strong> ${this.calculateFireWeatherIndex(station)}
                                </div>
                                
                                <div style="margin-top: 8px; padding: 6px; background: #f5f5f5; border-radius: 4px; font-size: 11px;">
                                    <strong>🌬️ Conditions:</strong> ${this.getWeatherDescription(station, currentHour)}
                                </div>
                            </div>
                        </div>
                    `);
                } catch (error) {
                    console.error(`Error updating weather station ${station.name}:`, error);
                }
            });
        }
    },

    getTimeBasedWeatherData: function(currentHour) {
        // Simulate realistic weather changes throughout the day
        const baseStations = [
            {
                name: 'Palm Springs Station',
                coordinates: [33.8303, -116.5453],
                baseTemp: 85,
                baseHumidity: 25,
                baseWindSpeed: 8,
                windDirection: 'SW',
                elevation: 479
            },
            {
                name: 'Desert Hot Springs Station',
                coordinates: [33.9614, -116.5019],
                baseTemp: 88,
                baseHumidity: 20,
                baseWindSpeed: 10,
                windDirection: 'W',
                elevation: 1050
            },
            {
                name: 'San Jacinto Station',
                coordinates: [33.7839, -116.9586],
                baseTemp: 80,
                baseHumidity: 30,
                baseWindSpeed: 12,
                windDirection: 'SW',
                elevation: 1551
            },
            {
                name: 'Hemet Station',
                coordinates: [33.7475, -116.9719],
                baseTemp: 82,
                baseHumidity: 28,
                baseWindSpeed: 8,
                windDirection: 'S',
                elevation: 1650
            }
        ];

        return baseStations.map(station => {
            // Calculate time-based adjustments
            let tempAdjustment = 0;
            let humidityAdjustment = 0;
            let windAdjustment = 0;

            // Temperature follows daily cycle
            if (currentHour >= 6 && currentHour <= 12) {
                // Morning warming
                tempAdjustment = (currentHour - 6) * 3; // +3°F per hour
                humidityAdjustment = (currentHour - 6) * -2; // -2% per hour
            } else if (currentHour >= 13 && currentHour <= 16) {
                // Peak heat
                tempAdjustment = 18 + (currentHour - 13) * 2; // Peak heat
                humidityAdjustment = -12 - (currentHour - 13) * 2; // Lowest humidity
                windAdjustment = (currentHour - 13) * 3; // Increasing wind
            } else if (currentHour >= 17 && currentHour <= 20) {
                // Cooling
                tempAdjustment = 24 - (currentHour - 17) * 4;
                humidityAdjustment = -18 + (currentHour - 17) * 3;
                windAdjustment = 9 - (currentHour - 17) * 2;
            } else {
                // Night
                tempAdjustment = currentHour <= 5 ? -8 : -5;
                humidityAdjustment = currentHour <= 5 ? 5 : 2;
                windAdjustment = -3;
            }

            return {
                name: station.name,
                coordinates: station.coordinates,
                temp: Math.round(station.baseTemp + tempAdjustment),
                humidity: Math.max(5, Math.min(50, station.baseHumidity + humidityAdjustment)),
                windSpeed: Math.max(2, station.baseWindSpeed + windAdjustment),
                windDirection: this.getWindDirection(currentHour, station.windDirection),
                pressure: 1013 + Math.random() * 10 - 5, // Simulate pressure variation
                elevation: station.elevation
            };
        });
    },

    getWindDirection: function(currentHour, baseDirection) {
        // Wind direction changes based on time (diurnal wind patterns)
        if (currentHour >= 12 && currentHour <= 18) {
            // Afternoon - stronger westerly flow
            const westernDirections = ['W', 'SW', 'NW'];
            return westernDirections[Math.floor(Math.random() * westernDirections.length)];
        } else if (currentHour >= 6 && currentHour < 12) {
            // Morning - lighter variable winds
            return baseDirection;
        } else {
            // Night - lighter winds, more variable
            const nightDirections = ['N', 'NE', 'E', 'SE'];
            return nightDirections[Math.floor(Math.random() * nightDirections.length)];
        }
    },

    calculateFireRisk: function(station) {
        // Calculate fire risk based on weather conditions
        const temp = station.temp;
        const humidity = station.humidity;
        const windSpeed = station.windSpeed;

        let riskScore = 0;

        // Temperature factor (higher = more risk)
        if (temp >= 100) riskScore += 4;
        else if (temp >= 95) riskScore += 3;
        else if (temp >= 85) riskScore += 2;
        else if (temp >= 75) riskScore += 1;

        // Humidity factor (lower = more risk)
        if (humidity <= 10) riskScore += 4;
        else if (humidity <= 15) riskScore += 3;
        else if (humidity <= 25) riskScore += 2;
        else if (humidity <= 35) riskScore += 1;

        // Wind factor (higher = more risk)
        if (windSpeed >= 20) riskScore += 3;
        else if (windSpeed >= 15) riskScore += 2;
        else if (windSpeed >= 10) riskScore += 1;

        // Determine risk level
        if (riskScore >= 8) return 'EXTREME';
        if (riskScore >= 6) return 'HIGH';
        if (riskScore >= 4) return 'MODERATE';
        if (riskScore >= 2) return 'LOW';
        return 'MINIMAL';
    },

    calculateFireWeatherIndex: function(station) {
        // Simple fire weather index calculation
        const fwi = Math.round(
            (station.temp * 0.3) + 
            ((100 - station.humidity) * 0.4) + 
            (station.windSpeed * 0.3)
        );
        return fwi;
    },

    getFireRiskColor: function(station) {
        const risk = this.calculateFireRisk(station);
        const colors = {
            'EXTREME': '#ffebee',
            'HIGH': '#fff3e0',
            'MODERATE': '#f3e5f5',
            'LOW': '#e8f5e8',
            'MINIMAL': '#e3f2fd'
        };
        return colors[risk] || colors['MINIMAL'];
    },

    getStationIconColor: function(riskLevel) {
        const colors = {
            'EXTREME': '#B71C1C',
            'HIGH': '#D32F2F',
            'MODERATE': '#FF9800',
            'LOW': '#4CAF50',
            'MINIMAL': '#00BCD4'
        };
        return colors[riskLevel] || colors['MINIMAL'];
    },

    getWeatherDescription: function(station, currentHour) {
        const risk = this.calculateFireRisk(station);
        
        if (risk === 'EXTREME') {
            return 'Extreme fire weather! Very hot, dry, and windy conditions.';
        } else if (risk === 'HIGH') {
            return 'High fire danger due to hot, dry conditions and strong winds.';
        } else if (risk === 'MODERATE') {
            return 'Moderate fire conditions. Monitor weather closely.';
        } else if (risk === 'LOW') {
            return 'Low fire risk. Conditions are relatively favorable.';
        } else {
            return 'Minimal fire weather concerns at this time.';
        }
    }
};

// Make sure FireManager is properly closed and add the missing parts
console.log('🔥 FireManager loaded successfully');

// Export for global use
if (typeof window !== 'undefined') {
    window.FireManager = FireManager;
    window.WeatherStationManager = WeatherStationManager;
}