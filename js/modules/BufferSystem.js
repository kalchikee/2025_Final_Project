// Buffer intersection system
const BufferSystem = {
    init: function() {
        console.log('BufferSystem initialized');
    },
    
    createBufferIntersections: function() {
        if (!WildfireApp || !WildfireApp.layers || !WildfireApp.layers.bufferIntersections) {
            console.warn('Buffer intersections layer not available');
            return 0;
        }
        
        console.log('🔄 Creating buffer intersections...');
        WildfireApp.layers.bufferIntersections.clearLayers();
        
        const bufferZones = [
            { 
                name: 'San Jacinto Fire Buffer', 
                center: [33.8144, -116.9428], 
                radius: 2000, 
                color: '#FF6B35',
                riskLevel: 'High'
            },
            { 
                name: 'Desert Hills Fire Buffer', 
                center: [33.7500, -116.4000], 
                radius: 2500, 
                color: '#FF8E53',
                riskLevel: 'Moderate'
            },
            { 
                name: 'Hemet Protection Buffer', 
                center: [33.7475, -116.9719], 
                radius: 1800, 
                color: '#FF9068',
                riskLevel: 'High'
            },
            {
                name: 'Palm Springs Safety Buffer',
                center: [33.8303, -116.5453],
                radius: 1500,
                color: '#FFB088',
                riskLevel: 'Moderate'
            }
        ];
        
        let successCount = 0;
        bufferZones.forEach(zone => {
            try {
                const circle = L.circle(zone.center, {
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.25,
                    weight: 3,
                    opacity: 0.8,
                    radius: zone.radius,
                    dashArray: '10,5' // Dashed border to distinguish from fire perimeters
                }).addTo(WildfireApp.layers.bufferIntersections);
                
                circle.bindPopup(`
                    <div style="min-width: 200px;">
                        <h4 style="color: ${zone.color};">⚠️ ${zone.name}</h4>
                        <div style="font-size: 12px;">
                            <strong>Buffer Radius:</strong> ${(zone.radius/1000).toFixed(1)} km<br>
                            <strong>Purpose:</strong> Fire containment zone<br>
                            <strong>Status:</strong> Active monitoring<br>
                            <strong>Risk Level:</strong> ${zone.riskLevel}<br>
                            <strong>Area:</strong> ${Math.round((Math.PI * zone.radius * zone.radius) / 1000000)} km²
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
    },
    
    updateBuffers: function(currentTime) {
        // Update buffer zones based on current conditions
        console.log('Updating buffer intersections for time:', currentTime);
        return this.createBufferIntersections();
    }
};

// Debug functions for testing
function debugBufferSystem() {
    console.log('=== BUFFER SYSTEM DEBUG ===');
    console.log('1. BufferSystem exists:', typeof BufferSystem !== 'undefined');
    
    if (BufferSystem) {
        console.log('2. BufferSystem methods:', Object.keys(BufferSystem));
        console.log('3. createBufferIntersections exists:', typeof BufferSystem.createBufferIntersections === 'function');
    }
    
    if (WildfireApp && WildfireApp.layers) {
        console.log('4. bufferIntersections layer exists:', !!WildfireApp.layers.bufferIntersections);
        if (WildfireApp.layers.bufferIntersections) {
            console.log('5. Current buffer count:', WildfireApp.layers.bufferIntersections.getLayers().length);
        }
    }
    
    console.log('6. Buffer checkbox checked:', $('#buffer-intersections').is(':checked'));
    console.log('===============================');
}

function forceCreateBuffers() {
    console.log('🔧 FORCE CREATING BUFFER INTERSECTIONS');
    
    if (!BufferSystem) {
        console.error('❌ BufferSystem not available');
        return;
    }
    
    try {
        const result = BufferSystem.createBufferIntersections();
        console.log('✅ Force creation result:', result);
        
        if (WildfireApp && WildfireApp.map && WildfireApp.layers.bufferIntersections) {
            if (!WildfireApp.map.hasLayer(WildfireApp.layers.bufferIntersections)) {
                WildfireApp.layers.bufferIntersections.addTo(WildfireApp.map);
                console.log('✅ Added to map');
            }
            
            $('#buffer-intersections').prop('checked', true);
            console.log('✅ Checkbox checked');
            console.log('Final count:', WildfireApp.layers.bufferIntersections.getLayers().length);
        }
    } catch (error) {
        console.error('❌ Force creation failed:', error);
    }
}

// Make functions available globally
window.debugBufferSystem = debugBufferSystem;
window.forceCreateBuffers = forceCreateBuffers;