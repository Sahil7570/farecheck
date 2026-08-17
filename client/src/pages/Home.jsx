import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, ArrowRight, History, Loader2 } from 'lucide-react';
import { searchLocations } from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [pickupText, setPickupText] = useState('');
  const [destText, setDestText] = useState('');
  
  const [pickupResults, setPickupResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Load history from localStorage
  const history = JSON.parse(localStorage.getItem('routeHistory') || '[]');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (pickupText && !pickup) {
        setIsSearchingPickup(true);
        try {
          const results = await searchLocations(pickupText);
          setPickupResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearchingPickup(false);
        }
      } else {
        setPickupResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pickupText, pickup]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (destText && !destination) {
        setIsSearchingDest(true);
        try {
          const results = await searchLocations(destText);
          setDestResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearchingDest(false);
        }
      } else {
        setDestResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [destText, destination]);

  const handleCheckFare = () => {
    if (pickup && destination) {
      if (pickup.coords.lat === destination.coords.lat && pickup.coords.lng === destination.coords.lng) {
        setErrorMsg('Pickup and destination cannot be the same location.');
        return;
      }
      setErrorMsg('');

      // Save to history
      const newRoute = { pickup, destination, timestamp: Date.now() };
      const updatedHistory = [newRoute, ...history.filter(h => 
        h.pickup.name !== pickup.name || h.destination.name !== destination.name
      )].slice(0, 5); // Keep last 5
      localStorage.setItem('routeHistory', JSON.stringify(updatedHistory));

      navigate('/result', { state: { pickup, destination } });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-10 pb-12 bg-primary-600 text-white rounded-b-[2rem] shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">FareCheck</h1>
        <p className="text-primary-100 mt-1 font-medium text-sm">Know the fair auto fare before you ride.</p>
      </div>

      <div className="px-5 -mt-6 flex-1 pb-8">
        {/* Search Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-xl text-sm border border-red-100 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Pickup */}
          <div className="relative mb-6">
            <div className="flex items-center mb-2">
              <MapPin className="w-4 h-4 text-primary-500 mr-2" />
              <label className="text-sm font-semibold text-gray-700">Pickup</label>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search location..."
                className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400 font-medium"
                value={pickupText}
                onChange={(e) => {
                  setPickupText(e.target.value);
                  if (pickup) setPickup(null);
                }}
              />
              {isSearchingPickup ? (
                <Loader2 className="w-5 h-5 text-gray-400 absolute left-3 top-3 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              )}
            </div>
            {pickupResults.length > 0 && !pickup && (
              <ul className="absolute z-10 w-full bg-white mt-1 rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                {pickupResults.map((loc, idx) => (
                  <li 
                    key={idx}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 font-medium text-gray-800 text-sm"
                    onClick={() => {
                      setPickup(loc);
                      setPickupText(loc.name);
                      setPickupResults([]);
                    }}
                  >
                    {loc.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Destination */}
          <div className="relative mb-8">
            <div className="flex items-center mb-2">
              <MapPin className="w-4 h-4 text-red-500 mr-2" />
              <label className="text-sm font-semibold text-gray-700">Destination</label>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Where are you going?"
                className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-400 font-medium"
                value={destText}
                onChange={(e) => {
                  setDestText(e.target.value);
                  if (destination) setDestination(null);
                }}
              />
              {isSearchingDest ? (
                <Loader2 className="w-5 h-5 text-gray-400 absolute left-3 top-3 animate-spin" />
              ) : (
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              )}
            </div>
            {destResults.length > 0 && !destination && (
              <ul className="absolute z-10 w-full bg-white mt-1 rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                {destResults.map((loc, idx) => (
                  <li 
                    key={idx}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 font-medium text-gray-800 text-sm"
                    onClick={() => {
                      setDestination(loc);
                      setDestText(loc.name);
                      setDestResults([]);
                    }}
                  >
                    {loc.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button 
            disabled={!pickup || !destination}
            onClick={handleCheckFare}
            className="w-full bg-gray-900 text-white font-semibold py-4 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            Check Fair Fare
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          <p className="text-center text-xs text-gray-400 mt-4 font-medium">Based on recent fares reported by riders.</p>
        </div>

        {/* Recent Routes */}
        {history.length > 0 && (
          <div className="px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
              <History className="w-3.5 h-3.5 mr-1.5" />
              Recent Routes
            </h3>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {history.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    setPickup(item.pickup);
                    setPickupText(item.pickup.name);
                    setDestination(item.destination);
                    setDestText(item.destination.name);
                  }}
                  className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="font-bold text-gray-900 text-sm truncate">{item.pickup.name}</div>
                    <div className="text-xs font-medium text-gray-500 flex items-center mt-0.5">
                      <ArrowRight className="w-3 h-3 mx-1 text-gray-300 flex-shrink-0" />
                      <span className="truncate">{item.destination.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
