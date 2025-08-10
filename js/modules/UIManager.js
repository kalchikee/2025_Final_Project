const UIManager = {
    setupProgressiveDisclosure: function() {
        if (!WildfireApp.map) {
            console.error('Map not available for UI setup');
            return;
        }
        
        const zoomControl = L.control({position: 'bottomleft'});
        zoomControl.onAdd = function() {
            const div = L.DomUtil.create('div', 'zoom-info');
            div.innerHTML = '<div id="zoom-level">Zoom: 10</div><div id="layer-info">Zoom in to see more details</div>';
            return div;
        };
        zoomControl.addTo(WildfireApp.map);
        
        WildfireApp.map.on('zoomend', () => {
            const zoomElement = document.getElementById('zoom-level');
            if (zoomElement) {
                zoomElement.textContent = `Zoom: ${WildfireApp.map.getZoom()}`;
            }
            this.updateLayerInfo();
        });
    },
    
    updateLayerInfo: function() {
        if (!WildfireApp.map) return;
        
        const zoom = WildfireApp.map.getZoom();
        let info = '';
        if (zoom < 8) info = 'Zoom in to see evacuation centers and weather stations';
        else if (zoom < 9) info = 'Weather stations visible at zoom 9+';
        else if (zoom < 10) info = 'Population centers visible at zoom 10+';
        else if (zoom < 11) info = 'Road network visible at zoom 11+';
        else info = 'All layers available';
        
        const infoElement = document.getElementById('layer-info');
        if (infoElement) infoElement.textContent = info;
    }
};