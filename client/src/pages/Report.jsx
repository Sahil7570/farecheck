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
        navigate('/', { replace: true });
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-4 flex items-center border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Report Actual Fare</h1>
      </div>

      <div className="p-6 flex-1">
        <div className="mb-8">
          <div className="text-sm font-semibold text-gray-400 mb-1">Route</div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="font-bold text-gray-900">{state.pickup.name}</div>
            <div className="text-sm text-gray-500 mt-1">to <span className="font-semibold text-gray-700">{state.destination.name}</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-900 mb-3">What did you actually pay?</label>
            <div className="relative">
              <span className="absolute left-4 top-4 text-gray-500 font-bold text-2xl">₹</span>
              <input
                type="number"
                pattern="[0-9]*"
                autoFocus
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-primary-500 font-bold text-3xl transition-all"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading || !amount}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-md hover:bg-gray-800 transition-colors flex items-center justify-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Fare'}
          </button>
        </form>
      </div>
    </div>
  );
}
