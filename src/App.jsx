import { useState, useEffect } from 'react';
import { usgsService } from './models/RiverLevel';
import { RiverLevelsTable } from './components/RiverLevelsTable';
import { AddRiver } from './components/AddRiver';
import 'bootstrap/dist/css/bootstrap.min.css';
import riverIcon from '../public/river-svgrepo-com.svg';

// Load saved stations from localStorage
const loadStations = () => {
  const savedStations = localStorage.getItem('riverStations');
  return savedStations ? JSON.parse(savedStations) : [];
};

// Save stations to localStorage
const saveStations = (stations) => {
  localStorage.setItem('riverStations', JSON.stringify(stations));
};

function App() {
  const [riverLevels, setRiverLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Load saved stations on component mount
  useEffect(() => {
    const savedStations = loadStations();
    if (savedStations.length > 0) {
      usgsService.stations = savedStations;
      fetchData();
    } else {
      setLoading(false);
    }
  }, [])

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await usgsService.fetchRiverLevels()
      setRiverLevels(data)
      setError(null)
      return data;
    } catch (err) {
      setError('Failed to fetch river level data')
      console.error('Error fetching data:', err)
      throw err;
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddGauge = async (gauge) => {
    try {
      const newStation = {
        id: gauge.id,
        name: gauge.name,
        displayName: gauge.displayName,
        unit: gauge.unit || 'ft', // Default to 'ft' if not specified
        minFlow: gauge.minFlow,
        maxFlow: gauge.maxFlow
      };
      
      usgsService.stations.push(newStation);
      saveStations(usgsService.stations);
      await fetchData();
    } catch (err) {
      console.error('Error adding gauge:', err);
    }
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <h1 className="mb-4">River Dashboard</h1>
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 mb-0">Loading river level data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <h1 className="mb-4">River Dashboard</h1>
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  const handleDeleteGauge = (index) => {
    try {
      usgsService.stations.splice(index, 1);
      saveStations(usgsService.stations);
      fetchData();
    } catch (err) {
      console.error('Error deleting gauge:', err);
    }
  };

  const handleUpdateGauge = (index, updates) => {
    try {
      // Update the station with the new values
      usgsService.stations[index] = {
        ...usgsService.stations[index],
        ...updates
      };
      saveStations(usgsService.stations);
      fetchData();
    } catch (err) {
      console.error('Error updating gauge:', err);
    }
  };

  return (
    <div className="container position-relative">
      {/* Help Button - Top Right */}
      <button 
        className="btn btn-outline-secondary rounded-circle position-absolute"
        style={{ 
          width: '38px', 
          height: '38px',
          top: '20px',
          right: '20px',
          zIndex: 1000
        }}
        onClick={() => setShowHelpModal(true)}
        aria-label="Help"
        title="Help"
      >
        ?
      </button>
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="text-center mb-4">
            <div className="mb-2">
              <img 
                src={riverIcon} 
                alt="River Icon" 
                style={{ width: '80px', height: '80px' }} 
                className="text-primary"
              />
            </div>
            <h1 className="mb-3">River Dashboard</h1>
            <div className="d-flex justify-content-center">
              <AddRiver onAddGauge={handleAddGauge} />
            </div>
            
            {/* Help Modal */}
            {showHelpModal && (
              <>
                <div 
                  className="modal-backdrop fade show" 
                  onClick={() => setShowHelpModal(false)} 
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                />
                <div 
                  className="modal fade show d-block" 
                  tabIndex="-1" 
                  style={{ display: 'block', zIndex: 1050 }}
                >
                  <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h4 className="modal-title">River Dashboard Help</h4>
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setShowHelpModal(false)} 
                          aria-label="Close"
                        />
                      </div>
                      <div className="modal-body text-start">
                        <h5>About The Site</h5>
                        <div>This site is a simple tool for tracking flows on your favorite rivers</div>
                        <div>River dash will always be free and will never require a login</div>
                        <h5 className="mt-3">Getting Started</h5>
                        <div>Use the <strong>Add River</strong> button to add river gauges to your dashboard.</div>
                        
                        <h5 className="mt-3">Reading the Data</h5>
                        <div>Click on any river to edit its display name or flow thresholds</div>
                        <div>Flow values are shown in either feet (ft) or cubic feet per second (cfs)</div>
                        <div>Trend arrows (⬆️/⬇️) show if water levels are rising or falling</div>
                        
                        <h5 className="mt-3">Color Coding</h5>
                        <div><strong>Level</strong></div>
                        <div><span className="text-success">Green</span>: Water level is within the optimal range</div>
                        <div><span className="text-danger">Red</span>: Water level is outside the optimal range</div>
                        <div><span className="text-primary">Blue</span>: Water level range is not set</div>

                        <div className="mt-2"><strong>Trend</strong></div>
                        <div><span className="text-info">Light Blue</span>: Water level is rising</div>
                        <div><span className="text-secondary">Grey</span>: Water level is stable</div>
                        <div><span className="text-warning">Orange</span>: Water level is falling</div>
                      </div>
                      <div className="modal-footer">
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          onClick={() => setShowHelpModal(false)}
                        >
                          Got it!
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <RiverLevelsTable 
                riverLevels={riverLevels} 
                onDelete={handleDeleteGauge}
                onUpdate={handleUpdateGauge}
              />
            </div>
          </div>
        </div>
      </div> 
      <footer className="mt-3 text-center text-muted small py-3">
        <div>Stream flow data provided by USGS</div>
        <div>ZEhlert Software 2025</div>
        <div className="mt-2">
          <a 
            href="https://www.buymeacoffee.com/zachvehlert" 
            target="_blank" 
            rel="noopener noreferrer"
            className="d-inline-block"
          >
            <img 
              src={`${import.meta.env.BASE_URL}bmc-button.png`}
              alt="Buy me a coffee" 
              style={{ height: '35px', width: 'auto' }}
            />
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
