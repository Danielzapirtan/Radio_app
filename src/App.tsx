import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Search, 
  Radio, 
  Globe, 
  Heart, 
  History,
  TrendingUp,
  Music,
  Info,
  ChevronRight,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Station {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  votes: number;
  codec: string;
  bitrate: number;
}

const API_BASE = 'https://de1.api.radio-browser.info/json';

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'top' | 'search' | 'favorites'>('top');
  const [favorites, setFavorites] = useState<Station[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem('sonicstream_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites', e);
      }
    }
  }, []);

  // Save favorites to local storage
  useEffect(() => {
    localStorage.setItem('sonicstream_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch top stations on mount
  useEffect(() => {
    fetchTopStations();
  }, []);

  const fetchTopStations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/stations/topvote/50`);
      if (!response.ok) throw new Error('Failed to fetch stations');
      const data = await response.json();
      setStations(data);
    } catch (err) {
      setError('Could not load radio stations. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const searchStations = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setActiveTab('search');
    try {
      const response = await fetch(`${API_BASE}/stations/byname/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setStations(data);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayStation = (station: Station) => {
    if (currentStation?.stationuuid === station.stationuuid) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = station.url_resolved;
        audioRef.current.play().catch(err => {
          console.error('Playback error:', err);
          setError('This station is currently unavailable.');
          setIsPlaying(false);
        });
      }
    }
  };

  const toggleFavorite = (station: Station) => {
    setFavorites(prev => {
      const isFav = prev.find(f => f.stationuuid === station.stationuuid);
      if (isFav) {
        return prev.filter(f => f.stationuuid !== station.stationuuid);
      } else {
        return [...prev, station];
      }
    });
  };

  const isFavorite = (station: Station) => {
    return favorites.some(f => f.stationuuid === station.stationuuid);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  return (
    <div className="flex flex-col h-screen bg-radio-bg text-white overflow-hidden font-sans">
      {/* Audio element */}
      <audio 
        ref={audioRef} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setError('Playback error. The stream might be offline.');
          setIsPlaying(false);
        }}
      />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-radio-bg/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-radio-accent rounded-xl flex items-center justify-center shadow-lg shadow-radio-accent/20">
            <Radio className="text-black w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SonicStream</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-radio-text-muted uppercase tracking-widest font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-radio-accent animate-pulse"></span>
              Live Global Tuner
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              searchStations(searchQuery);
            }}
            className="relative group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-radio-text-muted group-focus-within:text-radio-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search stations, genres, countries..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-radio-accent/50 focus:border-radio-accent/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
            <History className="w-5 h-5 text-radio-text-muted" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-radio-accent to-emerald-600 flex items-center justify-center text-xs font-bold text-black">
            AZ
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 flex flex-col py-6 px-4 gap-8 bg-black/20">
          <nav className="space-y-1">
            <p className="px-4 text-[10px] uppercase tracking-widest text-radio-text-muted font-bold mb-3">Library</p>
            <button 
              onClick={() => {
                setActiveTab('top');
                fetchTopStations();
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'top' ? 'bg-radio-accent text-black font-semibold' : 'text-radio-text-muted hover:text-white hover:bg-white/5'}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Top Stations</span>
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${activeTab === 'favorites' ? 'bg-radio-accent text-black font-semibold' : 'text-radio-text-muted hover:text-white hover:bg-white/5'}`}
            >
              <Heart className="w-5 h-5" />
              <span>Favorites</span>
            </button>
          </nav>

          <nav className="space-y-1">
            <p className="px-4 text-[10px] uppercase tracking-widest text-radio-text-muted font-bold mb-3">Discover</p>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-radio-text-muted hover:text-white hover:bg-white/5 transition-all">
              <Globe className="w-5 h-5" />
              <span>By Country</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-radio-text-muted hover:text-white hover:bg-white/5 transition-all">
              <Music className="w-5 h-5" />
              <span>By Genre</span>
            </button>
          </nav>

          <div className="mt-auto p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-radio-accent" />
              <span className="text-xs font-medium">Network Status</span>
            </div>
            <p className="text-[10px] text-radio-text-muted leading-relaxed">
              Connected to global radio network. High-fidelity stream active.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                  {activeTab === 'top' ? 'Popular Stations' : activeTab === 'favorites' ? 'Your Favorites' : 'Search Results'}
                </h2>
                <p className="text-radio-text-muted text-sm">
                  {activeTab === 'top' ? 'Most listened stations around the globe.' : activeTab === 'favorites' ? 'Your handpicked collection of radio streams.' : `Found ${stations.length} stations for "${searchQuery}"`}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors border border-white/10">
                  Filter
                </button>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors border border-white/10">
                  Sort
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
                <WifiOff className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-radio-accent animate-spin" />
                <p className="text-radio-text-muted font-mono text-xs uppercase tracking-widest">Scanning Frequencies...</p>
              </div>
            ) : stations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Radio className="w-8 h-8 text-radio-text-muted" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No stations found</h3>
                <p className="text-radio-text-muted text-sm">Try searching for something else or check your favorites.</p>
              </div>
            ) : (
              <div className="radio-grid">
                <AnimatePresence mode="popLayout">
                  {(activeTab === 'favorites' ? favorites : stations).map((station) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={station.stationuuid}
                      className={`group relative bg-radio-card border border-white/5 rounded-2xl p-4 hover:border-radio-accent/30 transition-all duration-300 cursor-pointer ${currentStation?.stationuuid === station.stationuuid ? 'ring-1 ring-radio-accent/50 bg-radio-accent/5' : ''}`}
                      onClick={() => handlePlayStation(station)}
                    >
                      <div className="relative aspect-square mb-4 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center group-hover:shadow-2xl group-hover:shadow-radio-accent/10 transition-all">
                        {station.favicon ? (
                          <img 
                            src={station.favicon} 
                            alt={station.name} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/radio/200/200';
                            }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Radio className="w-12 h-12 text-white/10" />
                        )}
                        
                        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${currentStation?.stationuuid === station.stationuuid && isPlaying ? 'opacity-100' : ''}`}>
                          <div className="w-12 h-12 bg-radio-accent rounded-full flex items-center justify-center text-black shadow-xl">
                            {currentStation?.stationuuid === station.stationuuid && isPlaying ? (
                              <Pause className="w-6 h-6 fill-current" />
                            ) : (
                              <Play className="w-6 h-6 fill-current ml-1" />
                            )}
                          </div>
                        </div>

                        {currentStation?.stationuuid === station.stationuuid && isPlaying && (
                          <div className="absolute bottom-2 right-2 flex gap-0.5 items-end h-4">
                            <div className="w-1 bg-radio-accent animate-[bounce_1s_infinite_0.1s]"></div>
                            <div className="w-1 bg-radio-accent animate-[bounce_1s_infinite_0.3s]"></div>
                            <div className="w-1 bg-radio-accent animate-[bounce_1s_infinite_0.2s]"></div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate group-hover:text-radio-accent transition-colors">{station.name}</h3>
                          <p className="text-[10px] text-radio-text-muted truncate uppercase tracking-wider mt-0.5">
                            {station.country || 'Global'} • {station.tags?.split(',')[0] || 'Music'}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(station);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${isFavorite(station) ? 'text-radio-accent bg-radio-accent/10' : 'text-radio-text-muted hover:text-white hover:bg-white/10'}`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(station) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Player Bar */}
      <footer className="h-24 bg-black border-t border-white/10 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 w-1/3">
          <div className="w-14 h-14 bg-white/5 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
            {currentStation?.favicon ? (
              <img 
                src={currentStation.favicon} 
                alt={currentStation.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Radio className="w-6 h-6 text-white/20" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm truncate">{currentStation?.name || 'Select a station'}</h4>
            <p className="text-xs text-radio-text-muted truncate">
              {currentStation ? `${currentStation.country} • ${currentStation.bitrate}kbps ${currentStation.codec}` : 'Ready to stream'}
            </p>
          </div>
          {currentStation && (
            <button 
              onClick={() => toggleFavorite(currentStation)}
              className={`ml-2 p-2 rounded-full transition-colors ${isFavorite(currentStation) ? 'text-radio-accent' : 'text-radio-text-muted hover:text-white'}`}
            >
              <Heart className={`w-5 h-5 ${isFavorite(currentStation) ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 w-1/3">
          <div className="flex items-center gap-6">
            <button className="text-radio-text-muted hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={() => {
                if (currentStation) {
                  if (isPlaying) {
                    audioRef.current?.pause();
                  } else {
                    audioRef.current?.play();
                  }
                  setIsPlaying(!isPlaying);
                }
              }}
              disabled={!currentStation}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentStation ? 'bg-white text-black hover:scale-105 active:scale-95' : 'bg-white/10 text-white/20 cursor-not-allowed'}`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="text-radio-text-muted hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-[10px] font-mono text-radio-text-muted w-10 text-right">LIVE</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative">
              {isPlaying && (
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-radio-accent/30"
                />
              )}
              <div className={`h-full bg-radio-accent transition-all duration-500 ${isPlaying ? 'w-full' : 'w-0'}`} />
            </div>
            <span className="text-[10px] font-mono text-radio-text-muted w-10">∞</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/3">
          <div className="flex items-center gap-2 group">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-radio-text-muted hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div 
                className="h-full bg-white group-hover:bg-radio-accent transition-colors" 
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} 
              />
            </div>
          </div>
          <button className="p-2 text-radio-text-muted hover:text-white transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
