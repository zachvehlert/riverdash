import React, { useState } from 'react';
import { RiverLevel, UnitType } from '../models/RiverLevel';

// Custom Modal component
const Modal = ({ show, onClose, children }) => {
  if (!show) return null;
  
  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

// Custom Button component
const Button = ({ variant = 'primary', onClick, className = '', children }) => {
  const baseClass = 'btn';
  const variantClass = variant === 'primary' ? 'btn-primary' : 
                      variant === 'secondary' ? 'btn-secondary' :
                      variant === 'outline-danger' ? 'btn btn-outline-danger' : 'btn-primary';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Custom Form components
const Form = ({ children, onSubmit = (e: React.FormEvent) => e.preventDefault() }) => (
  <form onSubmit={onSubmit}>{children}</form>
);

const FormGroup = ({ children, className = '' }) => (
  <div className={`mb-3 ${className}`}>{children}</div>
);

const FormLabel = ({ children }) => (
  <label className="form-label">{children}</label>
);

interface FormControlProps {
  type?: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  className?: string;
  min?: string | number;
  step?: string | number;
}

const FormControl = ({ type = 'text', value, onChange, placeholder, className = '', ...rest }: FormControlProps) => (
  <input 
    type={type}
    className={`form-control ${className}`}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...rest}
  />
);

const FormText = ({ children, className = '' }) => (
  <div className={`form-text ${className}`}>{children}</div>
);

// Modal subcomponents
const ModalHeader = ({ children, onClose }) => (
  <div className="modal-header">
    <h5 className="modal-title">{children}</h5>
    {onClose && (
      <button type="button" className="btn-close" onClick={onClose}></button>
    )}
  </div>
);

const ModalBody = ({ children }) => (
  <div className="modal-body">{children}</div>
);

const ModalFooter = ({ children, className = '' }) => (
  <div className={`modal-footer ${className}`}>{children}</div>
);

// Helper function to format the trend value
const formatTrendValue = (value: number, unit: string, isRising: boolean) => {
    if (value === 0) return 'Flat';
    let formattedValue: string;
    if (unit === 'cfs') {
        // For cfs, round to nearest integer
        formattedValue = Math.round(value).toString();
    } else {
        // For ft, keep the existing decimal formatting
        formattedValue = Math.abs(value) < 0.1 ? value.toFixed(3) : value.toFixed(1);
    }
    const arrow = isRising ? '⬆️' : '⬇️';
    return `${arrow} ${formattedValue} ${unit}/hr`;
};

// Helper function to format time as h:mm AM/PM
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
};

interface RiverLevelsTableProps {
    riverLevels: RiverLevel[];
    onDelete: (index: number) => void;
    onUpdate: (index: number, updates: Partial<RiverLevel>) => void;
}

export const RiverLevelsTable = ({ riverLevels, onDelete, onUpdate }: RiverLevelsTableProps) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRiverIndex, setSelectedRiverIndex] = useState<number | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [unit, setUnit] = useState<UnitType>('cfs');
    const [minFlow, setMinFlow] = useState<string | number>('');
    const [maxFlow, setMaxFlow] = useState<string | number>('');

    const handleRowClick = (index: number) => {
        const river = riverLevels[index];
        setSelectedRiverIndex(index);
        setDisplayName(river.displayName || '');
        setUnit(river.unit || 'cfs');
        setMinFlow(river.minFlow ?? '');
        setMaxFlow(river.maxFlow ?? '');
        setShowEditModal(true);
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setSelectedRiverIndex(null);
        setDisplayName('');
        setUnit('cfs');
        setMinFlow('');
        setMaxFlow('');
    };

    const handleSaveChanges = () => {
        if (selectedRiverIndex !== null) {
            onUpdate(selectedRiverIndex, { 
                displayName: displayName || undefined,
                unit: unit || 'cfs',
                minFlow: minFlow === '' ? undefined : Number(minFlow),
                maxFlow: maxFlow === '' ? undefined : Number(maxFlow)
            });
            handleCloseModal();
        }
    };

    const handleDelete = () => {
        if (selectedRiverIndex !== null) {
            onDelete(selectedRiverIndex);
            handleCloseModal();
        }
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
            <div className="table-responsive rounded shadow-sm">
                <table className="table table-hover m-0">
                    <thead>
                        <tr className="table-light">
                            <th className="border-0 ps-3">River Name</th>
                            <th className="text-end border-0">Level</th>
                            <th className="text-end border-0">Trend</th>
                            <th className="text-end border-0 pe-3">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {riverLevels.map((river, index) => {
                            // Determine the badge class based on water level relative to min/max flow
                            let badgeClass = 'bg-primary'; // Default color
                            const hasMinFlow = typeof river.minFlow === 'number';
                            const hasMaxFlow = typeof river.maxFlow === 'number';
                            
                            if (hasMinFlow && river.waterLevel < river.minFlow!) {
                                badgeClass = 'bg-danger';
                            } else if (hasMaxFlow && river.waterLevel > river.maxFlow!) {
                                badgeClass = 'bg-danger';
                            } else if ((hasMinFlow && hasMaxFlow) && 
                                     (river.waterLevel >= river.minFlow! && river.waterLevel <= river.maxFlow!)) {
                                badgeClass = 'bg-success';
                            }
                            
                            return (
                            <tr 
                                key={index}
                                onClick={() => handleRowClick(index)}
                                style={{ cursor: 'pointer' }}
                                className="hover-highlight"
                            >
                                <td className="align-middle ps-3">{river.displayName || river.name}</td>
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
                                <td className="text-end text-muted small pe-3">
                                    {formatDate(river.lastUpdated)}
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Edit River Modal */}
            <Modal show={showEditModal} onClose={handleCloseModal}>
                <div className="modal-header position-relative">
                    <div className="w-100">
                        <h5 className="modal-title mb-0">River Menu</h5>
                    </div>
                    <button 
                        type="button" 
                        className="btn-close position-absolute" 
                        onClick={handleCloseModal}
                        style={{ top: '1rem', right: '1rem' }}
                    ></button>
                </div>
                <hr className="my-0" />
                <div className="modal-body pt-3">
                    <div className="d-flex justify-content-center mb-3">
                        <Button 
                            variant="outline-primary"
                            onClick={() => {
                                if (selectedRiverIndex !== null) {
                                    const url = `https://waterdata.usgs.gov/monitoring-location/${riverLevels[selectedRiverIndex].id}/#dataTypeId=continuous-${riverLevels[selectedRiverIndex].unit === 'cfs' ? '00060' : '00065'}-0&period=P7D`;
                                    window.open(url, '_blank', 'noopener,noreferrer');
                                }
                            }}
                        >
                            View Gauge on USGS
                        </Button>
                    </div>
                    <Form>
                        <FormGroup>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter a custom display name"
                                className="mb-2"
                            />
                            <FormText className="text-muted mb-3 d-block">
                                Leave blank to use the default name
                            </FormText>

                            <FormLabel>Unit of Measurement</FormLabel>
                            <select 
                                className="form-select mb-3" 
                                value={unit}
                                onChange={(e) => setUnit(e.target.value as UnitType)}
                            >
                                <option value="ft">Feet (ft)</option>
                                <option value="cfs">Cubic Feet per Second (cfs)</option>
                            </select>

                            <div className="row g-2 mb-3">
                                <div className="col">
                                    <FormLabel>Minimum Runnable Flow</FormLabel>
                                    <FormControl
                                        type="number"
                                        value={minFlow}
                                        onChange={(e) => setMinFlow(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Min flow"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                                <div className="col">
                                    <FormLabel>Maximum Runnable Flow</FormLabel>
                                    <FormControl
                                        type="number"
                                        value={maxFlow}
                                        onChange={(e) => setMaxFlow(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="Max flow"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                            <FormText className="text-muted">
                                Set flow ranges to enable color-coded status indicators
                            </FormText>
                        </FormGroup>
                    </Form>
                </div>
                <ModalFooter className="d-flex justify-content-between">
                    <Button variant="outline-danger" onClick={handleDelete}>
                        Delete
                    </Button>
                    <div>
                        <Button variant="secondary" onClick={handleCloseModal} className="me-2">
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSaveChanges}>
                            Save Changes
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>
        </>
    );
};
