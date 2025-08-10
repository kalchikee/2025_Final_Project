const NarrativeManager = {
    narrativeMessages: {},
    
    init: function() {
        this.narrativeMessages = {
            6: "Early morning conditions: Light winds, low humidity. Fire risk is moderate. Buffer intersection system active.",
            7: "Dawn breaking: Temperatures beginning to rise, humidity dropping slightly.",
            8: "Morning warming begins. Humidity dropping, wind speeds increasing slightly.",
            9: "Mid-morning: Solar heating starting to drive wind patterns.",
            10: "Late morning: Temperatures rising, fire weather conditions developing.",
            11: "Pre-noon: Critical fire weather thresholds approaching.",
            12: "Noon conditions: Heat building, relative humidity falling below critical thresholds.",
            13: "Early afternoon: Wind speeds intensifying, extreme fire danger developing.",
            14: "Peak danger time: Winds reaching maximum speeds at 2:00 PM. Highest fire risk across the region.",
            15: "Peak conditions continue: Maximum fire weather severity. All resources on high alert.",
            16: "Late afternoon: Extreme fire weather continues. Enhanced evacuation readiness recommended.",
            17: "Early evening: Conditions remain critical but may begin to moderate.",
            18: "Evening approach: Fire weather typically begins to calm, but risks persist.",
            19: "Sunset: Winds should start to diminish, but vigilance required.",
            20: "Dusk: Fire weather conditions moderating but remain dangerous.",
            21: "Night falling: Cooling temperatures, increasing humidity expected.",
            22: "Late evening: Fire weather subsiding, but overnight monitoring continues.",
            23: "Night conditions: Lower fire risk, but hot spots may remain active.",
            0: "Midnight: Coolest conditions, highest humidity. Lowest fire risk period.",
            1: "Early morning hours: Stable conditions, opportunity for suppression activities.",
            2: "Deep night: Most favorable conditions for fire suppression.",
            3: "Pre-dawn: Coolest temperatures, highest humidity of the day.",
            4: "Before sunrise: Optimal conditions for firefighting operations.",
            5: "Dawn approaching: Preparing for another day of fire weather."
        };
    },
    
    updateNarrative: function(customMessage) {
        try {
            const narrativeElement = document.getElementById('narrative-text');
            if (!narrativeElement) return;
            
            const hour = Math.round(WildfireApp.currentTime);
            const message = customMessage || this.narrativeMessages[hour] || `Time: ${TimeManager.formatTime(hour)} - Monitoring fire conditions.`;
            
            const timestamp = new Date().toLocaleTimeString();
            narrativeElement.innerHTML = `<div><strong>[${timestamp}]</strong> ${message}</div>` + narrativeElement.innerHTML;
            
            // Keep only last 10 messages
            const messages = narrativeElement.children;
            while (messages.length > 10) {
                narrativeElement.removeChild(messages[messages.length - 1]);
            }
        } catch (error) {
            console.error('Error updating narrative:', error);
        }
    }
};