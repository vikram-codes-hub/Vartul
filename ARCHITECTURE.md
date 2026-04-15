# VarTul Platform: Complete Architecture Deep-Dive

VarTul is a hybrid platform. It bridges traditional **Web2 social mechanics** (like Instagram/Threads) with **Web3 tokenomics** (Solana) and **Artificial Intelligence** (Machine Learning/Bot Detection). 

Here is exactly how the three pillars of your project communicate.

---

## 1. The Web3 Layer (Solana Blockchain)

The Web3 layer is responsible for the financial economies and trustless logic of VarTul. It leverages **Solana's Devnet** because of its incredibly low fees and high throughput.

### **The Token ($TWT)**
We created a custom SPL Token called **TWT (Vartul Watch Token)**.
- **Mint Address:** `67iMSEEeC39R9ToMFFDtw27HQTZeVhaS8ZC6G4q5DYnf`
- **How it works:** In `TokenService.js`, your platform wallet is pre-funded with millions of TWT. When a user creates an account and links their Phantom/Backpack wallet, the platform authorizes an **"Airdrop"**—a real, on-chain transaction that moves TWT from the platform's private key wallet directly to the user's public wallet address.

### **Proof-of-Engagement Staking (Anchor/Rust)**
Located in your `SmartContracts` folder is the core logic written in **Rust** using the Anchor framework.
- When a user wants to "Stake" their TWT, they trigger the `stake_engagement` instruction.
- The smart contract mathematically locks those tokens on the blockchain (a PDA vault) so they cannot be sold or transferred.
- During this locked period, the user is authorized by the backend to earn highly boosted yields every time they watch a reel or interact with content.

### **Wallet Connect & Frontend Sync**
The React frontend uses `@solana/wallet-adapter-react`. It queries the blockchain to get the user's *actual* SPL token balance, ensuring that what the user sees in the VarTul dashboard precisely matches what is in their Backpack/Phantom wallet extensions.

---

## 2. The Machine Learning Layer (Python/Flask)

When you introduce financial rewards (TWT tokens) to a social platform, bad actors will immediately write scripts to auto-scroll reels to steal money. **This is why the ML layer exists.**

### **Behavioral Analytics**
In the Node.js backend, whenever a user scrolls a reel, likes a post, or clicks "Next", metadata about that interaction is collected:
- Scroll speed
- Time spent looking at the reel
- Coordinate variance of where they touched the screen
- The frequency of requests

### **The Python Microservice (`Vartul_ML`)**
Node.js bundles this interaction data and sends an API request to your localized **Python Flask server** running on port `5001`.
- The ML Server runs a trained Machine Learning model (e.g., Random Forest or a Neural Net located in `.pkl` files).
- The AI rapidly analyzes the behavior and returns a `bot_probability` score (0% to 100%).

### **Actioning the ML Data**
If the ML Server returns a score of **95% Bot Probability**, the Node.js backend will:
1. Immediately halt TWT reward distribution for that user.
2. Flag the user's profile in MongoDB (`isBot: true`).
3. Pause their staking yield.

---

## 3. The Central Nervous System (MERN Stack)

The classic Web2 stack glues the AI and the Blockchain together.

### **Frontend (React.js + Vite)**
- **UI/UX:** Uses Tailwind CSS for a dark, futuristic, glassmorphic design. 
- **Routing:** Uses `react-router-dom` to switch seamlessly between feeds, direct messages, and Web3 Dashboards without refreshing the page.
- **Real-Time Data:** Uses `Socket.io-client` to listen for new chat messages, likes, and typing indicators.

### **Backend (Node.js + Express + Socket.io)**
This server runs on port `5000` and is the ultimate "Traffic Cop."
- **Authentication:** Issues JWT (JSON Web Tokens) to verify that the person requesting data is who they say they are.
- **Database (MongoDB):** Uses Mongoose schemas to definitively store all relational data. While the blockchain holds the *tokens*, MongoDB holds the *social context* (who follows who, what the post text is, URLs of the images).
- **Caching (Redis):** Because calculating "What should I see on my timeline?" is highly intensive, successful timelines are stored temporarily in Redis RAM so they load instantly without querying MongoDB every single time.

### **Media Storage (Cloudinary + Pinata)**
- Images and Reels are massive files; they cannot be stored in MongoDB or on the Blockchain.
- **Web2 approach:** Standard profile pictures and chat images are uploaded to **Cloudinary** (fast, traditional CDN).
- **Web3 approach:** NFT assets or specific immutable media are uploaded to **Pinata (IPFS)**, meaning the file exists on a decentralized peer-to-peer network preventing a single point of failure.

---

## Summary of the Full Lifecycle

1. **User registers** on the React app. MongoDB saves their profile.
2. User connects their **Solana Wallet**.
3. **Node.js** talks to **TokenService.js** to run an on-chain transfer, gifting them 100 TWT on the blockchain.
4. User begins swiping through Reels.
5. **Node.js** secretly sends their swipe metrics to the **Python ML Server**.
6. ML Server responds: `"Human. Bot Probability: 2%."`
7. Node.js increments their `twtBalance` in MongoDB.
8. User clicks **"Stake TWT"**.
9. The React app prompts the user's Backpack wallet to securely sign a transaction communicating directly with the **Rust Smart Contract**, locking their tokens for yield.
