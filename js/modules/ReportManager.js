const ReportManager = {
    exportRiskAssessment: function() {
        const report = {
            timestamp: new Date().toISOString(),
            currentTime: WildfireApp.currentTime,
            firePerimeters: WildfireApp.activeFirePerimeters.length,
            evacuationZones: WildfireApp.currentEvacuationZones.length,
            bufferIntersections: WildfireApp.bufferIntersections.length,
            riskLevel: TimeManager.getTimeRiskLevel(WildfireApp.currentTime)
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wildfire-risk-assessment-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        NarrativeManager.updateNarrative("📊 Risk assessment report exported successfully.");
    }
};