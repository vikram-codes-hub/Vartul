import React, { useState, useEffect } from 'react';
import { fetchMarketplaceItems, notifyPurchase } from '../../api/marketplace.api';
import PurchaseModal from './PurchaseModal';
import { ShoppingBag } from 'lucide-react';

const resolveImage = (url) => {
  if (!url) return null;
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  return url;
};

const ItemImage = ({ src, alt }) => {
  const [errored, setErrored] = useState(false);
  const resolved = resolveImage(src);

  if (!resolved || errored) {
    return (
      <div className="w-full h-56 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/60 to-indigo-950/60 border-b border-white/5">
        <ShoppingBag className="w-10 h-10 text-purple-500/40 mb-2" />
        <span className="text-xs text-gray-600">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setErrored(true)}
    />
  );
};

const MarketplaceSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const response = await fetchMarketplaceItems();
        setItems(response.data);
      } catch (error) {
        console.error("Failed to load marketplace items", error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const handlePurchaseConfirm = async (item, txHash) => {
    try {
      await notifyPurchase({
        itemId: item.itemId,
        txHash,
        priceTWT: item.priceTWT,
        buyerWallet: 'Me'
      });
      alert(`Successfully purchased ${item.name}!`);
    } catch (error) {
      console.error("Purchase notification failed", error);
      alert("Purchase failed on backend.");
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Marketplace</h2>
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1 transition">
          View All
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
          <ShoppingBag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No items available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-900/10 group"
            >
              <div className="relative overflow-hidden">
                <ItemImage src={item.ipfsImage} alt={item.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 pointer-events-none" />
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center border border-gray-700 hover:bg-purple-600/80 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-white text-lg mb-1">{item.name}</h3>
                <p className="text-sm text-purple-300 font-medium mb-5">{item.priceTWT} TWT</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg shadow-lg shadow-blue-900/20 transition-all duration-300"
                  >
                    BUY NOW
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-300">
                    DETAILS
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PurchaseModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onConfirm={handlePurchaseConfirm}
        item={selectedItem}
      />
    </div>
  );
};

export default MarketplaceSection;