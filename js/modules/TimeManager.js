// Time-based calculations and animations
const TimeManager = {
    formatTime: function(hour) {
        if (typeof hour !== 'number' || hour < 0 || hour > 23) {
            console.error('Invalid hour:', hour);
            return '00:00 AM';
        }
        
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour.toString().padStart(2, '0')}:00 ${ampm}`;
    },
    
    getTimeRiskMultiplier: function(hour) {
        if (typeof hour !== 'number') return 1.0;
        
        if (hour >= 14 && hour <= 16) return 2.0; // Peak afternoon risk
        if (hour >= 12 && hour <= 18) return 1.5; // High afternoon risk
        if (hour >= 10 && hour <= 20) return 1.2; // Moderate risk
        return 0.8; // Lower risk at night/early morning
    },
    
    getTimeRiskLevel: function(hour) {
        const multiplier = this.getTimeRiskMultiplier(hour);
        if (multiplier >= 1.8) return 'Extreme';
        if (multiplier >= 1.4) return 'High';
        if (multiplier >= 1.1) return 'Moderate';
        return 'Low';
    },
    
    getTimeSliderColor: function(riskLevel) {
        const colors = {
            'Extreme': '#d32f2f',
            'High': '#ff5722',
            'Moderate': '#ff9800',
            'Low': '#4caf50'
        };
        return colors[riskLevel] || '#666666';
    }
};