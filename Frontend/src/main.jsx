import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ChatContextProvider from './Context/Chat.jsx'
import { Provider } from 'react-redux'
import { store } from './store'
import UserContextProvider from './Context/Usercontext.jsx'
import { PostProvider } from './Context/PostContext.jsx'
import StoryContextProvider from './Context/StoryContext.jsx'

// Solana wallet adapter
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

const network = WalletAdapterNetwork.Devnet
const endpoint = clusterApiUrl(network)
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()]

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <BrowserRouter>
              <UserContextProvider>
                <PostProvider>
                  <StoryContextProvider>
                    <ChatContextProvider>
                      <App />
                    </ChatContextProvider>
                  </StoryContextProvider>
                </PostProvider>
              </UserContextProvider>
            </BrowserRouter>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </Provider>
  </StrictMode>,
)
