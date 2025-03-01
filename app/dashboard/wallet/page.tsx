//app/dashboard/wallet/page.tsx

/*eslint-disable*/

"use client";

import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Wallet, ArrowUpCircle, ArrowDownCircle, Search } from "lucide-react";
import { ActionCard } from "@/components/wallet/ActionCard";
import { TransactionsTable } from "@/components/wallet/TransactionsTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "react-toastify/dist/ReactToastify.css";
import { getAuth } from "firebase/auth";

export default function WalletPage() {
  const [balanceCurrency, setBalanceCurrency] = useState<"KES" | "USD">("KES");
  const [balance, setBalance] = useState<{ KES: number; USD: number }>({ KES: 0, USD: 0 });
  const [frozenBalance, setFrozenBalance] = useState<{ KES: number; USD: number }>({ KES: 0, USD: 0 });
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchBalances = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const resBalance = await fetch(`/api/user/getWalletBalance?uid=${currentUser.uid}`);
        const dataBalance = await resBalance.json();
        if (dataBalance.success) {
          setBalance({
            KES: dataBalance.userKesBalance,
            USD: dataBalance.userUsdBalance,
          });
          setFrozenBalance({
            KES: dataBalance.frozenUserKesBalance,
            USD: dataBalance.frozenUserUsdBalance,
          });
        }
      } catch {
        toast.error("Failed to fetch balances!");
      }
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const handleCurrencyChange = (value: "KES" | "USD") => {
    setBalanceCurrency(value);
    // Optionally, refetch analytics/transactions for the selected currency.
  };

  return (
    <div className="bg-background lg:ml-10 lg:mr-10 min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto p-4">
        <ToastContainer position="top-right" theme="colored" />

        <h1 className="text-3xl font-bold flex items-center text-purple-600 dark:text-purple-400 mb-8">
          <Wallet className="mr-2 h-8 w-8" /> My Wallet
        </h1>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                <span className="flex items-center">Account Balance</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-purple-600 hover:text-orange-500 dark:text-purple-400 dark:hover:text-orange-400 transition-transform duration-300 ease-in-out"
                  onClick={async () => {
                    const icon = document.querySelector("#refresh-icon");
                    if (icon) {
                      icon.classList.add("animate-spin");
                      await fetchBalances();
                      setTimeout(() => {
                        icon.classList.remove("animate-spin");
                      }, 3000);
                    } else {
                      await fetchBalances();
                    }
                  }}
                >
                  <RefreshCw id="refresh-icon" className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="KES" onValueChange={(value: string) => handleCurrencyChange(value as "KES" | "USD")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="KES">KES Balance</TabsTrigger>
                  <TabsTrigger value="USD">USD Balance</TabsTrigger>
                </TabsList>
                <TabsContent value="KES">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      KES {balance.KES.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frozen Balance</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      KES {frozenBalance.KES.toLocaleString()}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="USD">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      USD {balance.USD.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Frozen Balance</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      USD {frozenBalance.USD.toLocaleString()}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="text-purple-600 hover:text-orange-500 dark:text-purple-400 dark:hover:text-orange-400"
                  onClick={() => setActiveTab("deposit")}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" /> Deposit
                </Button>
                <Button
                  variant="secondary"
                  className="bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  onClick={() => setActiveTab("withdraw")}
                >
                  <ArrowDownCircle className="mr-2 h-4 w-4" /> Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "deposit" | "withdraw")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <ArrowUpCircle className="mr-2 h-4 w-4" /> Deposit
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <ArrowDownCircle className="mr-2 h-4 w-4" /> Withdraw
              </TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              <ActionCard type="deposit" />
            </TabsContent>
            <TabsContent value="withdraw">
              <ActionCard type="withdraw" />
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600 dark:text-purple-400">
                <RefreshCw className="mr-2 h-5 w-5" /> Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0 md:space-x-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search transactions"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full md:w-auto">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdraw">Withdrawals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TransactionsTable searchTerm={searchTerm} filter={filter} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
