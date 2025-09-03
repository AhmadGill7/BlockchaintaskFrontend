// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-vert-xi-76.vercel.app/api'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  token?: string
}

interface LoginData {
  email: string
  password: string
}

interface SignupData {
  username: string
  email: string
  password: string
  walletAddress?: string
  referralCode?: string
}

class ApiService {
  private getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request error:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(data: LoginData): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async signup(data: SignupData): Promise<ApiResponse> {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // User endpoints
  async getUserProfile(token: string): Promise<ApiResponse> {
    return this.request('/user/profile', {
      headers: this.getHeaders(token),
    })
  }

  async updateUserProfile(token: string, data: any): Promise<ApiResponse> {
    return this.request('/user/profile', {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    })
  }

  async getUserStats(token: string): Promise<ApiResponse> {
    return this.request('/user/stats', {
      headers: this.getHeaders(token),
    })
  }

  async getReferralStats(token: string): Promise<ApiResponse> {
    return this.request('/user/referral-stats', {
      headers: this.getHeaders(token),
    })
  }

  // Wallet endpoints
  async connectWallet(token: string, walletAddress: string): Promise<ApiResponse> {
    return this.request('/user/connect-wallet', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ walletAddress }),
    })
  }

  // Orders endpoints (if needed)
  async getUserOrders(token: string): Promise<ApiResponse> {
    return this.request('/user/orders', {
      headers: this.getHeaders(token),
    })
  }
}

export const apiService = new ApiService()
export type { LoginData, SignupData, ApiResponse }
