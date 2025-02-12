export interface Transaction {
    ref: string
    type: "Deposit" | "Withdraw"
    method: string
    currency: string
    amount: number
    date: string
    status: "Failed" | "Success" | "Pending"
  }
  
  export interface AnalyticsData {
    month: string
    deposits: number
    withdrawals: number
  }
  
  