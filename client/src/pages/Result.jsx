import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { calculateFare } from '../services/api';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [driverPrice, setDriverPrice] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!state?.pickup || !state?.destination) {
      navigate('/');
      return;
    }

    async function fetchFare() {
      try {
        const result = await calculateFare(state.pickup.coords, state.destination.coords);
        setData(result);
      } catch (err) {
        // Handle 400/502/503 errors passed from the backend
        if (err.response && err.response.data && err.response.data.error) {
          setErrorMsg(err.response.data.error);
        } else {
          setErrorMsg('An unexpected error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFare();
  }, [state, navigate]);

  const handleCheck = () => {
    const price = Number(driverPrice);
    if (!price || !data?.hasData) return;

    if (price <= data.maxFare + 5) {
      setCheckResult({ type: 'good', message: 'Within usual range', value: price });
    } else {
      setCheckResult({ 
        type: 'bad', 
        message: 'Above usual fare', 
        value: price,
        diff: price - data.maxFare 
      });
    }
  };

  const handleReportNav = () => {
    navigate('/report', { state: { pickup: state.pickup, destination: state.destination } });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Calculating fair fare...</p>
        </div>
      </div>
    );
  }

  // Fatal Error State (e.g. Google API failed, invalid coords)
  if (errorMsg) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="font-bold text-gray-900 ml-2">Error</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to verify route</h2>
          <p className="text-gray-500 font-medium mb-6">{errorMsg}</p>
          <button onClick={() => navigate(-1)} className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center border-b border-gray-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="ml-2 flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{state.pickup.name}</div>
          <div className="text-xs text-gray-500 truncate flex items-center">
            to <span className="font-semibold ml-1 text-gray-700">{state.destination.name}</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Main Result Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Fair Fare</h2>
          
          {!data?.hasData ? (
            <div className="py-6">
              <div className="text-gray-900 font-bold text-lg mb-1">
                {data?.status === 'INSUFFICIENT_DATA' ? 'Insufficient Data' : 'No Data'}
              </div>
              <div className="text-gray-500 font-medium mb-4">
                {data?.status === 'INSUFFICIENT_DATA' 
                  ? `We only have ${data.reportCount} report for this route. We need more data to provide a reliable estimate.`
                  : 'We have no recent fare data for this exact route.'}
              </div>
              <button 
                onClick={handleReportNav}
                className="bg-primary-50 text-primary-700 font-bold py-3 px-6 rounded-xl hover:bg-primary-100 transition-colors inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Report your fare
              </button>
            </div>
          ) : (
            <>
              <div className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight mb-4">
                ₹{data.minFare}–₹{data.maxFare}
              </div>
              
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 font-medium bg-gray-50 py-3 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase font-bold mb-0.5">Average</span>
                  <span className="text-gray-900 font-bold text-base">₹{data.average}</span>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs uppercase font-bold mb-0.5">Distance</span>
                  <span className="text-gray-900 font-bold text-base">{data.distance} km</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 font-medium">Based on {data.reportCount} recent reports</p>
            </>
          )}
        </div>

        {/* Check Driver Price */}
        {data?.hasData && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Driver asking how much?</h3>
            <div className="flex space-x-3 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-4 top-3 text-gray-500 font-bold text-lg">₹</span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  className="w-full bg-gray-50 border-none rounded-xl py-3 pl-8 pr-4 text-gray-900 focus:ring-2 focus:ring-primary-500 font-bold text-lg transition-all"
                  placeholder="0"
                  value={driverPrice}
                  onChange={(e) => {
                    setDriverPrice(e.target.value);
                    setCheckResult(null);
                  }}
                />
              </div>
              <button 
                onClick={handleCheck}
                className="bg-gray-900 text-white font-bold px-6 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Check
              </button>
            </div>

            {/* Check Result */}
            {checkResult && (
              <div className={`p-4 rounded-xl flex items-start border ${checkResult.type === 'good' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                {checkResult.type === 'good' ? (
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-red-600" />
                )}
                <div>
                  <div className="font-bold flex items-center">
                    {checkResult.message}
                  </div>
                  {checkResult.type === 'bad' && (
                    <div className="text-sm mt-1 opacity-90 font-medium">
                      Driver's price is ₹{checkResult.diff} higher than usual.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Reports */}
        {data?.hasData && data.recentReports?.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Recent Reports</h3>
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 divide-y divide-gray-50">
              {data.recentReports.map((report, idx) => (
                <div key={idx} className="flex justify-between items-center py-3 px-4">
                  <div className="font-bold text-gray-900 text-lg">₹{report.amount}</div>
                  <div className="text-sm font-medium text-gray-400 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {report.timeAgo < 60 ? `${report.timeAgo} min ago` : `${Math.round(report.timeAgo / 60)} hr ago`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button for reporting */}
      {data?.hasData && (
        <div className="fixed bottom-6 left-0 right-0 px-4 sm:max-w-md sm:mx-auto">
          <button 
            onClick={handleReportNav}
            className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center text-lg active:scale-[0.98]"
          >
            Report Actual Fare
          </button>
        </div>
      )}
    </div>
  );
}
