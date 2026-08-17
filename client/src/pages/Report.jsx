import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { reportFare } from '../services/api';

export default function Report() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!state?.pickup || !state?.destination) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reportFare({
        pickupName: state.pickup.name,
        destinationName: state.destination.name,
        pickupCoords: state.pickup.coords,
        destinationCoords: state.destination.coords,
        amount: Number(amount)
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/result', { 
          replace: true, 
          state: { pickup: state.pickup, destination: state.destination } 
        });
      }, 2000);
    } catch (err) {
      setError('Failed to report fare. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
        <CheckCircle className="w-16 h-16 text-primary-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reported Successfully</h2>
        <p className="text-gray-500 font-medium text-center">Thank you for helping the community!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-50">
      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-gray-100 hover:bg-gray-50 text-gray-700 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 text-[17px] font-bold text-gray-900 tracking-tight">Report Actual Fare</h1>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-8">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Route</div>
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
            <div className="font-bold text-gray-900 text-[15px] leading-tight truncate">{state.pickup.name}</div>
            <div className="text-sm text-gray-500 mt-1 flex items-center font-medium">
              to <span className="font-semibold text-gray-700 ml-1 truncate">{state.destination.name}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 mb-4 px-1">What did you actually pay?</label>
            <div className="relative">
              <span className="absolute left-5 top-[18px] text-gray-400 font-bold text-2xl">₹</span>
              <input
                type="number"
                pattern="[0-9]*"
                autoFocus
                className="w-full bg-white border border-gray-100 shadow-sm rounded-[2rem] py-5 pl-12 pr-6 text-gray-900 focus:ring-2 focus:border-transparent focus:ring-primary-500 font-black text-4xl transition-all"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-semibold mt-3 px-2 flex items-center"><ArrowLeft className="w-4 h-4 mr-1 inline" /> {error}</p>}
          </div>

          <div className="mt-auto pb-6 pt-4">
            <button 
              type="submit"
              disabled={loading || !amount}
              className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-xl shadow-gray-900/10 active:scale-[0.98] transition-transform flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Fare'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
