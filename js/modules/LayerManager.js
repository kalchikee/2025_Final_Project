const LayerManager = {
    updateLayerVisibility: function() {
        // Weather stations visible at zoom 9+
        if (WildfireApp.zoomLevel >= 9 && $('#weather-stations').is(':checked') && !WildfireApp.map.hasLayer(WildfireApp.layers.weatherStations)) {
            WildfireApp.map.addLayer(WildfireApp.layers.weatherStations);
            WeatherManager.updateWeatherStations();
        } else if (WildfireApp.zoomLevel < 9 && WildfireApp.map.hasLayer(WildfireApp.layers.weatherStations)) {
            WildfireApp.map.removeLayer(WildfireApp.layers.weatherStations);
        }
        
        // Evacuation centers visible at zoom 8+
        if (WildfireApp.zoomLevel >= 8 && $('#evacuation-centers').is(':checked') && !WildfireApp.map.hasLayer(WildfireApp.layers.evacuationCenters)) {
            WildfireApp.map.addLayer(WildfireApp.layers.evacuationCenters);
        } else if (WildfireApp.zoomLevel < 8 && WildfireApp.map.hasLayer(WildfireApp.layers.evacuationCenters)) {
            WildfireApp.map.removeLayer(WildfireApp.layers.evacuationCenters);
        }
        
        // Population centers visible at zoom 10+
        if (WildfireApp.zoomLevel >= 10 && $('#population-centers').is(':checked') && !WildfireApp.map.hasLayer(WildfireApp.layers.populationCenters)) {
            WildfireApp.map.addLayer(WildfireApp.layers.populationCenters);
            PopulationManager.loadPopulationCenterMarkers();
        } else if (WildfireApp.zoomLevel < 10 && WildfireApp.map.hasLayer(WildfireApp.layers.populationCenters)) {
            WildfireApp.map.removeLayer(WildfireApp.layers.populationCenters);
        }
        
        // Road network visible at zoom 11+
        if (WildfireApp.zoomLevel >= 11 && $('#roads').is(':checked') && !WildfireApp.map.hasLayer(WildfireApp.layers.roads)) {
            RouteManager.loadRoadNetwork();
        }
    }
};