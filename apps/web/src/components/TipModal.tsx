import { useState } from 'react';
import { X } from 'lucide-react';
import type { MarketMoment } from '@wave-ai/shared';
import { api } from '../lib/api';

interface TipModalProps {
  moment: MarketMoment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TipModal({ moment, onClose, onSuccess }: TipModalProps) {
  const [amount, setAmount] = useState('5');
  const [currency, setCurrency] = useState<'USD' | 'ETH' | 'USDC'>('USD');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await api.tip({
        amount: parseFloat(amount),
        currency,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Tip error:', error);
      alert(error.message || 'Failed to process tip');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-black border-2 border-gray-800 p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Tip the DJ</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-12 h-0.5 bg-cyan-400 mb-6"></div>

        <p className="text-gray-500 mb-8 text-sm uppercase tracking-wider">
          Show your appreciation for this {moment.dj.replace('-', ' ').toUpperCase()} moment
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-black border-2 border-gray-800 text-white focus:outline-none focus:border-cyan-400 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full px-4 py-3 bg-black border-2 border-gray-800 text-white focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="USD">USD</option>
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-black border-2 border-gray-800 text-gray-400 font-bold uppercase tracking-wider hover:border-gray-700 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-cyan-400 text-black font-bold uppercase tracking-wider hover:bg-cyan-300 disabled:opacity-50 transition-all border-2 border-cyan-400"
            >
              {isProcessing ? 'Processing...' : 'Send Tip'}
            </button>
          </div>
        </form>

        <div className="w-12 h-0.5 bg-gray-800 mt-6"></div>
        <p className="text-xs text-gray-600 mt-4 uppercase tracking-wider text-center">
          TODO: Connect wallet for onchain payments
        </p>
      </div>
    </div>
  );
}

