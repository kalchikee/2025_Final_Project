const WeatherManager = {
    init: function() {
        console.log('WeatherManager initialized');
    },
    
    createWeatherStations: function(currentTime) {
        const timeToUse = currentTime || (WildfireApp && WildfireApp.currentTime) || 12;
        
        if (!WildfireApp || !WildfireApp.layers || !WildfireApp.layers.weatherStations) {
            console.warn('Weather stations layer not available');
            return 0;
        }
        
        console.log('🌡️ Creating weather stations for time:', timeToUse);
        WildfireApp.layers.weatherStations.clearLayers();
        
        const stations = [
            { name: 'Palm Springs Station', coordinates: [33.8303, -116.5453], baseTemp: 85, baseHumidity: 25 },
            { name: 'Desert Hot Springs Station', coordinates: [33.9614, -116.5019], baseTemp: 88, baseHumidity: 22 },
            { name: 'San Jacinto Station', coordinates: [33.7839, -116.9586], baseTemp: 82, baseHumidity: 28 },
            { name: 'Hemet Station', coordinates: [33.7475, -116.9719], baseTemp: 79, baseHumidity: 32 }
        ];
        
        let successCount = 0;
        stations.forEach(station => {
            try {
                const timeMultiplier = this.getTimeMultiplier(timeToUse);
                const temp = Math.round(station.baseTemp + (timeMultiplier * 15));
                const humidity = Math.max(10, Math.round(station.baseHumidity - (timeMultiplier * 15)));
                const windSpeed = Math.round(5 + (timeMultiplier * 15));
                const windDirection = this.getWindDirection(timeToUse);
                
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
                            <strong>Temperature:</strong> ${temp}°F<br>
                            <strong>Humidity:</strong> ${humidity}%<br>
                            <strong>Wind:</strong> ${windSpeed} mph ${windDirection}<br>
                            <strong>Fire Risk:</strong> ${humidity < 20 ? 'High' : humidity < 30 ? 'Moderate' : 'Low'}<br>
                            <strong>Time:</strong> ${this.formatTime(timeToUse)}
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
    
    getTimeMultiplier: function(hour) {
        if (hour < 8) return -0.3; // Cool morning
        if (hour < 12) return 0; // Mild late morning  
        if (hour < 16) return 0.7; // Hot afternoon
        return 0.2; // Cooling evening
    },
    
    getWindDirection: function(hour) {
        if (hour < 10) return 'E';
        if (hour < 14) return 'SW'; 
        if (hour < 18) return 'W';
        return 'NW';
    },
    
    formatTime: function(hour) {
        if (hour === 0) return "12:00 AM";
        if (hour === 12) return "12:00 PM";
        if (hour < 12) return hour + ":00 AM";
        return (hour - 12) + ":00 PM";
    },
    
    updateWeatherStations: function() {
        console.log('Updating weather station data...');
        const currentTime = (WildfireApp && WildfireApp.currentTime) || 12;
        return this.createWeatherStations(currentTime);
    }
};

// Debug functions for console testing
function debugWeatherStations() {
    console.log('=== COMPREHENSIVE WEATHER STATIONS DEBUG ===');
    console.log('1. WeatherManager exists:', typeof WeatherManager !== 'undefined');
    
    if (WeatherManager) {
        console.log('2. WeatherManager methods:', Object.keys(WeatherManager));
        console.log('3. createWeatherStations exists:', typeof WeatherManager.createWeatherStations === 'function');
        console.log('4. updateWeatherStations exists:', typeof WeatherManager.updateWeatherStations === 'function');
    }
    
    console.log('5. WildfireApp exists:', typeof WildfireApp !== 'undefined');
    if (WildfireApp) {
        console.log('6. WildfireApp.currentTime:', WildfireApp.currentTime);
        console.log('7. WildfireApp.layers exists:', !!WildfireApp.layers);
        
        if (WildfireApp.layers) {
            console.log('8. weatherStations layer exists:', !!WildfireApp.layers.weatherStations);
            if (WildfireApp.layers.weatherStations) {
                console.log('9. Current weather stations count:', WildfireApp.layers.weatherStations.getLayers().length);
            }
        }
        
        console.log('10. WildfireApp.map exists:', !!WildfireApp.map);
    }
    
    console.log('11. Weather stations checkbox checked:', $('#weather-stations').is(':checked'));
    console.log('================================================');
}

function forceCreateWeatherStations() {
    console.log('🔧 FORCE CREATING WEATHER STATIONS');
    
    if (!WeatherManager) {
        console.error('❌ WeatherManager not available');
        return;
    }
    
    try {
        const currentTime = (WildfireApp && WildfireApp.currentTime) || 12;
        console.log('Using time:', currentTime);
        
        const result = WeatherManager.createWeatherStations(currentTime);
        console.log('✅ Force creation result:', result);
        
        if (WildfireApp && WildfireApp.map && WildfireApp.layers.weatherStations) {
            if (!WildfireApp.map.hasLayer(WildfireApp.layers.weatherStations)) {
                WildfireApp.layers.weatherStations.addTo(WildfireApp.map);
                console.log('✅ Added to map');
            }
            
            $('#weather-stations').prop('checked', true);
            console.log('✅ Checkbox checked');
            console.log('Final count:', WildfireApp.layers.weatherStations.getLayers().length);
        }
    } catch (error) {
        console.error('❌ Force creation failed:', error);
    }
}

// Make functions available globally
window.debugWeatherStations = debugWeatherStations;
window.forceCreateWeatherStations = forceCreateWeatherStations;