const UtilityManager = {
    getWindDirectionName: function(degrees) {
        const directions = {
            0: 'N', 45: 'NE', 90: 'E', 135: 'SE',
            180: 'S', 225: 'SW', 270: 'W', 315: 'NW'
        };
        
        let closest = 0;
        let minDiff = Math.abs(degrees - 0);
        
        Object.keys(directions).forEach(dir => {
            const diff = Math.abs(degrees - parseInt(dir));
            if (diff < minDiff) {
                minDiff = diff;
                closest = parseInt(dir);
            }
        });
        
        return directions[closest];
    }
};