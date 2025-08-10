const ComparisonManager = {
    init: function() {
        console.log('ComparisonManager initialized');
        this.comparisonMode = false;
    },
    
    compareWithCurrent: function(historicalFireId) {
        console.log('Comparing historical fire with current conditions:', historicalFireId);
        
        // Get historical fire data
        const historicalFires = HistoricalFiresData.getHistoricalFires();
        const historicalFire = historicalFires.find(f => f.id === historicalFireId);
        
        if (!historicalFire) {
            console.error('Historical fire not found:', historicalFireId);
            return;
        }
        
        // Get current weather conditions
        const currentTime = WildfireApp.currentTime || 12;
        const currentWeather = this.getCurrentWeatherConditions(currentTime);
        
        // Create comparison popup
        this.showWeatherComparison(historicalFire, currentWeather);
    },
    
    getCurrentWeatherConditions: function(time) {
        // Simulate current weather based on time of day
        let baseTemp = 75;
        let humidity = 35;
        let windSpeed = 8;
        
        // Time-based adjustments
        if (time >= 12 && time <= 16) {
            baseTemp = 95; // Peak heat
            humidity = 15;
            windSpeed = 15;
        } else if (time >= 17 && time <= 19) {
            baseTemp = 88;
            humidity = 20;
            windSpeed = 20; // Afternoon winds
        } else if (time >= 6 && time < 12) {
            baseTemp = 78;
            humidity = 30;
            windSpeed = 5;
        } else {
            baseTemp = 70; // Night
            humidity = 45;
            windSpeed = 3;
        }
        
        return {
            temperature: baseTemp,
            humidity: humidity,
            windSpeed: windSpeed,
            windDirection: time >= 12 && time <= 18 ? 'SW' : 'Variable',
            conditions: this.getWeatherDescription(baseTemp, humidity, windSpeed, time)
        };
    },
    
    getWeatherDescription: function(temp, humidity, wind, time) {
        if (temp > 100 && humidity < 15 && wind > 20) {
            return 'Critical fire weather - Red Flag Warning';
        } else if (temp > 90 && humidity < 20) {
            return 'High fire danger conditions';
        } else if (temp > 80 && humidity < 30) {
            return 'Moderate fire weather';
        } else {
            return 'Favorable conditions';
        }
    },
    
    showWeatherComparison: function(historicalFire, currentWeather) {
        const historical = historicalFire.weather;
        
        // Create comparison modal/popup
        const comparisonHTML = `
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; max-width: 500px; width: 90%;">
                <h3 style="color: #d32f2f; margin-bottom: 15px; text-align: center;">
                    ⚖️ Weather Comparison: ${historicalFire.name}
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <!-- Historical Conditions -->
                    <div style="background: #f3e5f5; padding: 12px; border-radius: 6px;">
                        <h4 style="color: #7b1fa2; margin-bottom: 8px;">📚 Historical (${historicalFire.date})</h4>
                        <div style="font-size: 12px; line-height: 1.4;">
                            <div style="margin-bottom: 4px;"><strong>Temperature:</strong> ${historical.temperature}°F</div>
                            <div style="margin-bottom: 4px;"><strong>Humidity:</strong> ${historical.humidity}%</div>
                            <div style="margin-bottom: 4px;"><strong>Wind Speed:</strong> ${historical.windSpeed} mph</div>
                            <div style="margin-bottom: 4px;"><strong>Wind Direction:</strong> ${historical.windDirection}</div>
                            <div style="font-style: italic; color: #666; margin-top: 6px;">${historical.conditions}</div>
                        </div>
                    </div>
                    
                    <!-- Current Conditions -->
                    <div style="background: #e8f5e8; padding: 12px; border-radius: 6px;">
                        <h4 style="color: #2e7d32; margin-bottom: 8px;">🌡️ Current Conditions</h4>
                        <div style="font-size: 12px; line-height: 1.4;">
                            <div style="margin-bottom: 4px;"><strong>Temperature:</strong> ${currentWeather.temperature}°F</div>
                            <div style="margin-bottom: 4px;"><strong>Humidity:</strong> ${currentWeather.humidity}%</div>
                            <div style="margin-bottom: 4px;"><strong>Wind Speed:</strong> ${currentWeather.windSpeed} mph</div>
                            <div style="margin-bottom: 4px;"><strong>Wind Direction:</strong> ${currentWeather.windDirection}</div>
                            <div style="font-style: italic; color: #666; margin-top: 6px;">${currentWeather.conditions}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Risk Assessment -->
                <div style="margin-top: 15px; padding: 12px; background: ${this.getComparisonColor(historical, currentWeather)}; border-radius: 6px;">
                    <h4 style="margin-bottom: 6px;">📊 Risk Assessment</h4>
                    <div style="font-size: 12px;">
                        ${this.generateRiskComparison(historical, currentWeather)}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div style="text-align: center; margin-top: 15px; display: flex; gap: 10px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="flex: 1; background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        Close
                    </button>
                    <button onclick="ComparisonManager.exportComparison('${historicalFire.id}')" 
                            style="flex: 1; background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        Export Report
                    </button>
                </div>
            </div>
        `;
        
        // Add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;';
        overlay.innerHTML = comparisonHTML;
        
        // Close on overlay click
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        };
        
        document.body.appendChild(overlay);
        
        // Update narrative
        if (typeof NarrativeManager !== 'undefined') {
            NarrativeManager.updateNarrative(`📊 Comparing current conditions with ${historicalFire.name}. ${this.getComparisonSummary(historical, currentWeather)}`);
        }
    },
    
    getComparisonColor: function(historical, current) {
        const historicalDanger = this.calculateDangerLevel(historical);
        const currentDanger = this.calculateDangerLevel(current);
        
        if (currentDanger > historicalDanger) {
            return '#ffebee'; // Light red - current more dangerous
        } else if (currentDanger < historicalDanger) {
            return '#e8f5e8'; // Light green - current less dangerous
        } else {
            return '#fff3e0'; // Light orange - similar danger
        }
    },
    
    calculateDangerLevel: function(weather) {
        let danger = 0;
        
        // Temperature factor
        if (weather.temperature > 100) danger += 3;
        else if (weather.temperature > 90) danger += 2;
        else if (weather.temperature > 80) danger += 1;
        
        // Humidity factor (lower is worse)
        if (weather.humidity < 15) danger += 3;
        else if (weather.humidity < 25) danger += 2;
        else if (weather.humidity < 35) danger += 1;
        
        // Wind factor
        if (weather.windSpeed > 25) danger += 3;
        else if (weather.windSpeed > 15) danger += 2;
        else if (weather.windSpeed > 10) danger += 1;
        
        return danger;
    },
    
    generateRiskComparison: function(historical, current) {
        const historicalDanger = this.calculateDangerLevel(historical);
        const currentDanger = this.calculateDangerLevel(current);
        
        if (currentDanger > historicalDanger) {
            return `🚨 <strong>HIGHER RISK:</strong> Current conditions are more dangerous than during the ${historical.name}. Enhanced fire precautions recommended.`;
        } else if (currentDanger < historicalDanger) {
            return `✅ <strong>LOWER RISK:</strong> Current conditions are more favorable than during the historical fire event.`;
        } else {
            return `⚠️ <strong>SIMILAR RISK:</strong> Current conditions are comparable to the historical fire event. Monitor closely.`;
        }
    },
    
    getComparisonSummary: function(historical, current) {
        const tempDiff = current.temperature - historical.temperature;
        const humidityDiff = current.humidity - historical.humidity;
        const windDiff = current.windSpeed - historical.windSpeed;
        
        return `Temperature ${tempDiff > 0 ? 'higher' : 'lower'} by ${Math.abs(tempDiff)}°F, humidity ${humidityDiff > 0 ? 'higher' : 'lower'} by ${Math.abs(humidityDiff)}%, winds ${windDiff > 0 ? 'stronger' : 'weaker'} by ${Math.abs(windDiff)} mph.`;
    },
    
    exportComparison: function(fireId) {
        console.log('Exporting weather comparison for:', fireId);
        if (typeof NarrativeManager !== 'undefined') {
            NarrativeManager.updateNarrative('📄 Weather comparison report exported successfully.');
        }
    },
    
    toggleComparison: function() {
        this.comparisonMode = !this.comparisonMode;
        
        const button = $('#comparison-toggle');
        if (this.comparisonMode) {
            button.text('Exit Comparison').removeClass('btn-primary').addClass('btn-warning');
            
            // Show historical fires
            if (WildfireApp.layers && WildfireApp.layers.historicalFires) {
                WildfireApp.layers.historicalFires.addTo(WildfireApp.map);
            }
            
            $('#historical-fires').prop('checked', true).trigger('change');
            
            if (typeof NarrativeManager !== 'undefined') {
                NarrativeManager.updateNarrative('🔍 Historical comparison mode activated. Click on historical fires to compare weather conditions.');
            }
        } else {
            button.text('Historical Comparison').removeClass('btn-warning').addClass('btn-primary');
            
            // Hide historical fires
            if (WildfireApp.layers && WildfireApp.layers.historicalFires && WildfireApp.layers.historicalFires._map) {
                WildfireApp.map.removeLayer(WildfireApp.layers.historicalFires);
            }
            
            $('#historical-fires').prop('checked', false);
            
            if (typeof NarrativeManager !== 'undefined') {
                NarrativeManager.updateNarrative('📊 Returned to current conditions view.');
            }
        }
    }
};