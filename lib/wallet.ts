export interface WalletState {
  address: string | null
  balance: string | null
  chainId: number | null
  isConnected: boolean
}

export class WalletService {
  private static instance: WalletService
  private ethereum: any

  constructor() {
    if (typeof window !== "undefined") {
      this.ethereum = (window as any).ethereum
    }
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService()
    }
    return WalletService.instance
  }

  async isMetaMaskInstalled(): Promise<boolean> {
    return typeof this.ethereum !== "undefined" && this.ethereum.isMetaMask
  }

  async connectWallet(): Promise<WalletState> {
    if (!(await this.isMetaMaskInstalled())) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask.")
      }

      const address = accounts[0]
      const balance = await this.getBalance(address)
      const chainId = await this.getChainId()

      return {
        address,
        balance,
        chainId,
        isConnected: true,
      }
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the connection request.")
      }
      throw new Error(`Failed to connect wallet: ${error.message}`)
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })

      // Convert from wei to ETH
      const balanceInEth = Number.parseInt(balance, 16) / Math.pow(10, 18)
      return balanceInEth.toFixed(4)
    } catch (error) {
      console.error("Error getting balance:", error)
      return "0.0000"
    }
  }

  async getChainId(): Promise<number> {
    try {
      const chainId = await this.ethereum.request({
        method: "eth_chainId",
      })
      return Number.parseInt(chainId, 16)
    } catch (error) {
      console.error("Error getting chain ID:", error)
      return 1 // Default to Ethereum mainnet
    }
  }

  async switchToEthereum(): Promise<void> {
    try {
      await this.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum mainnet
      })
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask
        throw new Error("Ethereum network not found in MetaMask. Please add it manually.")
      }
      throw new Error(`Failed to switch network: ${error.message}`)
    }
  }

  async sendTransaction(to: string, value: string): Promise<string> {
    if (!(await this.isMetaMaskInstalled())) {
      throw new Error("MetaMask is not installed.")
    }

    try {
      const accounts = await this.ethereum.request({
        method: "eth_accounts",
      })

      if (accounts.length === 0) {
        throw new Error("No connected accounts found.")
      }

      // Convert ETH to wei
      const valueInWei = "0x" + (Number.parseFloat(value) * Math.pow(10, 18)).toString(16)

      const transactionHash = await this.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: accounts[0],
            to: to,
            value: valueInWei,
          },
        ],
      })

      return transactionHash
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error("User rejected the transaction.")
      }
      throw new Error(`Transaction failed: ${error.message}`)
    }
  }

  onAccountsChanged(callback: (accounts: string[]) => void): void {
    if (this.ethereum) {
      this.ethereum.on("accountsChanged", callback)
    }
  }

  onChainChanged(callback: (chainId: string) => void): void {
    if (this.ethereum) {
      this.ethereum.on("chainChanged", callback)
    }
  }

  removeAllListeners(): void {
    if (this.ethereum) {
      this.ethereum.removeAllListeners("accountsChanged")
      this.ethereum.removeAllListeners("chainChanged")
    }
  }
}
