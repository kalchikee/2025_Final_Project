# Team Name
GEOG575_2025_Final_Project
### Team Members
Ethan Kalchik Ben Andrusko
### Final Proposal
1. Persona/Scenario
    1. Persona
    Sarah Chen is a 35-year-old Emergency Management Coordinator for Riverside County, California, she has  8 years of experience coordinating evacuation plans during wildfire season. She holds a Master's in Emergency Management and possesses high domain expertise in fire behavior and evacuation protocols, she also has moderate GIS skills and comfort with web-based emergency management tools. Her primary needs center on real-time risk assessment, efficient evacuation route planning, and public communication during critical situations.
    Sarah's overarching goal is to minimize civilian casualties and to property damage during wildfire events. Her primary objectives include assessing the current fire risk levels across geographic areas and time, as well as identifying the optimal evacuation routes by analyzing road networks and population centers, she is also monitoring resource deployment through emergency asset tracking. The key insights she requires involve understanding which areas face immediate threat, which routes remain viable under changing conditions, and where the resources should be positioned for maximum effectiveness for the community. The application must prioritize real-time data integration, clear risk visualization for the user, and rapid route analysis to support time-critical decision-making to the community and its residence.

    2. Scenario
    It’s 6:00 AM during a Red Flag Warning, theres 40+ mph winds and 10% humidity, and Sarah opens the Wildfire Risk & Evacuation Planner to begin her morning risk assessment. She first identifies the current fire weather conditions by clicking weather station markers, showing the wind speeds, direction, and humidity readings. She reads through the next 24 hours using the temporal slider, and noting that winds will peak at around 2:00 PM. Then she calculates the function, automatically updating the fire risk surfaces based on current weather data, and symbolizes the high-risk areas in red gradients overlaid on the terrain basemap.
    She also notices elevated risk near the Eagle Mountain subdivision, Sarah filters the population layer to highlight vulnerable residents and identifies three evacuation routes using the "Route Analysis" tool. She selects Eagle Mountain as origin and clicks evacuation centers as destinations, triggering the calculate function to generates the optimal routes considering traffic capacity and road conditions. The routes are symbolized with different colors and annotated with travel times and capacity constraints.
    Sarah retrieves historical fire data using temporal controls, comparing current conditions to past events. She arranges the interface to display a side-by-side comparison of today's risk surface with conditions from a major fire two years ago for Riverside County, California, revealing similar patterns. Based on her analysis, she exports a risk assessment report and uses the notification system to disseminate a pre-evacuation advisory to Eagle Mountain residents. Throughout the morning, Sarah monitors changing conditions through live weather feeds, as she is also ready to escalate to a mandatory evacuation order if fire ignitions occur in identified high-risk zones.

2. Requirements Document
    1. Representation
        Terrain Basemap- USGS 3DEP Elevation (https://www.usgs.gov/ngp-standards-and-specifications3d-elevation-program-standards-and-specifications)
        Fire Weather Stations -(https://ipm.ucanr.edu/weather/ca-weather-data/#gsc.tab=0)
        Current Fire Risk Surface - ( a custom weather model)
        Active Fire Perimeters -(https://inciweb.wildfire.gov/)
        Road Network - (https://www.openstreetmap.org/#map=5/38.01/-95.84)
        Population Density - (data/uscities.csv)
        Evacuation Centers- ( will depend on the current environment)
        Historical Fire Footprints - (https://gis.data.ca.gov/datasets/CALFIRE-Forestry::ca-perimeters-cal-fire-nifc-firis-public-view/about)
    2. Interaction
        Weather Station Query-(create a situation)
            Example: const weatherStations = [
            {id: "RAWS_123", lat: 34.123, lon: -117.456,
            windSpeed: 45, windDirection: 270, humidity: 12, temperature: 95, timestamp: "2020-09-27T14:00:00"}]
        Temporal Risk Animation-(create a situation)
            Example:const timeSteps = [
            {time: "06:00", riskSurface: [...grid values...]},
            {time: "08:00", riskSurface: [...updated values...]},
            {time: "10:00", riskSurface: [...higher values...]}]
        Risk Level Filtering-(create a situation)
            Example: const riskAreas = [{id: 1, geometry: {...}, riskLevel: "high", score:8.5},{id: 2, geometry: {...}, riskLevel: "moderate", score: 4.2}]
        Evacuation Route Planner-(create a situation)
            How to create: Download OpenStreetMap road data for your study area. Identify real evacuation centers (schools, community centers). Use routing libraries like Leaflet Routing Machine. Create simple cost/time estimates based on road types
        Historical Comparison-                                  (data\CA_Perimeters_CAL_FIRE_NIFC_FIRIS_public_view (1).geojson)
        Layer Visibility Toggle-(create a situation)
            Example:const layerControls = { weatherStations: true,        fireRisk: false, roads: true, population: false,evacuationCenters: true }
        Risk Assessment Export-(create a situation)
            Example: const assessmentReport = {timestamp:       "2020-09-27T14:30:00",scenario: "Perfect Storm Composite",
            riskSummary: {highRiskAreas: 12, peopleAtRisk: 15420,
            evacuationRoutesAvailable: 3, estimatedEvacuationTime: "2.5 hours"}, recommendations: [ "Issue pre-evacuation advisory for Eagle Mountain",
            Stage resources at Riverside Community Center", "Monitor wind conditions at Station RAWS_456"]}
        Emergency Alert System -(create a situation)
            Example: const alertSystem = { templates: { preEvacuation:  "EVACUATION WARNING: Prepare to leave {area} due to wildfire threat. Monitor local radio for updates.", mandatory: "EVACUATION ORDER: Leave {area} immediately via {routes}. Go to {shelter}."}, deliveryLog: [ {time: "14:30", area: "Eagle Mountain", type: "preEvacuation", sent: true},
            {time: "16:45", area: "Eagle Mountain", type: "mandatory", sent: false}]}
        Real-time Monitoring Dashboard -(create a situation)
            Example:const dashboardData = { activeIncidents: 3,weatherAlerts: ["Red Flag Warning", "Wind Advisory"],resourceStatus: {fireEngines: {available: 12, deployed: 8},
            helicopters: {available: 2, deployed: 1}},
            evacuationStatus: {inProgress: ["Eagle Mountain", "Pine Valley"], completed: ["Riverside Heights"]}}
        
3. Wireframes
- [Wireframe 1](img/wireframe1.jpg)
- [Wireframe 2](img/wireframe2.jpg)





