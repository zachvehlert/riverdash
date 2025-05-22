import React, { useState, useEffect } from 'react';
import { usgsService } from '../models/RiverLevel';

import { UnitType } from '../models/RiverLevel';

interface AddRiverProps {
    onAddGauge: (gauge: { 
        id: string; 
        name: string; 
        displayName?: string; 
        unit: UnitType;
        minFlow?: number;
        maxFlow?: number;
    }) => void;
}

const STATES = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
];

interface Gauge {
    id: string;
    name: string;
    location?: string;
}

export const AddRiver = ({ onAddGauge }: AddRiverProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedState, setSelectedState] = useState<{code: string, name: string} | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [gauges, setGauges] = useState<Gauge[]>([]);
    const [selectedGauge, setSelectedGauge] = useState<Gauge | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [unit, setUnit] = useState<UnitType>('ft');
    const [minFlow, setMinFlow] = useState<number | ''>('');
    const [maxFlow, setMaxFlow] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [showGaugesList, setShowGaugesList] = useState(false);

    const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateCode = e.target.value;
        if (!stateCode) {
            setSelectedState(null);
            setGauges([]);
            return;
        }
        
        const newState = STATES.find(state => state.code === stateCode);
        if (newState) {
            setSelectedState(newState);
            setSearchQuery('');
            setSelectedGauge(null);
            setLoading(true);
            try {
                const response = await fetch(
                    `https://waterservices.usgs.gov/nwis/iv/?format=json&stateCd=${newState.code}&parameterCd=00065&siteStatus=active`
                );
                const data = await response.json();
                
                if (data?.value?.timeSeries) {
                    const gauges = data.value.timeSeries.map((series: any) => ({
                        id: series.sourceInfo.siteCode[0].value,
                        name: series.sourceInfo.siteName,
                        location: series.sourceInfo.geoLocation?.geogLocation
                            ? `${series.sourceInfo.geoLocation.geogLocation.latitude}, ${series.sourceInfo.geoLocation.geogLocation.longitude}`
                            : 'Location not available'
                    }));
                    
                    setGauges(gauges);
                } else {
                    setGauges([]);
                }
            } catch (error) {
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddGauge = () => {
        if (selectedGauge) {
            const gaugeData: any = {
                ...selectedGauge,
                displayName: displayName.trim() || selectedGauge.name,
                unit: unit
            };
            
            // Only add minFlow and maxFlow if they have values
            if (minFlow !== '') gaugeData.minFlow = minFlow;
            if (maxFlow !== '') gaugeData.maxFlow = maxFlow;
            
            onAddGauge(gaugeData);
            
            // Reset form
            setIsOpen(false);
            setSelectedGauge(null);
            setDisplayName('');
            setSearchQuery('');
            setShowGaugesList(false);
            setMinFlow('');
            setMaxFlow('');
        }
    };

    const handleSearchFocus = () => {
        setShowGaugesList(true);
    };

    const handleGaugeSelect = (gauge: Gauge) => {
        setSelectedGauge(gauge);
        setDisplayName(''); // Don't pre-populate display name
        setShowGaugesList(false);
        setSearchQuery('');
    };

    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayName(e.target.value);
    };

    const filteredGauges = gauges.filter(gauge =>
        gauge.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <button 
                className="btn btn-primary"
                onClick={() => setIsOpen(true)}
            >
                Add New River
            </button>

            {isOpen && (
                <div 
                    className="modal show" 
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    tabIndex={-1}
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add New River</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close"
                                />
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <select 
                                        className="form-select mb-2"
                                        value={selectedState?.code || ''}
                                        onChange={handleStateChange}
                                        required
                                    >
                                        <option value="" disabled>Select a state...</option>
                                        {STATES.map(state => (
                                            <option key={state.code} value={state.code}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <input
                                        type="text"
                                        className="form-control mb-2"
                                        placeholder="Search gauges..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={handleSearchFocus}
                                        onClick={handleSearchFocus}
                                        disabled={loading}
                                    />
                                    
                                    {(searchQuery || showGaugesList) && (
                                        <div style={{ 
                                            maxHeight: '300px', 
                                            overflowY: 'auto', 
                                            border: '1px solid #dee2e6', 
                                            borderRadius: '0.25rem' 
                                        }}>
                                            {loading ? (
                                                <div className="text-center p-3">
                                                    <div className="spinner-border spinner-border-sm" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                    <span className="ms-2">Loading gauges...</span>
                                                </div>
                                            ) : filteredGauges.length > 0 ? (
                                                <div className="list-group list-group-flush">
                                                    {filteredGauges.map(gauge => (
                                                        <div
                                                            key={gauge.id}
                                                            className={`list-group-item list-group-item-action ${selectedGauge?.id === gauge.id ? 'active' : ''}`}
                                                            onClick={() => handleGaugeSelect(gauge)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="d-flex w-100 justify-content-between">
                                                                <h6 className="mb-1">{gauge.name}</h6>
                                                                <small>ID: {gauge.id}</small>
                                                            </div>
                                                            {gauge.location && gauge.location !== 'Location not available' && (
                                                                <small className="d-block text-muted">{gauge.location}</small>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center p-3 text-muted">
                                                    No gauges found matching your search.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedGauge && (
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h5 className="card-title">Selected Gauge</h5>
                                            <p className="mb-1 py-2 pb-5"><strong>{selectedGauge.name}</strong></p>
                                            <div className="mb-3">
                                                <label htmlFor="displayName" className="form-label"><strong>Display Name</strong></label>
                                                <input
                                                    type="text"
                                                    className="form-control mb-2"
                                                    id="displayName"
                                                    value={displayName}
                                                    onChange={handleDisplayNameChange}
                                                    placeholder="Enter a custom display name (Optional)"
                                                />
                                                <div className="form-group mb-3">
                                                    <label className="form-label"><strong>Unit</strong></label>
                                                    <div className="btn-group w-100" role="group">
                                                        <button
                                                            type="button"
                                                            className={`btn btn-outline-primary ${unit === 'ft' ? 'active' : ''}`}
                                                            onClick={() => setUnit('ft')}
                                                        >
                                                            Feet (ft)
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-outline-primary ${unit === 'cfs' ? 'active' : ''}`}
                                                            onClick={() => setUnit('cfs')}
                                                        >
                                                            CFS (cubic ft/s)
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="row mb-3">
                                                    <div className="col">
                                                        <label htmlFor="minFlow" className="form-label">
                                                            <strong>Min Runnable Flow ({unit})</strong>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id="minFlow"
                                                            value={minFlow}
                                                            onChange={(e) => setMinFlow(e.target.value === '' ? '' : Number(e.target.value))}
                                                            placeholder="Optional"
                                                            min="0"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                    <div className="col">
                                                        <label htmlFor="maxFlow" className="form-label">
                                                            <strong>Max Runnable Flow ({unit})</strong>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            id="maxFlow"
                                                            value={maxFlow}
                                                            onChange={(e) => setMaxFlow(e.target.value === '' ? '' : Number(e.target.value))}
                                                            placeholder="Optional"
                                                            min="0"
                                                            step="0.1"
                                                        />
                                                    </div>
                                                    <p className="text-muted">
                                                    Set flow ranges to enable color-coded status indicators
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                className="btn btn-primary w-100" 
                                                onClick={handleAddGauge} 
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                        Adding...
                                                    </>
                                                ) : 'Add to Dashboard'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
