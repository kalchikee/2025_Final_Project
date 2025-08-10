// Main application entry point
$(document).ready(function() {
    console.log('App.js: DOM ready, checking dependencies...');
    
    // Check if core managers are loaded
    const coreManagers = [
        { name: 'WildfireApp', required: true },
        { name: 'FireManager', required: false }, 
        { name: 'PopulationManager', required: false },
        { name: 'EvacuationManager', required: false },
        { name: 'RouteManager', required: false },
        { name: 'NarrativeManager', required: false },
        { name: 'EventHandlers', required: false }
    ];
    
    const loadedManagers = [];
    const missingManagers = [];
    
    coreManagers.forEach(manager => {
        if (typeof window[manager.name] !== 'undefined') {
            loadedManagers.push(manager.name);
        } else {
            missingManagers.push(manager.name);
        }
    });
    
    console.log('✅ Loaded managers:', loadedManagers);
    if (missingManagers.length > 0) {
        console.log('ℹ️ Missing managers (fallbacks will be created):', missingManagers);
    }
    
    // Initialize WildfireApp with proper timing
    if (typeof WildfireApp !== 'undefined') {
        if (!WildfireApp.map) {
            console.log('App.js: Initializing WildfireApp...');
            try {
                WildfireApp.init();
                
                // Verify initialization worked
                setTimeout(() => {
                    if (WildfireApp.map) {
                        console.log('✅ WildfireApp initialization successful');
                        
                        // Trigger data loading after successful initialization
                        if (typeof DataLoader !== 'undefined' && DataLoader.loadSampleData) {
                            console.log('Loading sample data...');
                            DataLoader.loadSampleData();
                        }
                        
                    } else {
                        console.warn('⚠️ WildfireApp initialized but map not created');
                    }
                }, 500);
                
            } catch (error) {
                console.error('❌ Error initializing WildfireApp:', error);
            }
        } else {
            console.log('App.js: WildfireApp already initialized');
        }
    } else {
        console.error('App.js: WildfireApp not loaded! Check script order.');
    }
});