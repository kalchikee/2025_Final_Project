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
        Current Fire Risk Surface - ( a custom weatehr model)
        Active Fire Perimeters -(https://inciweb.wildfire.gov/)
        Road Network - (https://www.openstreetmap.org/#map=5/38.01/-95.84)
        Population Density - (data/uscities.csv)
        Evacuation Centers- ( will depend on the current enviornment)
        Historical Fire Footprints - (https://gis.data.ca.gov/datasets/CALFIRE-Forestry::ca-perimeters-cal-fire-nifc-firis-public-view/about)
    2. Interaction
        Weather Station Query-( depend on situation)
        Temporal Risk Animation-( depend on situation)
        Risk Level Filtering-( depend on situation)
        Evacuation Route Planner-( depend on situation)
        Historical Comparison-( depend on situation)
        Layer Visibility Toggle-( depend on situation)
        Risk Assessment Export-( depend on situation)
        Emergency Alert System -( depend on situation)
        Real-time Monitoring Dashboard -( depend on situation)
        Resource Deployment Tracker -( depend on situation and deployment)
        
3. Wireframes
- [Wireframe 1](img/wireframe1.jpg)
- [Wireframe 2](img/wireframe2.jpg)





