// Evacuation planning and management
const EvacuationManager = {
    analyzeEvacuationNeeds: function() {
        console.log('Analyzing evacuation needs...');
        
        // Check if FireManager is available
        if (typeof FireManager === 'undefined') {
            console.warn('FireManager not available, creating basic evacuation analysis');
            this.createBasicEvacuationAnalysis();
            return;
        }
        
        if (!WildfireApp.map || !WildfireApp.layers) {
            console.error('Map or layers not available for evacuation analysis');
            return;
        }
        
        // Clear previous zones
        WildfireApp.currentEvacuationZones = [];
        
        // Use the detailed evacuation zones method
        this.createDetailedEvacuationZones();
    },
    
    createEvacuationZoneMarker: function(center, status, distance) {
        // Add all necessary null checks
        if (!WildfireApp || !WildfireApp.map || !WildfireApp.layers || !WildfireApp.layers.evacuationZones) {
            console.error('Required objects not available for marker creation');
            return;
        }
        
        if (!center || !center.coordinates) {
            console.error('Invalid center data for marker creation');
            return;
        }
        
        const colors = {
            immediate: '#d32f2f',
            warning: '#ff9800',
            advisory: '#ffc107'
        };
        
        const icons = {
            immediate: '🚨',
            warning: '⚠️',
            advisory: '📢'
        };
        
        try {
            const marker = L.marker(center.coordinates, {
                icon: L.divIcon({
                    className: `evacuation-zone-marker evacuation-${status}`,
                    html: `<div style="background: ${colors[status]}; color: white; padding: 5px; border-radius: 50%; text-align: center; font-size: 14px;">${icons[status]}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            });
            
            marker.bindPopup(this.createEvacuationPopup(center, status, distance));
            
            // Safely add to layer
            marker.addTo(WildfireApp.layers.evacuationZones);
            
        } catch (error) {
            console.error('Error creating evacuation marker:', error);
        }
    },
    
    createEvacuationPopup: function(center, status, distance) {
        const statusLabels = {
            immediate: 'IMMEDIATE EVACUATION',
            warning: 'EVACUATION WARNING',
            advisory: 'EVACUATION ADVISORY'
        };
        
        const statusColors = {
            immediate: '#d32f2f',
            warning: '#ff9800',
            advisory: '#ffc107'
        };
        
        return `
            <div class="evacuation-popup" style="min-width: 200px;">
                <div style="background: ${statusColors[status]}; color: white; padding: 8px; margin: -10px -10px 10px -10px; text-align: center; font-weight: bold;">
                    ${statusLabels[status]}
                </div>
                <div style="padding: 5px;">
                    <strong>Location:</strong> ${center.name || 'Unknown'}<br>
                    <strong>Population:</strong> ${center.population ? center.population.toLocaleString() : 'Unknown'}<br>
                    <strong>Distance to Fire:</strong> ${distance.toFixed(1)} miles<br>
                    <strong>Estimated Evacuation Time:</strong> ${this.calculateEvacuationTime(center, status)}
                    <div style="margin-top: 10px;">
                        <button onclick="EvacuationManager.initiateEvacuation('${center.id}', '${status}')" 
                                style="background: ${statusColors[status]}; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                            Issue ${statusLabels[status]}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    calculateEvacuationTime: function(center, bufferType) {
        if (!center || typeof center.population === 'undefined') {
            return '30 minutes'; // Default fallback
        }
        
        let baseTime = 30; // Base 30 minutes
        
        if (center.population > 5000) baseTime += 20;
        else if (center.population > 1000) baseTime += 10;
        
        if (bufferType === 'immediate') baseTime *= 0.5;
        else if (bufferType === 'warning') baseTime *= 0.8;
        
        if (center.vulnerabilityScore && center.vulnerabilityScore >= 4) baseTime *= 1.5;
        
        return Math.round(baseTime) + ' minutes';
    },
    
    initiateEvacuation: function(centerId, alertLevel) {
        try {
            if (typeof WildfireApp === 'undefined') {
                console.error('WildfireApp not available for evacuation');
                return;
            }
            
            if (!WildfireApp.populationCenters || WildfireApp.populationCenters.length === 0) {
                console.error('Population centers not available');
                return;
            }
            
            const center = WildfireApp.populationCenters.find(c => c.id == centerId);
            if (!center) {
                console.error('Population center not found:', centerId);
                return;
            }
            
            const alertMessages = {
                immediate: `🚨 IMMEDIATE EVACUATION ORDER ISSUED for ${center.name}\n\n${center.population ? center.population.toLocaleString() : 'Unknown number of'} residents must evacuate NOW!`,
                warning: `⚠️ EVACUATION WARNING ISSUED for ${center.name}\n\n${center.population ? center.population.toLocaleString() : 'Unknown number of'} residents should prepare to evacuate.`,
                advisory: `📢 EVACUATION ADVISORY ISSUED for ${center.name}\n\n${center.population ? center.population.toLocaleString() : 'Unknown number of'} residents advised to consider evacuation.`
            };
            
            alert(alertMessages[alertLevel] || 'Evacuation notice issued.');
            
            if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative(`EVACUATION ACTION: ${alertLevel.toUpperCase()} evacuation issued for ${center.name}`);
            }
        } catch (error) {
            console.error('Error initiating evacuation:', error);
        }
    },
    
    updateEvacuationNarrative: function() {
        try {
            if (typeof WildfireApp === 'undefined' || !WildfireApp.currentEvacuationZones) {
                return;
            }
            
            const immediateZones = WildfireApp.currentEvacuationZones.filter(zone => zone.status === 'immediate');
            const warningZones = WildfireApp.currentEvacuationZones.filter(zone => zone.status === 'warning');
            const advisoryZones = WildfireApp.currentEvacuationZones.filter(zone => zone.status === 'advisory');
            
            let message = '';
            if (immediateZones.length > 0) {
                message += `🚨 ${immediateZones.length} areas require IMMEDIATE evacuation. `;
            }
            if (warningZones.length > 0) {
                message += `⚠️ ${warningZones.length} areas under evacuation WARNING. `;
            }
            if (advisoryZones.length > 0) {
                message += `📢 ${advisoryZones.length} areas under evacuation ADVISORY.`;
            }
            
            if (message && typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative(message.trim());
            } else if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative('No evacuation zones currently active.');
            }
        } catch (error) {
            console.error('Error updating evacuation narrative:', error);
        }
    },
    
    // Safe layer visibility check without using hasLayer
    isLayerVisible: function(layerName) {
        try {
            if (!WildfireApp || !WildfireApp.map || !WildfireApp.layers) {
                return false;
            }
            
            const layer = WildfireApp.layers[layerName];
            if (!layer) {
                return false;
            }
            
            // Instead of hasLayer, check if layer has been added to map by checking its _map property
            return layer._map !== null && layer._map !== undefined;
            
        } catch (error) {
            console.error('Error checking layer visibility:', error);
            return false;
        }
    },
    
    // Safe method to add/remove layers without hasLayer
    toggleLayer: function(layerName, show) {
        try {
            if (!WildfireApp || !WildfireApp.map || !WildfireApp.layers) {
                console.error('Required objects not available for layer toggle');
                return;
            }
            
            const layer = WildfireApp.layers[layerName];
            if (!layer) {
                console.error('Layer not found:', layerName);
                return;
            }
            
            if (show) {
                // Only add if not already added (check _map property)
                if (!layer._map) {
                    layer.addTo(WildfireApp.map);
                    console.log('Layer added:', layerName);
                }
            } else {
                // Only remove if currently added
                if (layer._map) {
                    WildfireApp.map.removeLayer(layer);
                    console.log('Layer removed:', layerName);
                }
            }
            
        } catch (error) {
            console.error('Error toggling layer:', layerName, error);
        }
    },
    
    // Add this to your browser console to debug:
    debugEvacuationManager: function() {
        console.log('WildfireApp layers:', WildfireApp.layers);
        console.log('Map has fire perimeters layer:', WildfireApp.map.hasLayer(WildfireApp.layers.firePerimeters));
        console.log('Active fire perimeters:', WildfireApp.activeFirePerimeters);
        console.log('Population centers:', WildfireApp.populationCenters);
    },
    
    // Add this method to create more detailed evacuation zones
    createDetailedEvacuationZones: function() {
        if (!WildfireApp.layers || !WildfireApp.layers.evacuationZones) {
            console.error('Evacuation zones layer not available');
            return;
        }
        
        WildfireApp.layers.evacuationZones.clearLayers();
        
        if (!WildfireApp.activeFirePerimeters || WildfireApp.activeFirePerimeters.length === 0) {
            console.log('No active fire perimeters for evacuation analysis');
            return;
        }
        
        let evacuationZoneCount = 0;
        
        WildfireApp.activeFirePerimeters.forEach(fire => {
            if (!fire.currentCenter) return;
            
            const fireLatLng = L.latLng(fire.currentCenter);
            
            // Create buffer zones around each fire
            const bufferZones = [
                { distance: WildfireApp.evacuationBuffers.immediate, color: '#d32f2f', status: 'immediate', priority: 3 },
                { distance: WildfireApp.evacuationBuffers.warning, color: '#ff9800', status: 'warning', priority: 2 },
                { distance: WildfireApp.evacuationBuffers.advisory, color: '#ffc107', status: 'advisory', priority: 1 }
            ];
            
            bufferZones.forEach(zone => {
                const totalRadius = (fire.currentRadius + zone.distance) * 1609.34; // Convert miles to meters
                
                const evacuationCircle = L.circle(fire.currentCenter, {
                    radius: totalRadius,
                    fillColor: zone.color,
                    color: zone.color,
                    weight: 2,
                    opacity: 0.6,
                    fillOpacity: 0.2,
                    dashArray: zone.status === 'advisory' ? '5, 10' : null
                }).addTo(WildfireApp.layers.evacuationZones);
                
                evacuationCircle.bindPopup(`
                    <div style="text-align: center;">
                        <h4 style="color: ${zone.color}; margin-bottom: 8px;">
                            ${zone.status.toUpperCase()} EVACUATION ZONE
                        </h4>
                        <div style="font-size: 12px;">
                            <strong>Fire:</strong> ${fire.name}<br>
                            <strong>Radius:</strong> ${(fire.currentRadius + zone.distance).toFixed(1)} miles<br>
                            <strong>Priority:</strong> ${zone.priority}/3<br>
                            <strong>Status:</strong> ${zone.status}
                        </div>
                    </div>
                `);
                
                evacuationZoneCount++;
            });
            
            // Check which population centers fall within evacuation zones
            WildfireApp.populationCenters.forEach(center => {
                if (!center.coordinates) return;
                
                const centerLatLng = L.latLng(center.coordinates);
                const distanceToFire = fireLatLng.distanceTo(centerLatLng) / 1609.34; // Convert to miles
                
                let evacuationStatus = 'safe';
                let evacuationPriority = 0;
                let zoneColor = '#4caf50';
                
                if (distanceToFire <= fire.currentRadius + WildfireApp.evacuationBuffers.immediate) {
                    evacuationStatus = 'immediate';
                    evacuationPriority = 3;
                    zoneColor = '#d32f2f';
                } else if (distanceToFire <= fire.currentRadius + WildfireApp.evacuationBuffers.warning) {
                    evacuationStatus = 'warning';
                    evacuationPriority = 2;
                    zoneColor = '#ff9800';
                } else if (distanceToFire <= fire.currentRadius + WildfireApp.evacuationBuffers.advisory) {
                    evacuationStatus = 'advisory';
                    evacuationPriority = 1;
                    zoneColor = '#ffc107';
                }
                
                if (evacuationStatus !== 'safe') {
                    // Create specific evacuation marker for this population center
                    const evacuationMarker = L.marker(center.coordinates, {
                        icon: L.divIcon({
                            className: `evacuation-center-marker evacuation-${evacuationStatus}`,
                            html: `<div style="background: ${zoneColor}; color: white; padding: 8px; border-radius: 50%; text-align: center; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">🚨</div>`,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        })
                    }).addTo(WildfireApp.layers.evacuationZones);
                    
                    evacuationMarker.bindPopup(this.createDetailedEvacuationPopup(center, fire, evacuationStatus, distanceToFire));
                    
                    // Add to current evacuation zones
                    WildfireApp.currentEvacuationZones.push({
                        center: center,
                        fire: fire,
                        status: evacuationStatus,
                        priority: evacuationPriority,
                        distance: distanceToFire.toFixed(1),
                        estimatedTime: this.calculateEvacuationTime(center, evacuationStatus),
                        marker: evacuationMarker
                    });
                }
            });
        });
        
        console.log(`Created ${evacuationZoneCount} evacuation buffer zones`);
        console.log(`${WildfireApp.currentEvacuationZones.length} population centers require evacuation`);
        
        // Sort by priority and update narrative
        WildfireApp.currentEvacuationZones.sort((a, b) => b.priority - a.priority);
        this.updateDetailedEvacuationNarrative();
    },
    
    createDetailedEvacuationPopup: function(zone) {
        // Add safety checks for undefined properties
        const facilities = zone.facilities || [];
        const routes = zone.routes || [];
        const capacity = zone.capacity || 'Unknown';
        const estimatedTime = zone.estimatedTime || 'Unknown';
        const priority = zone.priority || 'Normal';
        
        return `
            <div style="min-width: 280px; max-height: 400px; overflow-y: auto;">
                <h4 style="color: #d32f2f; margin-bottom: 8px;">⚠️ ${zone.name}</h4>
                <div style="font-size: 12px; line-height: 1.4; margin-bottom: 10px;">
                    <strong>Priority Level:</strong> <span style="color: ${this.getPriorityColor(priority)}; font-weight: bold;">${priority}</span><br>
                    <strong>Affected Population:</strong> ${capacity.toLocaleString ? capacity.toLocaleString() : capacity}<br>
                    <strong>Est. Evacuation Time:</strong> ${estimatedTime} minutes<br>
                    <strong>Zone Radius:</strong> ${zone.radius ? (zone.radius/1000).toFixed(1) : 'N/A'} km
                </div>
                
                ${facilities.length > 0 ? `
                <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-bottom: 8px;">
                    <strong>Available Facilities:</strong><br>
                    <div style="font-size: 11px; color: #666;">
                        ${facilities.join(', ')}
                    </div>
                </div>
                ` : ''}
                
                ${routes.length > 0 ? `
                <div style="border-top: 1px solid #ddd; padding-top: 8px; margin-bottom: 8px;">
                    <strong>Evacuation Routes:</strong><br>
                    <div style="font-size: 11px; color: #666; max-height: 80px; overflow-y: auto;">
                        ${routes.join('<br>')}
                    </div>
                </div>
                ` : ''}
                
                <div style="margin-top: 10px; text-align: center;">
                    <button onclick="this.planEvacuationRoute && this.planEvacuationRoute('${zone.id || zone.name}')" 
                            style="background: #2196F3; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-right: 5px;">
                        Plan Route
                    </button>
                    <button onclick="this.showEvacuationDetails && this.showEvacuationDetails('${zone.id || zone.name}')" 
                            style="background: #4CAF50; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; font-size: 11px;">
                        More Info
                    </button>
                </div>
            </div>
        `;
    },
    
    getPriorityColor: function(priority) {
        const colors = {
            'Critical': '#d32f2f',
            'High': '#ff5722', 
            'Normal': '#ff9800',
            'Low': '#4caf50'
        };
        return colors[priority] || '#666';
    },
    
    updateDetailedEvacuationNarrative: function() {
        if (!WildfireApp.currentEvacuationZones || WildfireApp.currentEvacuationZones.length === 0) {
            if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative('✅ No evacuation zones currently active. All population centers are at safe distances from active fires.');
            }
            return;
        }
        
        const immediate = WildfireApp.currentEvacuationZones.filter(zone => zone.status === 'immediate');
        const warning = WildfireApp.currentEvacuationZones.filter(zone => zone.status === 'warning');
        const advisory = WildfireApp.currentEvacuationZones.filter(zone => zone.status === 'advisory');
        
        let totalPopulation = WildfireApp.currentEvacuationZones.reduce((sum, zone) => sum + zone.center.population, 0);
        
        let message = `🚨 EVACUATION STATUS: ${WildfireApp.currentEvacuationZones.length} communities affected (${totalPopulation.toLocaleString()} residents). `;
        
        if (immediate.length > 0) {
            const immediatePopulation = immediate.reduce((sum, zone) => sum + zone.center.population, 0);
            message += `🔴 ${immediate.length} IMMEDIATE (${immediatePopulation.toLocaleString()} people). `;
        }
        
        if (warning.length > 0) {
            const warningPopulation = warning.reduce((sum, zone) => sum + zone.center.population, 0);
            message += `🟠 ${warning.length} WARNING (${warningPopulation.toLocaleString()} people). `;
        }
        
        if (advisory.length > 0) {
            const advisoryPopulation = advisory.reduce((sum, zone) => sum + zone.center.population, 0);
            message += `🟡 ${advisory.length} ADVISORY (${advisoryPopulation.toLocaleString()} people).`;
        }
        
        if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
            NarrativeManager.updateNarrative(message);
        }
    },
    
    // Add a fallback method for when FireManager isn't available:
    createBasicEvacuationAnalysis: function() {
        console.log('Creating basic evacuation analysis without FireManager');
        
        if (!WildfireApp.layers || !WildfireApp.layers.evacuationZones) {
            console.error('Evacuation zones layer not available');
            return;
        }
        
        // Clear existing evacuation zones
        WildfireApp.layers.evacuationZones.clearLayers();
        
        // Create basic evacuation zones around population centers
        if (WildfireApp.populationCenters && WildfireApp.populationCenters.length > 0) {
            WildfireApp.populationCenters.forEach(center => {
                if (center.riskLevel === 'High' || center.riskLevel === 'Extreme') {
                    // Create evacuation buffer around high-risk communities
                    const radius = center.riskLevel === 'Extreme' ? 3000 : 2000; // meters
                    
                    const evacuationZone = L.circle(center.coordinates, {
                        color: '#FF6B35',
                        fillColor: '#FF6B35',
                        fillOpacity: 0.2,
                        weight: 2,
                        radius: radius
                    }).addTo(WildfireApp.layers.evacuationZones);
                    
                    evacuationZone.bindPopup(`
                        <div style="min-width: 200px;">
                            <h4 style="color: #FF6B35;">⚠️ Evacuation Zone</h4>
                            <div style="font-size: 12px;">
                                <strong>Community:</strong> ${center.name}<br>
                                <strong>Risk Level:</strong> ${center.riskLevel}<br>
                                <strong>Population:</strong> ${center.population.toLocaleString()}<br>
                                <strong>Buffer Radius:</strong> ${(radius/1000).toFixed(1)} km
                            </div>
                        </div>
                    `);
                }
            });
        }
        
        // Update narrative
        if (typeof NarrativeManager !== 'undefined') {
            NarrativeManager.updateNarrative('⚠️ Basic evacuation zones created for high-risk communities.');
        }
        
        console.log('Basic evacuation analysis complete');
    }
};

// Force layer visibility
Object.keys(WildfireApp.layers).forEach(layerName => {
    if (!WildfireApp.map.hasLayer(WildfireApp.layers[layerName])) {
        WildfireApp.map.addLayer(WildfireApp.layers[layerName]);
        console.log(`Added layer: ${layerName}`);
    }
});

// Force fire perimeter creation
FireManager.createFirePerimeters();