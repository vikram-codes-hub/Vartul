/**
 * IPFS / Pinata Integration Service
 * ===================================
 * Uploads files (videos, images) to IPFS via Pinata API.
 * Stores only the IPFS CID (content hash) in MongoDB — the content
 * itself is fully decentralized and tamper-proof.
 *
 * Setup: Set PINATA_API_KEY and PINATA_SECRET_API_KEY in your .env
 * Fallback: If Pinata keys are missing, falls back to returning null.
 *
 * Install: npm install form-data axios
 */

import axios from "axios";
import FormData from "form-data";

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET_API_KEY;
const PINATA_PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";

const isConfigured = () => !!(PINATA_API_KEY && PINATA_SECRET);

/**
 * Upload a file buffer to IPFS via Pinata.
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Original filename (for Pinata metadata)
 * @param {string} contentType - MIME type
 * @returns {Promise<{cid: string, url: string} | null>}
 */
export const uploadFileToIPFS = async (buffer, filename, contentType = "video/mp4") => {
  if (!isConfigured()) {
    console.warn("[IPFS] Pinata not configured — skipping IPFS upload. Set PINATA_API_KEY and PINATA_SECRET_API_KEY.");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("file", buffer, {
      filename,
      contentType,
    });

    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: filename,
        keyvalues: { platform: "vartul", type: contentType.split("/")[0] },
      })
    );

    formData.append(
      "pinataOptions",
      JSON.stringify({ cidVersion: 1 })
    );

    const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const cid = response.data.IpfsHash;
    return {
      cid,
      url: `${IPFS_GATEWAY}/${cid}`,
    };
  } catch (err) {
    console.error("[IPFS] Upload error:", err.response?.data || err.message);
    return null;
  }
};

/**
 * Upload JSON metadata to IPFS (e.g., post metadata, engagement records).
 * @param {object} metadata
 * @param {string} name - Metadata name
 * @returns {Promise<{cid: string, url: string} | null>}
 */
export const uploadMetadataToIPFS = async (metadata, name = "vartul-metadata") => {
  if (!isConfigured()) return null;

  try {
    const response = await axios.post(
      PINATA_PIN_JSON_URL,
      {
        pinataContent: metadata,
        pinataMetadata: { name },
      },
      {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET,
        },
      }
    );

    const cid = response.data.IpfsHash;
    return {
      cid,
      url: `${IPFS_GATEWAY}/${cid}`,
    };
  } catch (err) {
    console.error("[IPFS] Metadata upload error:", err.response?.data || err.message);
    return null;
  }
};

/**
 * Resolve an IPFS CID to a gateway URL.
 * @param {string} cid
 * @returns {string}
 */
export const cidToUrl = (cid) => `${IPFS_GATEWAY}/${cid}`;

/**
 * Check IPFS/Pinata service health.
 * @returns {Promise<boolean>}
 */
export const checkIPFSHealth = async () => {
  if (!isConfigured()) return false;
  try {
    const res = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET,
      },
    });
    return res.status === 200;
  } catch {
    return false;
  }
};

export default {
  uploadFileToIPFS,
  uploadMetadataToIPFS,
  cidToUrl,
  checkIPFSHealth,
  isConfigured,
};
