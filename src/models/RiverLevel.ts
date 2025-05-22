export type UnitType = 'ft' | 'cfs';

export interface RiverLevel {
    name: string;
    displayName?: string;
    waterLevel: number;
    lastUpdated: string;
    unit: UnitType;
    minFlow?: number;
    maxFlow?: number;
    trend?: {
        value: number;
        isRising: boolean;
    };
}

// USGS API service
export const usgsService = {
    // List of river stations we want to track with their human-readable names and units
    stations: [] as Array<{
        id: string;
        name: string;
        displayName?: string;
        unit: UnitType;
        minFlow?: number;
        maxFlow?: number;
    }>,

    async fetchRiverLevels(): Promise<RiverLevel[]> {
        const riverLevels: RiverLevel[] = [];
        const now = new Date();
        // Get data for the last 24 hours to ensure we have enough measurements
        const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Format date and time for USGS API (UTC time)
        const formatDateTime = (date: Date) => {
            const pad = (num: number) => num.toString().padStart(2, '0');
            const year = date.getUTCFullYear();
            const month = pad(date.getUTCMonth() + 1);
            const day = pad(date.getUTCDate());
            const hours = pad(date.getUTCHours());
            const minutes = pad(date.getUTCMinutes());
            return `${year}-${month}-${day}T${hours}:${minutes}:00Z`;
        };
        
        const startDateTime = formatDateTime(startTime);
        const endDateTime = formatDateTime(now);

        for (const station of this.stations) {
            try {
                // Parameter codes:
                // 00065 = Gage height, ft
                // 00060 = Discharge, cubic feet per second
                const paramCode = station.unit === 'cfs' ? '00060' : '00065';
                
                // Fetch data for the last 24 hours to get enough measurements
                const response = await fetch(
                    `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${station.id}` +
                    `&parameterCd=${paramCode}&startDT=${startDateTime}` +
                    `&endDT=${endDateTime}&siteStatus=all`
                );
                
                const data = await response.json();
                
                if (!data?.value?.timeSeries?.[0]?.values?.[0]?.value) {
                    // No time series data found
                }
                
                if (data?.value?.timeSeries?.[0]?.values?.[0]?.value?.length >= 2) {
                    const values = data.value.timeSeries[0].values[0].value;
                    
                    // Get the last 5 measurements (or all if fewer than 5)
                    const measurementPoints = values.slice(-5).map((v: any) => ({
                        value: parseFloat(v.value),
                        time: new Date(v.dateTime).getTime()
                    }));
                    
                    // Calculate the average rate of change between consecutive measurements
                    let totalChangePerHour = 0;
                    let validPairs = 0;
                    
                    for (let i = 1; i < measurementPoints.length; i++) {
                        const timeDiffHours = (measurementPoints[i].time - measurementPoints[i - 1].time) / (1000 * 60 * 60);
                        if (timeDiffHours > 0) {
                            const valueDiff = measurementPoints[i].value - measurementPoints[i - 1].value;
                            totalChangePerHour += valueDiff / timeDiffHours;
                            validPairs++;
                        }
                    }
                    
                    const currentValue = measurementPoints[measurementPoints.length - 1].value;
                    const avgChangePerHour = validPairs > 0 ? totalChangePerHour / validPairs : 0;
                    
                    riverLevels.push({
                        name: station.name,
                        displayName: station.displayName || station.name,
                        waterLevel: currentValue,
                        lastUpdated: measurementPoints[measurementPoints.length - 1].time,
                        unit: station.unit,
                        minFlow: station.minFlow,
                        maxFlow: station.maxFlow,
                        trend: {
                            value: Math.abs(avgChangePerHour),
                            isRising: avgChangePerHour > 0
                        }
                    });
                } else {

                }
            } catch (error) {

            }
        }

        return riverLevels;
    }
}
