const PopulationManager = {
    init: function() {
        console.log('PopulationManager initialized');
        this.populationCenters = [];
    },

    createPopulationIcon: function(riskLevel, population) {
        // Determine icon size based on population - make all sizes larger for visibility
        let iconSize = 28; // Increased base size
        let fontSize = 16; // Larger font for better visibility
        
        if (population > 50000) {
            iconSize = 40; // Very large cities
            fontSize = 20;
        } else if (population > 20000) {
            iconSize = 36; // Large cities
            fontSize = 18;
        } else if (population > 5000) {
            iconSize = 32; // Medium cities
            fontSize = 17;
        }

        // Determine color based on risk level with stronger colors
        const riskColors = {
            'Low': '#2E7D32',      // Darker green for better visibility
            'Moderate': '#F57C00',  // Stronger orange
            'High': '#D32F2F',     // Strong red
            'Extreme': '#B71C1C'   // Very dark red
        };
        
        const color = riskColors[riskLevel] || '#424242';

        return L.divIcon({
            className: 'population-center-icon',
            html: `<div style="
                background: ${color}; 
                color: white; 
                padding: 8px; 
                border-radius: 50%; 
                text-align: center; 
                font-size: ${fontSize}px; 
                font-weight: bold;
                box-shadow: 0 3px 8px rgba(0,0,0,0.4); 
                width: ${iconSize}px; 
                height: ${iconSize}px; 
                line-height: ${iconSize-16}px;
                border: 2px solid white;
            ">🏘️</div>`,
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize/2, iconSize/2]
        });
    },

    getRiskColor: function(riskLevel) {
        const riskColors = {
            'Low': '#4CAF50',
            'Moderate': '#FF9800',
            'High': '#FF5722', 
            'Extreme': '#D32F2F'
        };
        return riskColors[riskLevel] || '#9E9E9E';
    },

    calculateDistance: function(lat1, lon1, lat2, lon2) {
        // Haversine formula for calculating distance between two points
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    toRadians: function(degrees) {
        return degrees * (Math.PI / 180);
    },

    loadPopulationCenterData: function() {
        // Expanded population centers for Riverside County wildfire-prone areas
        WildfireApp.populationCenters = [
            // Desert Communities
            {
                id: "pop_001",
                name: "Desert Hot Springs",
                coordinates: [33.9614, -116.5019],
                population: 28000,
                vulnerabilityScore: 4,
                housingDensity: "medium",
                evacuationRoutes: ["I-10", "CA-62"],
                specialNeeds: {
                    seniors: 3500,
                    disabled: 1200,
                    children: 4200
                }
            },
            {
                id: "pop_002", 
                name: "Palm Springs",
                coordinates: [33.8303, -116.5453],
                population: 47000,
                vulnerabilityScore: 3,
                housingDensity: "high",
                evacuationRoutes: ["I-10", "CA-111"],
                specialNeeds: {
                    seniors: 12000,
                    disabled: 2800,
                    children: 5600
                }
            },
            {
                id: "pop_003",
                name: "Cathedral City", 
                coordinates: [33.7794, -116.4655],
                population: 51000,
                vulnerabilityScore: 4,
                housingDensity: "high",
                evacuationRoutes: ["I-10", "Date Palm Dr"],
                specialNeeds: {
                    seniors: 8500,
                    disabled: 3100,
                    children: 9200
                }
            },
            {
                id: "pop_004",
                name: "Rancho Mirage",
                coordinates: [33.7397, -116.4126],
                population: 17000,
                vulnerabilityScore: 2,
                housingDensity: "medium",
                evacuationRoutes: ["CA-111", "Bob Hope Dr"],
                specialNeeds: {
                    seniors: 6800,
                    disabled: 850,
                    children: 1700
                }
            },
            {
                id: "pop_005",
                name: "Palm Desert",
                coordinates: [33.7222, -116.3747],
                population: 48000,
                vulnerabilityScore: 3,
                housingDensity: "medium",
                evacuationRoutes: ["I-10", "CA-74", "Monterey Ave"],
                specialNeeds: {
                    seniors: 18000,
                    disabled: 2400,
                    children: 4800
                }
            },
            {
                id: "pop_006",
                name: "Indian Wells",
                coordinates: [33.7167, -116.3406],
                population: 5000,
                vulnerabilityScore: 2,
                housingDensity: "low",
                evacuationRoutes: ["CA-111", "Washington St"],
                specialNeeds: {
                    seniors: 2500,
                    disabled: 200,
                    children: 400
                }
            },
            {
                id: "pop_007",
                name: "La Quinta",
                coordinates: [33.6631, -116.3100],
                population: 37000,
                vulnerabilityScore: 3,
                housingDensity: "medium",
                evacuationRoutes: ["CA-111", "Jefferson St"],
                specialNeeds: {
                    seniors: 14000,
                    disabled: 1800,
                    children: 4400
                }
            },
            {
                id: "pop_008",
                name: "Indio",
                coordinates: [33.7206, -116.2156],
                population: 89000,
                vulnerabilityScore: 4,
                housingDensity: "high",
                evacuationRoutes: ["I-10", "CA-111", "Jackson St"],
                specialNeeds: {
                    seniors: 12500,
                    disabled: 4500,
                    children: 18000
                }
            },
            // Mountain Communities (High Fire Risk)
            {
                id: "pop_009",
                name: "Idyllwild",
                coordinates: [33.7453, -116.7164],
                population: 3200,
                vulnerabilityScore: 5,
                housingDensity: "low",
                evacuationRoutes: ["CA-243"],
                specialNeeds: {
                    seniors: 1200,
                    disabled: 180,
                    children: 320
                }
            },
            {
                id: "pop_010",
                name: "Mountain Center",
                coordinates: [33.7031, -116.6781],
                population: 850,
                vulnerabilityScore: 5,
                housingDensity: "very_low",
                evacuationRoutes: ["CA-74"],
                specialNeeds: {
                    seniors: 340,
                    disabled: 45,
                    children: 85
                }
            },
            {
                id: "pop_011",
                name: "Pinyon Pines",
                coordinates: [33.6147, -116.6206],
                population: 620,
                vulnerabilityScore: 5,
                housingDensity: "very_low",
                evacuationRoutes: ["CA-74"],
                specialNeeds: {
                    seniors: 280,
                    disabled: 35,
                    children: 62
                }
            },
            // Riverside Area Communities
            {
                id: "pop_012",
                name: "Riverside",
                coordinates: [33.9533, -117.3962],
                population: 330000,
                vulnerabilityScore: 3,
                housingDensity: "high",
                evacuationRoutes: ["I-215", "CA-60", "CA-91"],
                specialNeeds: {
                    seniors: 42000,
                    disabled: 16500,
                    children: 66000
                }
            },
            {
                id: "pop_013",
                name: "Moreno Valley",
                coordinates: [33.9242, -117.2306],
                population: 208000,
                vulnerabilityScore: 3,
                housingDensity: "high",
                evacuationRoutes: ["CA-60", "I-215"],
                specialNeeds: {
                    seniors: 18700,
                    disabled: 10400,
                    children: 52000
                }
            },
            {
                id: "pop_014",
                name: "Cabazon",
                coordinates: [33.9167, -116.7833],
                population: 2500,
                vulnerabilityScore: 4,
                housingDensity: "low",
                evacuationRoutes: ["I-10"],
                specialNeeds: {
                    seniors: 450,
                    disabled: 125,
                    children: 500
                }
            },
            {
                id: "pop_015",
                name: "Whitewater",
                coordinates: [33.9500, -116.6333],
                population: 850,
                vulnerabilityScore: 4,
                housingDensity: "very_low",
                evacuationRoutes: ["I-10"],
                specialNeeds: {
                    seniors: 150,
                    disabled: 40,
                    children: 170
                }
            },
            // Rural Communities
            {
                id: "pop_016",
                name: "Anza",
                coordinates: [33.5556, -116.6736],
                population: 3200,
                vulnerabilityScore: 5,
                housingDensity: "very_low",
                evacuationRoutes: ["CA-371"],
                specialNeeds: {
                    seniors: 720,
                    disabled: 160,
                    children: 480
                }
            },
            {
                id: "pop_017",
                name: "Aguanga",
                coordinates: [33.4333, -116.8667],
                population: 1300,
                vulnerabilityScore: 5,
                housingDensity: "very_low",
                evacuationRoutes: ["CA-79"],
                specialNeeds: {
                    seniors: 290,
                    disabled: 65,
                    children: 195
                }
            },
            {
                id: "pop_018",
                name: "Garnet",
                coordinates: [33.6833, -116.8000],
                population: 420,
                vulnerabilityScore: 5,
                housingDensity: "very_low",
                evacuationRoutes: ["Local roads to CA-74"],
                specialNeeds: {
                    seniors: 168,
                    disabled: 21,
                    children: 42
                }
            },
            // New Communities
            {
                id: "pop_019", 
                name: "San Jacinto", 
                coordinates: [33.7839, -116.9586], 
                population: 48899, 
                vulnerabilityScore: 5,
                housingDensity: "medium",
                evacuationRoutes: ["CA-79", "CA-371"],
                specialNeeds: {
                    seniors: 12000,
                    disabled: 3000,
                    children: 6000
                }
            },
            {
                id: "pop_020", 
                name: "Hemet", 
                coordinates: [33.7475, -116.9719], 
                population: 84686, 
                vulnerabilityScore: 4,
                housingDensity: "high",
                evacuationRoutes: ["I-215", "CA-74"],
                specialNeeds: {
                    seniors: 18000,
                    disabled: 2400,
                    children: 4800
                }
            }
        ];
        
        console.log(`Loaded ${WildfireApp.populationCenters.length} population centers`);
    },
    
    loadPopulationCenterMarkers: function() {
        console.log('Loading population center markers...');
        
        if (!WildfireApp.layers || !WildfireApp.layers.populationCenters) {
            console.error('Population centers layer not available');
            return;
        }
        
        // Clear existing markers
        WildfireApp.layers.populationCenters.clearLayers();
        
        // Define population centers with demographics
        const populationCenters = [
            {id: 'pc_001', name: 'Palm Springs', coordinates: [33.8303, -116.5453], population: 48518, riskLevel: 'Moderate', 
             demographics: { seniors: 12000, children: 8000, disabled: 3500 }},
            {id: 'pc_002', name: 'Cathedral City', coordinates: [33.7794, -116.4653], population: 51875, riskLevel: 'High',
             demographics: { seniors: 15000, children: 12000, disabled: 4200 }},
            {id: 'pc_003', name: 'Desert Hot Springs', coordinates: [33.9614, -116.5019], population: 28335, riskLevel: 'High',
             demographics: { seniors: 8500, children: 6500, disabled: 2800 }},
            {id: 'pc_004', name: 'Palm Desert', coordinates: [33.7506, -116.3756], population: 51163, riskLevel: 'Moderate',
             demographics: { seniors: 18000, children: 9000, disabled: 3800 }},
            {id: 'pc_005', name: 'Indio', coordinates: [33.7206, -116.2156], population: 89137, riskLevel: 'Moderate',
             demographics: { seniors: 20000, children: 22000, disabled: 6500 }},
            {id: 'pc_006', name: 'La Quinta', coordinates: [33.6631, -116.3100], population: 41394, riskLevel: 'Low',
             demographics: { seniors: 15000, children: 8500, disabled: 2900 }},
            {id: 'pc_007', name: 'Coachella', coordinates: [33.6803, -116.1739], population: 45658, riskLevel: 'Low',
             demographics: { seniors: 8000, children: 15000, disabled: 3200 }},
            {id: 'pc_008', name: 'Rancho Mirage', coordinates: [33.7397, -116.4128], population: 18493, riskLevel: 'Moderate',
             demographics: { seniors: 8500, children: 2800, disabled: 1400 }},
            {id: 'pc_009', name: 'Indian Wells', coordinates: [33.7225, -116.3406], population: 5204, riskLevel: 'Low',
             demographics: { seniors: 2200, children: 800, disabled: 380 }},
            {id: 'pc_010', name: 'Bermuda Dunes', coordinates: [33.7442, -116.2906], population: 7282, riskLevel: 'Low',
             demographics: { seniors: 2800, children: 1500, disabled: 520 }},
            
            // Continue with all your existing communities...
            
            // NEW COMMUNITIES with demographics
            {
                id: 'pc_019', 
                name: 'San Jacinto', 
                coordinates: [33.7839, -116.9586], 
                population: 48899, 
                riskLevel: 'Extreme',
                evacuationStatus: 'Ready',
                specialNotes: 'Mountain community with limited evacuation routes',
                demographics: { seniors: 12000, children: 12500, disabled: 4200 }
            },
            {
                id: 'pc_020', 
                name: 'Hemet', 
                coordinates: [33.7475, -116.9719], 
                population: 84686, 
                riskLevel: 'High',
                evacuationStatus: 'Prepared', 
                specialNotes: 'Large retirement community, may need additional evacuation time',
                demographics: { seniors: 35000, children: 15000, disabled: 8500 }
            }
        ];
        
        // Store reference for other modules
        WildfireApp.populationCenters = populationCenters;
        this.populationCenters = populationCenters;
        
        populationCenters.forEach(center => {
            // Create the marker
            const marker = L.marker(center.coordinates, {
                icon: this.createPopulationIcon(center.riskLevel, center.population)
            }).addTo(WildfireApp.layers.populationCenters);
            
            marker.bindPopup(this.createPopulationPopup(center));
            marker.centerData = center;
            
            // Add labels for larger communities
            if (center.population > 10000) {
                L.marker(center.coordinates, {
                    icon: L.divIcon({
                        className: 'community-label',
                        html: `<div style="
                            background: rgba(255, 255, 255, 0.9); 
                            border: 1px solid #333; 
                            border-radius: 4px; 
                            padding: 2px 6px; 
                            font-weight: bold; 
                            font-size: 10px; 
                            color: #333; 
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            text-align: center;
                            white-space: nowrap;
                        ">${center.name}</div>`,
                        iconSize: [80, 20],
                        iconAnchor: [40, -15] // Position label above the icon
                    })
                }).addTo(WildfireApp.layers.populationCenters);
            }
        });
        
        console.log(`Loaded ${populationCenters.length} population centers with demographics`);
        
        // Ensure layer is added to map
        if (!WildfireApp.layers.populationCenters._map && WildfireApp.map) {
            WildfireApp.layers.populationCenters.addTo(WildfireApp.map);
        }
    },
    
    getMarkerSize: function(population) {
        if (population > 100000) return 20;
        if (population > 50000) return 16;
        if (population > 20000) return 12;
        if (population > 5000) return 8;
        if (population > 1000) return 6;
        return 4;
    },
    
    getVulnerabilityColor: function(score) {
        const colors = {
            5: '#8B0000', // Dark red - Extreme vulnerability
            4: '#DC143C', // Crimson - High vulnerability  
            3: '#FF8C00', // Dark orange - Moderate vulnerability
            2: '#FFD700', // Gold - Low vulnerability
            1: '#32CD32'  // Lime green - Very low vulnerability
        };
        return colors[score] || '#666666';
    },
    
    createPopulationPopup: function(center) {
        // Calculate distance to nearest fire
        let nearestFireDistance = "No active fires";
        
        if (WildfireApp.activeFirePerimeters && WildfireApp.activeFirePerimeters.length > 0) {
            let minDistance = Infinity;
            
            WildfireApp.activeFirePerimeters.forEach(fire => {
                if (fire.currentCenter) {
                    const distance = this.calculateDistance(
                        center.coordinates[0], center.coordinates[1],
                        fire.currentCenter[0], fire.currentCenter[1]
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                    }
                }
            });
            
            if (minDistance !== Infinity) {
                nearestFireDistance = minDistance.toFixed(2) + " miles";
            }
        }
        
        // Create popup with enhanced information for new communities
        let popupHTML = `
            <div class="population-popup" style="min-width: 220px;">
                <h4 style="color: #d32f2f; margin-bottom: 8px;">🏘️ ${center.name}</h4>
                <div style="font-size: 12px; line-height: 1.4;">
                    <strong>Population:</strong> ${center.population.toLocaleString()}<br>
                    <strong>Risk Level:</strong> <span style="color: ${this.getRiskColor(center.riskLevel)}; font-weight: bold;">${center.riskLevel}</span><br>
                    <strong>Distance to Fire:</strong> ${nearestFireDistance}<br>
                    <strong>Evacuation Status:</strong> ${center.evacuationStatus || 'Normal'}
        `;
        
        // Add special notes for San Jacinto and Hemet
        if (center.specialNotes) {
            popupHTML += `<br><strong>Notes:</strong> <em style="color: #666;">${center.specialNotes}</em>`;
        }
        
        popupHTML += `
                </div>
                
                <div style="margin-top: 10px;">
                    <button onclick="RouteManager.planEvacuationRoute('${center.id}')" 
                            style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; width: 100%;">
                        Plan Evacuation Route
                    </button>
                </div>
            </div>
        `;
        
        return popupHTML;
    },
    
    getVulnerabilityLabel: function(score) {
        const labels = {
            5: 'Extreme',
            4: 'High', 
            3: 'Moderate',
            2: 'Low',
            1: 'Very Low'
        };
        return labels[score] || 'Unknown';
    },
    
    estimateEvacuationTime: function(center, distance) {
        if (!center || !center.demographics) {
            console.warn('Missing demographics for center:', center ? center.name : 'unknown');
            // Provide default demographics if missing
            const defaultDemographics = {
                seniors: Math.floor(center.population * 0.25),
                children: Math.floor(center.population * 0.20),
                disabled: Math.floor(center.population * 0.08)
            };
            center.demographics = defaultDemographics;
        }
        
        const baseTime = distance / 25; // Base travel time at 25 mph
        const demographics = center.demographics;
        
        // Add time for vulnerable populations
        let multiplier = 1.0;
        
        if (demographics.seniors > center.population * 0.3) {
            multiplier += 0.5; // 50% more time for senior-heavy communities
        }
        
        if (demographics.disabled > center.population * 0.1) {
            multiplier += 0.3; // 30% more time for high disabled population
        }
        
        const estimatedTime = baseTime * multiplier;
        
        return Math.ceil(estimatedTime * 60); // Return in minutes
    }
};