import React, { useState } from 'react';
import { RiverLevel } from '../models/RiverLevel';

// Helper function to format the trend value
const formatTrendValue = (value: number, unit: string, isRising: boolean) => {
    if (value === 0) return 'Flat';
    const rounded = Math.abs(value) < 0.1 ? value.toFixed(3) : value.toFixed(1);
    const arrow = isRising ? '↑' : '↓';
    return `${arrow} ${rounded} ${unit}/hr`;
};

interface RiverLevelsTableProps {
    riverLevels: RiverLevel[];
    onDelete: (index: number) => void;
}

export const RiverLevelsTable = ({ riverLevels, onDelete }: RiverLevelsTableProps) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [riverToDelete, setRiverToDelete] = useState<number | null>(null);

    const handleRowClick = (index: number) => {
        setRiverToDelete(index);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (riverToDelete !== null) {
            onDelete(riverToDelete);
            setShowDeleteModal(false);
            setRiverToDelete(null);
        }
    };

    const handleCloseModal = () => {
        setShowDeleteModal(false);
        setRiverToDelete(null);
    };

    if (riverLevels.length === 0) {
        return (
            <div className="alert alert-info m-2">
                No river levels available. Add a river to get started.
            </div>
        );
    }

    return (
        <>
            <div className="table-responsive">
                <table className="table table-striped table-hover m-0">
                    <thead className="table-light">
                        <tr>
                            <th>River Name</th>
                            <th className="text-end">Level</th>
                            <th className="text-end">Trend</th>
                            <th className="text-end">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {riverLevels.map((river, index) => {
                            // Determine the badge class based on water level relative to min/max flow
                            let badgeClass = 'bg-primary'; // Default color
                            const hasMinFlow = typeof river.minFlow === 'number';
                            const hasMaxFlow = typeof river.maxFlow === 'number';
                            
                            console.log(`River: ${river.name}`, {
                                level: river.waterLevel,
                                minFlow: river.minFlow,
                                maxFlow: river.maxFlow,
                                hasMinFlow,
                                hasMaxFlow
                            });
                            
                            if (hasMinFlow && river.waterLevel < river.minFlow!) {
                                badgeClass = 'bg-danger';
                                console.log(`${river.name}: Below min flow (${river.waterLevel} < ${river.minFlow})`);
                            } else if (hasMaxFlow && river.waterLevel > river.maxFlow!) {
                                badgeClass = 'bg-danger';
                                console.log(`${river.name}: Above max flow (${river.waterLevel} > ${river.maxFlow})`);
                            } else if ((hasMinFlow && hasMaxFlow) && 
                                     (river.waterLevel >= river.minFlow! && river.waterLevel <= river.maxFlow!)) {
                                badgeClass = 'bg-success';
                                console.log(`${river.name}: Within flow range (${river.minFlow} ≤ ${river.waterLevel} ≤ ${river.maxFlow})`);
                            } else {
                                console.log(`${river.name}: No flow range set or missing data`);
                            }
                            
                            console.log(`${river.name}: Using badge class:`, badgeClass);
                            
                            return (
                            <tr 
                                key={index}
                                onClick={() => handleRowClick(index)}
                                style={{ cursor: 'pointer' }}
                                className="hover-highlight"
                            >
                                <td className="align-middle">{river.displayName || river.name}</td>
                                <td className="text-end align-middle">
                                    <span className={`badge ${badgeClass}`}>
                                        {river.unit === 'cfs' 
                                            ? Math.round(river.waterLevel).toLocaleString() 
                                            : river.waterLevel.toFixed(1)} {river.unit}
                                    </span>
                                </td>
                                <td className="text-end align-middle">
                                    {river.trend ? (
                                        <span className={`badge ${river.trend.value === 0 ? 'bg-secondary' : river.trend.isRising ? 'bg-info text-dark' : 'bg-warning text-dark'}`}>
                                            {formatTrendValue(river.trend.value, river.unit, river.trend.isRising)}
                                        </span>
                                    ) : (
                                        <span className="badge bg-secondary">No trend data</span>
                                    )}
                                </td>
                                <td className="text-end text-muted small">
                                    {new Date(river.lastUpdated).toLocaleString()}
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to remove this river from your dashboard?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
