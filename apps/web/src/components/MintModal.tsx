import { useState } from 'react';
import { X, Copy } from 'lucide-react';
import type { MarketMoment } from '@wave-ai/shared';
import { api } from '../lib/api';

interface MintModalProps {
  moment: MarketMoment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MintModal({ moment, onClose, onSuccess }: MintModalProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  const handleMint = async () => {
    setIsMinting(true);
    try {
      const result = await api.mintNFT(moment.momentId);
      setMetadata(result.metadata);
      onSuccess();
    } catch (error: any) {
      console.error('Mint error:', error);
      alert(error.message || 'Failed to generate NFT metadata');
    } finally {
      setIsMinting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[9999] overflow-y-auto"
      style={{ 
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="min-h-full flex items-center justify-center p-4">
        <div 
          className="bg-black border-2 border-gray-800 p-8 w-full max-w-2xl rounded-lg my-8"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Mint Market Moment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-12 h-0.5 bg-cyan-400 mb-6"></div>

        {!metadata ? (
          <>
            <p className="text-gray-500 mb-8 text-sm uppercase tracking-wider">
              Create an NFT of this market moment. The metadata will include all market data,
              music parameters, and a reference to the audio file.
            </p>

            <div className="bg-black border-2 border-gray-800 p-6 mb-6">
              <div className="text-xs text-gray-400 space-y-3 uppercase tracking-wider">
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">Instrument:</span>
                  <span className="text-white font-bold">{moment.instrument}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">DJ Style:</span>
                  <span className="text-white font-bold">{moment.dj.replace('-', ' ').toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">Price:</span>
                  <span className="text-white font-bold">${moment.marketData.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">24h Change:</span>
                  <span className="text-white font-bold">{moment.marketData.priceChangePercent24h.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between border-b border-gray-800 pb-2">
                  <span className="text-gray-500">Tempo:</span>
                  <span className="text-white font-bold">{moment.musicParams.tempo} BPM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Scale:</span>
                  <span className="text-white font-bold">{moment.musicParams.scale.toUpperCase()} ({moment.musicParams.key})</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-black border-2 border-gray-800 text-gray-400 font-bold uppercase tracking-wider hover:border-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                disabled={isMinting}
                className="flex-1 px-6 py-3 bg-cyan-400 text-black font-bold uppercase tracking-wider hover:bg-cyan-300 disabled:opacity-50 transition-all border-2 border-cyan-400"
              >
                {isMinting ? 'Generating...' : 'Generate NFT Metadata'}
              </button>
            </div>

            <div className="w-12 h-0.5 bg-gray-800 mt-6"></div>
            <p className="text-xs text-gray-600 mt-4 uppercase tracking-wider text-center">
              TODO: Implement onchain minting with wallet connection
            </p>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-black border-2 border-cyan-400 p-6">
              <p className="text-cyan-400 font-bold mb-2 uppercase tracking-wider">✓ NFT Metadata Generated</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Metadata has been created. In production, this would be minted onchain.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">
                Metadata JSON
              </label>
              <div className="relative">
                <pre className="bg-black border-2 border-gray-800 p-4 text-xs text-gray-400 overflow-x-auto max-h-64 font-mono">
                  {JSON.stringify(metadata, null, 2)}
                </pre>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(metadata, null, 2))}
                  className="absolute top-3 right-3 p-2 bg-gray-800 border border-gray-700 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-cyan-400 text-black font-bold uppercase tracking-wider hover:bg-cyan-300 transition-all border-2 border-cyan-400"
            >
              Close
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

