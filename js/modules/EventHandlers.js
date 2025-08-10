// Event handling for UI controls
const EventHandlers = {
    setupEventHandlers: function() {
        console.log('Setting up event handlers...');
        
        if (typeof WildfireApp === 'undefined') {
            console.error('WildfireApp not available in EventHandlers');
            return;
        }
        
        // Wait for DOM and all dependencies
        $(document).ready(() => {
            console.log('DOM ready, checking dependencies...');
            
            // Check for required managers
            const requiredManagers = ['FireManager', 'PopulationManager', 'NarrativeManager'];
            const missingManagers = requiredManagers.filter(manager => typeof window[manager] === 'undefined');
            
            if (missingManagers.length > 0) {
                console.warn('Missing managers:', missingManagers);
                // Continue with available functionality
            }
            
            this.setupTimeControls();
            this.setupAnimationControls();
            this.setupSpeedControls();
            this.setupLayerToggles();
            this.setupActionButtons();
        });
    },
    
    setupTimeControls: function() {
        $('#time-slider').off('input change').on('input change', function() {
            if (typeof WildfireApp === 'undefined') return;
            
            if (WildfireApp.isPlaying) {
                AnimationManager.stopAnimation();
            }
            
            WildfireApp.currentTime = parseInt($(this).val()) + 6;
            if (WildfireApp.currentTime >= 24) WildfireApp.currentTime -= 24;
            
            $('#time-display').text(TimeManager.formatTime(WildfireApp.currentTime));
            
            if (typeof FireManager !== 'undefined') {
                FireManager.updateFireRiskSurface();
                FireManager.createFirePerimeters();
            }
            if (typeof NarrativeManager !== 'undefined') {
                NarrativeManager.updateNarrative();
            }
            if (typeof WeatherManager !== 'undefined') {
                WeatherManager.updateWeatherStations();
            }
            
            const riskLevel = TimeManager.getTimeRiskLevel(WildfireApp.currentTime);
            $(this).css('background', TimeManager.getTimeSliderColor(riskLevel));
        });
    },
    
    setupAnimationControls: function() {
        $('#play-toggle').off('click').on('click', function(e) {
            e.preventDefault();
            
            if (typeof WildfireApp === 'undefined' || typeof AnimationManager === 'undefined') {
                console.error('Required objects not available for animation');
                return;
            }
            
            console.log('Play button clicked, current state:', WildfireApp.isPlaying);
            
            if (WildfireApp.isPlaying) {
                AnimationManager.stopAnimation();
            } else {
                AnimationManager.startAnimation();
            }
        });
    },
    
    setupSpeedControls: function() {
        $('#speed-fast').off('click').on('click', function(e) {
            e.preventDefault();
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.changePlaySpeed(500);
            }
            $('.speed-controls button').removeClass('btn-warning').addClass('btn-primary');
            $(this).removeClass('btn-primary').addClass('btn-warning');
        });
        
        $('#speed-normal').off('click').on('click', function(e) {
            e.preventDefault();
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.changePlaySpeed(1000);
            }
            $('.speed-controls button').removeClass('btn-warning').addClass('btn-primary');
            $(this).removeClass('btn-primary').addClass('btn-warning');
        });
        
        $('#speed-slow').off('click').on('click', function(e) {
            e.preventDefault();
            if (typeof AnimationManager !== 'undefined') {
                AnimationManager.changePlaySpeed(2000);
            }
            $('.speed-controls button').removeClass('btn-warning').addClass('btn-primary');
            $(this).removeClass('btn-primary').addClass('btn-warning');
        });
    },
    
    setupLayerToggles: function() {
        if (typeof WildfireApp === 'undefined') return;
        
        // Helper function to safely check if layer is on map
        const isLayerOnMap = function(layer) {
            try {
                return layer && layer._map && WildfireApp.map && layer._map === WildfireApp.map;
            } catch (error) {
                return false;
            }
        };
        
        // Helper function to safely add layer
        const safeAddLayer = function(layer) {
            try {
                if (WildfireApp.map && layer && !isLayerOnMap(layer)) {
                    layer.addTo(WildfireApp.map);
                    return true;
                }
            } catch (error) {
                console.error('Error adding layer:', error);
            }
            return false;
        };
        
        // Helper function to safely remove layer
        const safeRemoveLayer = function(layer) {
            try {
                if (WildfireApp.map && layer && isLayerOnMap(layer)) {
                    WildfireApp.map.removeLayer(layer);
                    return true;
                }
            } catch (error) {
                console.error('Error removing layer:', error);
            }
            return false;
        };
        
        // Weather stations toggle
        $('#weather-stations').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.weatherStations) return;
            
            if ($(this).is(':checked') && WildfireApp.zoomLevel >= 9) { // Still at 9 since we're now closer by default
                if (safeAddLayer(WildfireApp.layers.weatherStations)) {
                    WeatherManager.updateWeatherStations();
                }
            } else {
                safeRemoveLayer(WildfireApp.layers.weatherStations);
            }
        });
        
        // Fire risk toggle
        $('#fire-risk').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.fireRisk) return;
            
            if ($(this).is(':checked')) {
                if (safeAddLayer(WildfireApp.layers.fireRisk)) {
                    FireManager.updateFireRiskSurface();
                }
            } else {
                safeRemoveLayer(WildfireApp.layers.fireRisk);
            }
        });
        
        // Evacuation centers
        $('#evacuation-centers').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.evacuationCenters) return;
            
            if ($(this).is(':checked') && WildfireApp.zoomLevel >= 7) { // Lowered from 8 to 7 since default is closer
                safeAddLayer(WildfireApp.layers.evacuationCenters);
            } else {
                safeRemoveLayer(WildfireApp.layers.evacuationCenters);
            }
        });
        
        // Population centers
        $('#population-centers').off('change').on('change', function() {
            console.log('Population centers toggle:', $(this).is(':checked'));
            
            if (!WildfireApp.layers || !WildfireApp.layers.populationCenters) {
                console.error('Population centers layer not available');
                return;
            }
            
            if ($(this).is(':checked')) {
                console.log('Adding population centers layer to map');
                if (!WildfireApp.layers.populationCenters._map) {
                    WildfireApp.layers.populationCenters.addTo(WildfireApp.map);
                }
            } else {
                console.log('Removing population centers layer from map');
                if (WildfireApp.layers.populationCenters._map) {
                    WildfireApp.map.removeLayer(WildfireApp.layers.populationCenters);
                }
            }
        });
        
        // Trigger the change event to ensure layer is shown initially
        $('#population-centers').trigger('change');
        
        // Buffer intersections
        $('#buffer-intersections').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.bufferIntersections) return;
            
            if ($(this).is(':checked')) {
                safeAddLayer(WildfireApp.layers.bufferIntersections);
            } else {
                safeRemoveLayer(WildfireApp.layers.bufferIntersections);
            }
        });
        
        // Historical fires toggle
        $('#historical-fires').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.historicalFires) return;
            
            if ($(this).is(':checked')) {
                safeAddLayer(WildfireApp.layers.historicalFires);
            } else {
                safeRemoveLayer(WildfireApp.layers.historicalFires);
            }
        });
        
        // Fire perimeters toggle
        $('#fire-perimeters').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.firePerimeters) return;
            
            if ($(this).is(':checked')) {
                if (safeAddLayer(WildfireApp.layers.firePerimeters)) {
                    console.log('Fire perimeters layer added, creating perimeters...');
                    if (typeof FireManager !== 'undefined') {
                        FireManager.createFirePerimeters();
                    }
                }
            } else {
                safeRemoveLayer(WildfireApp.layers.firePerimeters);
            }
        });
        
        // Evacuation buffers toggle
        $('#evacuation-buffers').off('change').on('change', function() {
            if (!WildfireApp.layers || !WildfireApp.layers.evacuationZones) return;
            
            if ($(this).is(':checked')) {
                safeAddLayer(WildfireApp.layers.evacuationZones);
                if (typeof EvacuationManager !== 'undefined') {
                    EvacuationManager.analyzeEvacuationNeeds();
                }
            } else {
                safeRemoveLayer(WildfireApp.layers.evacuationZones);
            }
        });
        
        // Route planning toggle
        $('#route-planning').off('change').on('change', function() {
            console.log('Route planning toggle clicked:', $(this).is(':checked'));
            
            if (!WildfireApp.layers || !WildfireApp.layers.routePlanning) {
                console.error('Route planning layer not available');
                return;
            }
            
            if ($(this).is(':checked')) {
                console.log('Adding route planning layer to map');
                if (!WildfireApp.layers.routePlanning._map) {
                    WildfireApp.layers.routePlanning.addTo(WildfireApp.map);
                }
            } else {
                console.log('Removing route planning layer from map');
                if (WildfireApp.layers.routePlanning._map) {
                    WildfireApp.map.removeLayer(WildfireApp.layers.routePlanning);
                }
                if (typeof RouteManager !== 'undefined') {
                    RouteManager.clearRoutes();
                }
            }
        });
    },
    
    setupActionButtons: function() {
        if (typeof WildfireApp === 'undefined') return;
        
        // Historical Comparison toggle
        $('#comparison-toggle').off('click').on('click', function(e) {
            e.preventDefault();
            console.log('Historical comparison clicked');
            
            if (typeof ComparisonManager !== 'undefined') {
                ComparisonManager.toggleComparison();
            } else {
                // Fallback if ComparisonManager doesn't exist
                WildfireApp.comparisonMode = !WildfireApp.comparisonMode;
                
                if (WildfireApp.comparisonMode) {
                    $(this).text('Exit Comparison').removeClass('btn-primary').addClass('btn-warning');
                    
                    // Show historical data
                    if (WildfireApp.layers && WildfireApp.layers.historicalFires) {
                        WildfireApp.layers.historicalFires.addTo(WildfireApp.map);
                    }
                    
                    if (typeof NarrativeManager !== 'undefined') {
                        NarrativeManager.updateNarrative('🔍 Historical comparison mode activated. Viewing past fire patterns and current conditions.');
                    }
                    
                    // Show comparison UI
                    $('#historical-fires').prop('checked', true).trigger('change');
                    
                } else {
                    $(this).text('Historical Comparison').removeClass('btn-warning').addClass('btn-primary');
                    
                    // Hide historical data
                    if (WildfireApp.layers && WildfireApp.layers.historicalFires) {
                        if (WildfireApp.layers.historicalFires._map) {
                            WildfireApp.map.removeLayer(WildfireApp.layers.historicalFires);
                        }
                    }
                    
                    if (typeof NarrativeManager !== 'undefined') {
                        NarrativeManager.updateNarrative('📊 Returned to current conditions view.');
                    }
                    
                    $('#historical-fires').prop('checked', false);
                }
            }
        });
        
        // Clear routes button (make sure there's only one, not duplicate)
        $('#clear-routes').off('click').on('click', function(e) {
            e.preventDefault();
            console.log('Clear routes button clicked');
            
            if (typeof RouteManager !== 'undefined') {
                RouteManager.clearRoutes();
            } else {
                console.log('RouteManager not available, clearing manually');
                if (WildfireApp.layers && WildfireApp.layers.routePlanning) {
                    WildfireApp.layers.routePlanning.clearLayers();
                }
                if (typeof NarrativeManager !== 'undefined') {
                    NarrativeManager.updateNarrative("🗺️ Evacuation routes cleared.");
                }
            }
        });
        
        // Export report
        $('#export-report').off('click').on('click', function(e) {
            e.preventDefault();
            if (typeof ReportManager !== 'undefined') {
                ReportManager.exportRiskAssessment();
            } else {
                // Fallback export functionality
                const report = {
                    timestamp: new Date().toISOString(),
                    currentTime: WildfireApp.currentTime,
                    activeFirePerimeters: WildfireApp.activeFirePerimeters.length,
                    evacuationZones: WildfireApp.currentEvacuationZones ? WildfireApp.currentEvacuationZones.length : 0,
                    riskLevel: TimeManager.getTimeRiskLevel(WildfireApp.currentTime)
                };
                
                console.log('Fire Risk Assessment Report:', report);
                alert('Report exported to console. Check browser console for details.');
            }
        });
        
        // Toggle routing mode button
        $('#toggle-routing').off('click').on('click', function(e) {
            e.preventDefault();
            if (typeof RouteManager !== 'undefined') {
                RouteManager.toggleRoutingMode();
            }
        });
    }
};

console.log('WildfireApp:', WildfireApp);
console.log('Current time:', WildfireApp.currentTime);