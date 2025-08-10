const AnimationManager = {
    startAnimation: function() {
        console.log('AnimationManager.startAnimation called, isPlaying:', WildfireApp.isPlaying);
        
        if (WildfireApp.isPlaying) {
            console.log('Animation already playing, returning');
            return;
        }
        
        WildfireApp.isPlaying = true;
        console.log('Starting animation, isPlaying set to:', WildfireApp.isPlaying);
        
        this.updatePlayButton();
        
        WildfireApp.playInterval = setInterval(() => {
            console.log('Animation tick, current time:', WildfireApp.currentTime);
            
            let nextTime = WildfireApp.currentTime + 1;
            if (nextTime >= 24) nextTime = 0;
            
            WildfireApp.currentTime = nextTime;
            
            // Update slider to match time (slider goes 0-17 for 6AM-11PM)
            const sliderValue = WildfireApp.currentTime >= 6 ? WildfireApp.currentTime - 6 : WildfireApp.currentTime + 18;
            const timeSlider = $('#time-slider');
            if (timeSlider.length) {
                timeSlider.val(sliderValue);
            }
            
            // Update display
            const timeDisplay = $('#time-display');
            if (timeDisplay.length && typeof TimeManager !== 'undefined' && TimeManager.formatTime) {
                timeDisplay.text(TimeManager.formatTime(WildfireApp.currentTime));
            }
            
            // Update map layers with error handling for each manager
            try {
                if (typeof FireManager !== 'undefined' && FireManager.updateFireRiskSurface) {
                    FireManager.updateFireRiskSurface();
                }
            } catch (error) {
                console.error('Error updating fire risk surface:', error);
            }
            
            try {
                if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                    NarrativeManager.updateNarrative();
                }
            } catch (error) {
                console.error('Error updating narrative:', error);
            }
            
            try {
                if (typeof WeatherManager !== 'undefined' && WeatherManager.updateWeatherStations) {
                    WeatherManager.updateWeatherStations();
                }
            } catch (error) {
                console.error('Error updating weather stations:', error);
            }
            
            try {
                if (typeof FireManager !== 'undefined' && FireManager.createFirePerimeters) {
                    FireManager.createFirePerimeters();
                }
            } catch (error) {
                console.error('Error creating fire perimeters:', error);
            }
            
            // Update slider color
            try {
                if (typeof TimeManager !== 'undefined' && TimeManager.getTimeRiskLevel && TimeManager.getTimeSliderColor) {
                    const riskLevel = TimeManager.getTimeRiskLevel(WildfireApp.currentTime);
                    const sliderColor = TimeManager.getTimeSliderColor(riskLevel);
                    if (timeSlider.length) {
                        timeSlider.css('background', sliderColor);
                    }
                }
            } catch (error) {
                console.error('Error updating slider color:', error);
            }
            
        }, WildfireApp.playSpeed);
        
        // Safe narrative update
        try {
            if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative("▶️ Animation started: Watching fire conditions change over 24 hours...");
            }
        } catch (error) {
            console.error('Error updating start narrative:', error);
        }
        
        console.log('Animation interval created:', WildfireApp.playInterval);
    },
    
    stopAnimation: function() {
        console.log('AnimationManager.stopAnimation called, isPlaying:', WildfireApp.isPlaying);
        
        if (!WildfireApp.isPlaying) {
            console.log('Animation not playing, returning');
            return;
        }
        
        WildfireApp.isPlaying = false;
        
        if (WildfireApp.playInterval) {
            clearInterval(WildfireApp.playInterval);
            WildfireApp.playInterval = null;
            console.log('Animation interval cleared');
        }
        
        this.updatePlayButton();
        
        // Safe narrative update
        try {
            if (typeof NarrativeManager !== 'undefined' && NarrativeManager.updateNarrative) {
                NarrativeManager.updateNarrative("⏹️ Animation stopped.");
            }
        } catch (error) {
            console.error('Error updating stop narrative:', error);
        }
        
        console.log('Animation stopped successfully');
    },
    
    updatePlayButton: function() {
        const button = $('#play-toggle');
        console.log('Updating play button, found button:', button.length > 0, 'isPlaying:', WildfireApp.isPlaying);
        
        if (button.length === 0) {
            console.error('Play button not found for update!');
            return;
        }
        
        if (WildfireApp.isPlaying) {
            button.text('⏸️ Pause Animation');
            button.removeClass('btn-primary').addClass('btn-warning');
            console.log('Button updated to pause state');
        } else {
            button.text('▶️ Play Animation');
            button.removeClass('btn-warning').addClass('btn-primary');
            console.log('Button updated to play state');
        }
    },
    
    changePlaySpeed: function(speed) {
        console.log('Changing play speed to:', speed);
        
        if (typeof speed !== 'number' || speed <= 0) {
            console.error('Invalid play speed:', speed);
            return;
        }
        
        WildfireApp.playSpeed = speed;
        
        if (WildfireApp.isPlaying) {
            this.stopAnimation();
            this.startAnimation();
        }
        
        const speedDisplay = $('#speed-display');
        if (speedDisplay.length) {
            speedDisplay.text(this.getSpeedLabel(speed));
        }
        
        console.log('Animation speed changed to:', speed);
    },
    
    getSpeedLabel: function(speed) {
        switch(speed) {
            case 500: return 'Fast (0.5s)';
            case 1000: return 'Normal (1s)';  
            case 2000: return 'Slow (2s)';
            default: return 'Normal (1s)';
        }
    }
};