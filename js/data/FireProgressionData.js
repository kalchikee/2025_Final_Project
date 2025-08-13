// Fire progression data - simulating fire growth throughout the day
const fireProgressionData = {
    // Fire perimeter growth by hour
    timeSteps: {
        6: {  // 6:00 AM - Initial ignition (San Jacinto only)
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 500,
                    intensity: 'low',
                    acres: 25,
                    containment: 0
                }
            ]
        },
        7: {  // 7:00 AM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 800,
                    intensity: 'low',
                    acres: 80,
                    containment: 0
                }
            ]
        },
        8: {  // 8:00 AM - Desert Hills Fire starts
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 1200,
                    intensity: 'moderate',
                    acres: 180,
                    containment: 0
                },
                {
                    center: [33.7500, -116.4000], // Desert Hills Fire ignition (starting point)
                    radius: 300,
                    intensity: 'low',
                    acres: 15,
                    containment: 0
                }
            ]
        },
        9: {  // 9:00 AM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 1600,
                    intensity: 'moderate',
                    acres: 320,
                    containment: 0
                },
                {
                    center: [33.7450, -116.3900], // Desert Hills Fire (starting to move south)
                    radius: 600,
                    intensity: 'low',
                    acres: 45,
                    containment: 0
                }
            ]
        },
        10: {  // 10:00 AM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 2000,
                    intensity: 'moderate',
                    acres: 500,
                    containment: 0
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 400,
                    intensity: 'low',
                    acres: 20,
                    containment: 0
                },
                {
                    center: [33.7400, -116.3800], // Desert Hills Fire (moving towards La Quinta)
                    radius: 900,
                    intensity: 'moderate',
                    acres: 105,
                    containment: 0
                }
            ]
        },
        11: {  // 11:00 AM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 2600,
                    intensity: 'moderate',
                    acres: 850,
                    containment: 5
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 600,
                    intensity: 'moderate',
                    acres: 45,
                    containment: 0
                },
                {
                    center: [33.7300, -116.3700], // Desert Hills Fire (continuing south)
                    radius: 1200,
                    intensity: 'moderate',
                    acres: 180,
                    containment: 0
                }
            ]
        },
        12: {  // 12:00 PM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 3500,
                    intensity: 'high',
                    acres: 1250,
                    containment: 10
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 800,
                    intensity: 'moderate',
                    acres: 85,
                    containment: 0
                },
                {
                    center: [33.7200, -116.3600], // Desert Hills Fire (approaching La Quinta area)
                    radius: 1600,
                    intensity: 'high',
                    acres: 320,
                    containment: 5
                }
            ]
        },
        13: {  // 1:00 PM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 4500,
                    intensity: 'high',
                    acres: 2100,
                    containment: 8
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 1100,
                    intensity: 'high',
                    acres: 150,
                    containment: 0
                },
                {
                    center: [33.7100, -116.3500], // Desert Hills Fire (getting closer to La Quinta)
                    radius: 2200,
                    intensity: 'high',
                    acres: 650,
                    containment: 0
                }
            ]
        },
        14: {  // 2:00 PM - CRITICAL (Peak winds) - Fire reaches La Quinta outskirts
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 5500,
                    intensity: 'extreme',
                    acres: 3200,
                    containment: 5
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 1500,
                    intensity: 'high',
                    acres: 280,
                    containment: 0
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 600,
                    intensity: 'moderate',
                    acres: 45,
                    containment: 0
                },
                {
                    center: [33.6900, -116.3300], // Desert Hills Fire (THREATENING LA QUINTA)
                    radius: 2800,
                    intensity: 'extreme',
                    acres: 1050,
                    containment: 0
                }
            ]
        },
        15: {  // 3:00 PM - Maximum threat - Fire very close to La Quinta
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 6200,
                    intensity: 'extreme',
                    acres: 4500,
                    containment: 10
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 1800,
                    intensity: 'high',
                    acres: 420,
                    containment: 10
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 800,
                    intensity: 'high',
                    acres: 80,
                    containment: 0
                },
                {
                    center: [33.6750, -116.3200], // Desert Hills Fire (VERY CLOSE TO LA QUINTA)
                    radius: 3200,
                    intensity: 'extreme',
                    acres: 1350,
                    containment: 5
                }
            ]
        },
        16: {  // 4:00 PM - Fire reaches La Quinta's northern edge
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 7000,
                    intensity: 'extreme',
                    acres: 5800,
                    containment: 15
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2200,
                    intensity: 'high',
                    acres: 650,
                    containment: 20
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1000,
                    intensity: 'high',
                    acres: 125,
                    containment: 0
                },
                {
                    center: [33.6650, -116.3100], // Desert Hills Fire (AT LA QUINTA'S NORTHERN EDGE!)
                    radius: 3600,
                    intensity: 'high',
                    acres: 1800,
                    containment: 15
                }
            ]
        },
        17: {  // 5:00 PM - Defensive actions at La Quinta
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 7500,
                    intensity: 'high',
                    acres: 6500,
                    containment: 25
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2400,
                    intensity: 'high',
                    acres: 750,
                    containment: 30
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1150,
                    intensity: 'moderate',
                    acres: 160,
                    containment: 15
                },
                {
                    center: [33.6650, -116.3080], // Desert Hills Fire (firefighters making stand at La Quinta)
                    radius: 3800,
                    intensity: 'high',
                    acres: 2100,
                    containment: 25
                }
            ]
        },
        18: {  // 6:00 PM - Fire stopped at La Quinta's defensive line
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 8000,
                    intensity: 'high',
                    acres: 7200,
                    containment: 35
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2500,
                    intensity: 'moderate',
                    acres: 850,
                    containment: 45
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1200,
                    intensity: 'moderate',
                    acres: 180,
                    containment: 25
                },
                {
                    center: [33.6680, -116.3090], // Desert Hills Fire (held at La Quinta's edge)
                    radius: 4000,
                    intensity: 'moderate',
                    acres: 2300,
                    containment: 40
                }
            ]
        },
        19: {  // 7:00 PM - Winds calming, fire pushed back from La Quinta
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 8300,
                    intensity: 'moderate',
                    acres: 7800,
                    containment: 45
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2550,
                    intensity: 'moderate',
                    acres: 880,
                    containment: 60
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1230,
                    intensity: 'low',
                    acres: 190,
                    containment: 50
                },
                {
                    center: [33.6720, -116.3120], // Desert Hills Fire (being pushed back from La Quinta)
                    radius: 4100,
                    intensity: 'moderate',
                    acres: 2400,
                    containment: 55
                }
            ]
        },
        20: {  // 8:00 PM - Fire retreating from La Quinta
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 8500,
                    intensity: 'moderate',
                    acres: 8100,
                    containment: 55
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2600,
                    intensity: 'low',
                    acres: 900,
                    containment: 70
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1250,
                    intensity: 'low',
                    acres: 200,
                    containment: 60
                },
                {
                    center: [33.6780, -116.3180], // Desert Hills Fire (retreating north from La Quinta)
                    radius: 4150,
                    intensity: 'low',
                    acres: 2450,
                    containment: 70
                }
            ]
        },
        21: {  // 9:00 PM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 8600,
                    intensity: 'low',
                    acres: 8300,
                    containment: 65
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2620,
                    intensity: 'low',
                    acres: 910,
                    containment: 80
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1255,
                    intensity: 'contained',
                    acres: 202,
                    containment: 90
                },
                {
                    center: [33.6850, -116.3250], // Desert Hills Fire (well back from La Quinta)
                    radius: 4180,
                    intensity: 'low',
                    acres: 2480,
                    containment: 80
                }
            ]
        },
        22: {  // 10:00 PM
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 8650,
                    intensity: 'low',
                    acres: 8350,
                    containment: 70
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2630,
                    intensity: 'contained',
                    acres: 915,
                    containment: 85
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1258,
                    intensity: 'contained',
                    acres: 203,
                    containment: 95
                },
                {
                    center: [33.6900, -116.3300], // Desert Hills Fire (stabilized)
                    radius: 4200,
                    intensity: 'contained',
                    acres: 2500,
                    containment: 90
                }
            ]
        },
        23: {  // 11:00 PM - Night suppression, La Quinta saved
            perimeters: [
                {
                    center: [33.7839, -116.9586], // San Jacinto Fire
                    radius: 8700,
                    intensity: 'low',
                    acres: 8400,
                    containment: 75
                },
                {
                    center: [33.7650, -116.9200], // San Jacinto spot fire
                    radius: 2650,
                    intensity: 'contained',
                    acres: 920,
                    containment: 90
                },
                {
                    center: [33.7600, -116.9100], // San Jacinto new spot
                    radius: 1260,
                    intensity: 'contained',
                    acres: 205,
                    containment: 100
                },
                {
                    center: [33.6950, -116.3350], // Desert Hills Fire - CONTAINED (La Quinta protected)
                    radius: 4220,
                    intensity: 'contained',
                    acres: 2520,
                    containment: 100
                }
            ]
        }
    }
};

// Make it globally available
window.fireProgressionData = fireProgressionData;

console.log('🔥 Fire progression data loaded successfully - Desert Hills Fire threatens La Quinta');