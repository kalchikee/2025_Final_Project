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

    createCommunityMarker: function(community, riskLevel, nearestFire, currentHour) {
        if (
            community.coords &&
            Array.isArray(community.coords) &&
            community.coords.length === 2 &&
            typeof community.coords[0] === 'number' &&
            typeof community.coords[1] === 'number'
        ) {
            const riskColors = {
                'extreme': '#8B0000',
                'high': '#DC143C',
                'moderate': '#FF8C00',
                'low': '#32CD32'
            };
            const color = riskColors[riskLevel.toLowerCase()] || '#424242';

            // Icon HTML with name label underneath
            const iconHtml = `
                <div style="
                    background:${color};
                    color:white;
                    padding:8px;
                    border-radius:50%;
                    text-align:center;
                    font-size:16px;
                    width:36px;
                    height:36px;
                    border:2px solid white;
                    position:relative;
                ">
                    🏘️
                    <div style="
                        position:absolute;
                        top:38px;
                        left:50%;
                        transform:translateX(-50%);
                        background:rgba(0,0,0,0.7);
                        color:#fff;
                        padding:2px 6px;
                        border-radius:6px;
                        font-size:12px;
                        font-weight:normal;
                        white-space:nowrap;
                        z-index:1001;
                    ">${community.name}</div>
                </div>
            `;

            const marker = L.marker(community.coords, {
                icon: L.divIcon({
                    className: 'population-center-icon',
                    html: iconHtml,
                    iconSize: [36, 52], // extra height for label
                    iconAnchor: [18, 18]
                })
            }).addTo(WildfireApp.layers.populationCenters);

            let popupHtml = `<strong>${community.name}</strong><br>`;
            popupHtml += `<strong>Risk Level:</strong> ${riskLevel}<br>`;
            if (nearestFire) {
                popupHtml += `<strong>Nearest Fire:</strong> ${nearestFire.name}<br>`;
                popupHtml += `<strong>Distance:</strong> ${nearestFire.distance.toFixed(1)} km<br>`;
                popupHtml += `<strong>Fire Intensity:</strong> ${nearestFire.intensity}<br>`;
                popupHtml += `<strong>Containment:</strong> ${nearestFire.containment}%<br>`;
            }
            popupHtml += `<strong>Time:</strong> ${this.formatHour(currentHour)}`;

            marker.bindPopup(popupHtml);
        }
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

    formatHour: function(hour) {
        // Converts 6, 7, ... 23 to "06:00", "07:00", ... "23:00"
        let h = hour % 24;
        let suffix = h < 12 ? 'AM' : 'PM';
        let displayHour = h % 12 === 0 ? 12 : h % 12;
        return `${displayHour.toString().padStart(2, '0')}:00 ${suffix}`;
    },

    getThreatLevel: function(intensity, containment) {
        // Simple logic: higher intensity and lower containment = higher threat
        if (intensity === 'extreme') return 'Extreme';
        if (intensity === 'high' && containment < 50) return 'High';
        if (intensity === 'moderate' && containment < 50) return 'Moderate';
        if (containment >= 75) return 'Low';
        return 'Moderate';
    },

    calculateDistanceInKm: function(coords1, coords2) {
        // Haversine formula for distance between two [lat, lng] points in kilometers
        const toRadians = deg => deg * Math.PI / 180;
        const lat1 = coords1[0], lon1 = coords1[1];
        const lat2 = coords2[0], lon2 = coords2[1];
        const R = 6371; // Earth radius in km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    calculateFireThreatLevel: function(distance, intensity, containment) {
        // Example logic: closer distance and higher intensity = higher threat
        if (distance < 3 && intensity === 'extreme') return 'Extreme';
        if (distance < 7 && intensity === 'high') return 'High';
        if (distance < 10 && intensity === 'moderate') return 'Moderate';
        if (containment >= 75) return 'Low';
        return 'Moderate';
    },

    getRiskPriority: function(riskLevel) {
        // Assign numeric priority to risk levels for comparison
        switch (riskLevel.toLowerCase()) {
            case 'extreme': return 4;
            case 'high': return 3;
            case 'moderate': return 2;
            case 'low': return 1;
            default: return 0;
        }
    },

    updateDynamicEvacuationZones: function(currentHour) {
        // Example logic: update evacuation zones based on current fire perimeters
        if (!WildfireApp.layers || !WildfireApp.layers.evacuationZones) {
            console.warn('Evacuation zones layer not available');
            return;
        }

        // Clear existing evacuation zones
        WildfireApp.layers.evacuationZones.clearLayers();

        // Get fire data for current time
        const fireData = fireProgressionData.timeSteps[currentHour];
        if (!fireData) {
            console.log(`No fire data for evacuation zone updates at hour ${currentHour}`);
            return;
        }

        fireData.perimeters.forEach(fire => {
            const evacuationRadius = this.calculateEvacuationRadius(fire);
            const evacuationZone = L.circle(fire.center, {
                color: '#1976D2',
                fillColor: '#64B5F6',
                fillOpacity: 0.2,
                weight: 2,
                radius: evacuationRadius
            }).addTo(WildfireApp.layers.evacuationZones);

            evacuationZone.bindPopup(`
                <div style="min-width: 180px;">
                    <h4 style="color: #1976D2;">🚨 Evacuation Zone</h4>
                    <div style="font-size: 12px;">
                        <strong>Radius:</strong> ${(evacuationRadius / 1000).toFixed(1)} km<br>
                        <strong>Fire Intensity:</strong> ${fire.intensity}<br>
                        <strong>Containment:</strong> ${fire.containment}%<br>
                    </div>
                </div>
            `);
        });

        console.log(`✅ Evacuation zones updated for hour ${currentHour}`);
    },
}