// Internet Radio Receiver App - Complete React Component
// Test this on CodePen: https://codepen.io/pen?template=xxByBQP

import React, { useState, useEffect, useRef } from 'react';

/**
 * Main Radio App Component
 * Features: station list, search/filter, play/pause, volume control
 */
const RadioApp = () => {
  // ========== STATE MANAGEMENT ==========
  // All stations fetched from API
  const [stations, setStations] = useState([]);
  // Filtered stations based on search
  const [filteredStations, setFilteredStations] = useState([]);
  // Currently selected station
  const [currentStation, setCurrentStation] = useState(null);
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  // Loading state for UX
  const [isLoading, setIsLoading] = useState(true);
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  // Selected genre filter
  const [selectedGenre, setSelectedGenre] = useState('all');
  // Volume level (0-1)
  const [volume, setVolume] = useState(0.7);
  // Error state for user feedback
  const [error, setError] = useState(null);

  // ========== REFS ==========
  // Audio element reference for direct DOM manipulation
  const audioRef = useRef(null);
  // Track if component is mounted to prevent memory leaks
  const isMounted = useRef(true);

  // ========== SAMPLE RADIO STATIONS DATA ==========
  // In a real app, this would come from an API
  // Using RadioBrowser API (public, no API key needed)
  const defaultStations = [
    {
      id: 1,
      name: "NTS Radio",
      streamUrl: "https://stream-relay-geo.ntslive.net/stream",
      genre: "electronic",
      tags: ["electronic", "experimental", "mixed"],
      country: "UK",
      favicon: "https://www.nts.live/favicon.ico"
    },
    {
      id: 2,
      name: "Jazz 24",
      streamUrl: "https://jazz24.streamguys1.com/live",
      genre: "jazz",
      tags: ["jazz", "smooth"],
      country: "USA",
      favicon: "https://jazz24.org/favicon.ico"
    },
    {
      id: 3,
      name: "Classic FM",
      streamUrl: "https://icecast.omroep.nl/radio4-bb-mp3",
      genre: "classical",
      tags: ["classical", "orchestra"],
      country: "Netherlands",
      favicon: "https://www.classicfm.com/favicon.ico"
    },
    {
      id: 4,
      name: "BBC Radio 1",
      streamUrl: "http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one",
      genre: "pop",
      tags: ["pop", "top40", "charts"],
      country: "UK",
      favicon: "https://www.bbc.co.uk/favicon.ico"
    },
    {
      id: 5,
      name: "SomaFM Groove Salad",
      streamUrl: "https://ice.somafm.com/groovesalad",
      genre: "ambient",
      tags: ["ambient", "chill", "electronic"],
      country: "USA",
      favicon: "https://somafm.com/favicon.ico"
    }
  ];

  // ========== INITIALIZATION ==========
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Load stations (simulated API call)
    const loadStations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In production, you'd fetch from a real API like:
        // const response = await fetch('https://de1.api.radio-browser.info/json/stations/search?limit=20');
        // const data = await response.json();
        
        if (isMounted.current) {
          setStations(defaultStations);
          setFilteredStations(defaultStations);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted.current) {
          setError('Failed to load stations. Please try again.');
          setIsLoading(false);
        }
      }
    };

    loadStations();

    // Cleanup function
    return () => {
      isMounted.current = false;
      // Stop audio when component unmounts
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []); // Empty deps array = run once on mount

  // ========== FILTER STATIONS ==========
  useEffect(() => {
    // Filter stations based on search query and genre
    let filtered = stations;
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply genre filter
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(station => 
        station.genre === selectedGenre || 
        station.tags.includes(selectedGenre)
      );
    }
    
    setFilteredStations(filtered);
  }, [searchQuery, selectedGenre, stations]);

  // ========== EXTRACT UNIQUE GENRES ==========
  const genres = ['all', ...new Set(stations.flatMap(station => [station.genre, ...station.tags]))];

  // ========== AUDIO CONTROL FUNCTIONS ==========
  
  /**
   * Play a selected station
   * @param {object} station - Station object to play
   */
  const playStation = (station) => {
    try {
      // Stop current playback if any
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Set new station
      setCurrentStation(station);
      
      // Set up new audio source
      audioRef.current.src = station.streamUrl;
      audioRef.current.volume = volume;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch(err => {
          console.error('Playback failed:', err);
          setError(`Cannot play ${station.name}. The stream might be unavailable.`);
          setIsPlaying(false);
        });
    } catch (err) {
      setError('Failed to start playback');
    }
  };

  /**
   * Toggle play/pause for current station
   */
  const togglePlayPause = () => {
    if (!currentStation) {
      // If no station selected, play the first one
      if (filteredStations.length > 0) {
        playStation(filteredStations[0]);
      }
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          setError('Playback failed. Try another station.');
        });
    }
  };

  /**
   * Stop playback and reset
   */
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  /**
   * Handle volume change
   * @param {object} e - Input change event
   */
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // ========== RENDER UI ==========
  return (
    <div className="radio-app">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />
      
      {/* Header */}
      <header className="app-header">
        <h1>📻 Internet Radio Receiver</h1>
        <p>Listen to free internet radio stations from around the world</p>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Player Controls - Shows when station is playing */}
      {currentStation && (
        <div className="now-playing">
          <div className="player-info">
            <strong>Now Playing:</strong> {currentStation.name}
            <span className="station-meta">{currentStation.country} • {currentStation.genre}</span>
          </div>
          <div className="player-controls">
            <button 
              className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlayPause}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button className="stop-btn" onClick={stopPlayback}>
              ⏹️ Stop
            </button>
            <div className="volume-control">
              <span>🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                aria-label="Volume control"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Search stations or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={selectedGenre} 
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="genre-select"
        >
          {genres.map(genre => (
            <option key={genre} value={genre}>
              {genre.charAt(0).toUpperCase() + genre.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Station List */}
      <div className="station-list">
        <h2>Available Stations {!isLoading && `(${filteredStations.length})`}</h2>
        
        {isLoading ? (
          <div className="loading-spinner">Loading stations...</div>
        ) : filteredStations.length === 0 ? (
          <div className="no-results">
            No stations match your filters. Try adjusting your search.
          </div>
        ) : (
          <div className="stations-grid">
            {filteredStations.map(station => (
              <div 
                key={station.id}
                className={`station-card ${currentStation?.id === station.id ? 'active' : ''}`}
                onClick={() => playStation(station)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && playStation(station)}
              >
                <div className="station-info">
                  <h3>{station.name}</h3>
                  <p className="station-tags">
                    {station.tags.map(tag => `#${tag}`).join(' ')}
                  </p>
                  <p className="station-country">{station.country}</p>
                </div>
                {currentStation?.id === station.id && isPlaying && (
                  <span className="playing-indicator">🔊</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>📚 What you're learning:</h3>
        <ul>
          <li><strong>useState</strong> - Managing app state (stations, playback, filters)</li>
          <li><strong>useEffect</strong> - Loading data, filtering, cleanup</li>
          <li><strong>useRef</strong> - Accessing audio element directly</li>
          <li><strong>Event handling</strong> - Play/pause, volume, search</li>
          <li><strong>Conditional rendering</strong> - Loading states, error messages</li>
        </ul>
      </div>

      {/* Inline Styles - Easy to modify */}
      <style jsx>{`
        .radio-app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .app-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
        }

        .app-header h1 {
          margin: 0;
          font-size: 2.5rem;
        }

        .error-banner {
          background: #ff4444;
          color: white;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-banner button {
          background: none;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .now-playing {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          border: 2px solid #e9ecef;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .station-meta {
          font-size: 0.9rem;
          color: #666;
        }

        .player-controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .play-pause-btn, .stop-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-pause-btn {
          background: #28a745;
          color: white;
        }

        .play-pause-btn.playing {
          background: #ffc107;
          color: #000;
        }

        .stop-btn {
          background: #dc3545;
          color: white;
        }

        .volume-control {
          display: flex;
          align-items: center;
          gap: 5px;
          background: white;
          padding: 5px 10px;
          border-radius: 20px;
          border: 1px solid #dee2e6;
        }

        .volume-control input {
          width: 100px;
        }

        .search-section {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
        }

        .genre-select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1rem;
          min-width: 150px;
        }

        .station-list h2 {
          margin-bottom: 15px;
          color: #333;
        }

        .loading-spinner {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .no-results {
          text-align: center;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 10px;
          color: #666;
        }

        .stations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 15px;
        }

        .station-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .station-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
          border-color: #007bff;
        }

        .station-card.active {
          background: #e3f2fd;
          border-color: #007bff;
        }

        .station-info h3 {
          margin: 0 0 5px 0;
          font-size: 1.1rem;
          color: #333;
        }

        .station-tags {
          margin: 5px 0;
          font-size: 0.85rem;
          color: #666;
        }

        .station-country {
          margin: 0;
          font-size: 0.85rem;
          color: #999;
        }

        .playing-indicator {
          font-size: 1.2rem;
        }

        .instructions {
          margin-top: 40px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          border-left: 4px solid #007bff;
        }

        .instructions ul {
          list-style-type: none;
          padding: 0;
        }

        .instructions li {
          margin: 10px 0;
          padding-left: 20px;
          position: relative;
        }

        .instructions li:before {
          content: "•";
          color: #007bff;
          font-weight: bold;
          position: absolute;
          left: 0;
        }

        @media (max-width: 768px) {
          .app-header h1 {
            font-size: 1.8rem;
          }

          .now-playing {
            flex-direction: column;
            align-items: flex-start;
          }

          .search-section {
            flex-direction: column;
          }

          .genre-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// Export for use in your app
export default RadioApp;

// ========== FOR CODEPEN ==========
// If testing on CodePen, include this:
if (typeof window !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    const { createRoot } = ReactDOM;
    createRoot(root).render(<RadioApp />);
  }
}
