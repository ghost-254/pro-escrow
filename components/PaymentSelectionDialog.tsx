"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface PaymentSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  depositId: string;
  availableBalance: number; // Pass the user's available balance
}

export default function PaymentSelectionDialog({
  isOpen,
  onClose,
  depositId,
  availableBalance,
}: PaymentSelectionDialogProps) {
  const router = useRouter();

  const handleMpesaPayment = () => {
    router.push(`/create-group/deposit/mpesa-payment/${depositId}`);
    onClose();
  };

  const handleAtlosPayment = () => {
    router.push(`/create-group/deposit/atlos-checkout/${depositId}`);
    onClose();
  };

  const handleWalletPayment = () => {
    if (availableBalance <= 0) {
      toast.error("Insufficient balance in your wallet.");
      return;
    }
    // Handle wallet payment logic here
    toast.success("Payment successful using wallet balance!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Select Payment Method
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose your preferred payment method to complete the transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Wallet Option */}
          {availableBalance > 0 && (
            <Button
              onClick={handleWalletPayment}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Pay with Wallet (KES {availableBalance.toLocaleString()})
            </Button>
          )}

          {/* M-Pesa Option */}
          <Button
            onClick={handleMpesaPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Pay with M-Pesa
          </Button>

          {/* Atlos Option */}
          <Button
            onClick={handleAtlosPayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Pay with Atlos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}