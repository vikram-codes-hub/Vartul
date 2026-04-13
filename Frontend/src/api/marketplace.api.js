import axiosInstance from '../Utils/axiosInstance';

const MOCK_ITEMS = [
  {
    itemId: 'item_1',
    name: 'Exclusive Creator Badge',
    priceTWT: 50,
    sellerWallet: 'Address1...',
    ipfsImage: 'https://via.placeholder.com/150/0000FF/808080?Text=Badge',
  },
  {
    itemId: 'item_2',
    name: 'Profile Spotlight (24h)',
    priceTWT: 100,
    sellerWallet: 'Address2...',
    ipfsImage: 'https://via.placeholder.com/150/FF0000/FFFFFF?Text=Spotlight',
  },
  {
    itemId: 'item_3',
    name: 'Custom Theme Pack',
    priceTWT: 25,
    sellerWallet: 'Address3...',
    ipfsImage: 'https://via.placeholder.com/150/00FF00/000000?Text=Theme',
  }
];

export const fetchMarketplaceItems = async () => {
  try {
    // return await axiosInstance.get('/marketplace/items');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: MOCK_ITEMS });
      }, 500);
    });
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    throw error;
  }
};

export const notifyPurchase = async (purchaseData) => {
  try {
    // purchaseData: { itemId, txHash, buyerWallet, priceTWT }
    // return await axiosInstance.post('/marketplace/purchase/notify', purchaseData);
    console.log("Notifying backend of purchase:", purchaseData);
    return Promise.resolve({ success: true });
  } catch (error) {
    console.error("Error notifying purchase:", error);
    throw error;
  }
};
