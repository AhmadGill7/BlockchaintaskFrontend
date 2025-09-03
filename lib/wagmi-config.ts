import { http } from "viem";
import { createConfig } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

// BSC Testnet configuration - ONLY ALLOWED CHAIN
export const REQUIRED_CHAIN = bscTestnet;
export const REQUIRED_CHAIN_ID = bscTestnet.id; // 97

export const wagmiConfig = createConfig({
  chains: [bscTestnet], // Only BSC testnet allowed
  connectors: [
    injected(),
    metaMask()
  ],
  transports: {
    [bscTestnet.id]: http(),
  },
});
