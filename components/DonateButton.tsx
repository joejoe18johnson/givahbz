"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import DonationModal from "./DonationModal";

interface DonateButtonProps {
  campaignId: string;
  campaignTitle?: string;
}

export default function DonateButton({ campaignId, campaignTitle = "Campaign" }: DonateButtonProps) {
  const [amount, setAmount] = useState("");
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const presetAmounts = [1, 5, 10, 20, 50];

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
    setSelectedPreset(presetAmount);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and ensure increments of 1
    if (value === "" || /^\d+$/.test(value)) {
      setAmount(value);
      setSelectedPreset(null);
    }
  };

  const handleDonate = () => {
    if (amount && parseFloat(amount) > 0) {
      setShowDonationModal(true);
    }
  };

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select or enter amount</label>
        
        {/* Preset Amount Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presetAmounts.map((presetAmount) => (
            <button
              key={presetAmount}
              type="button"
              onClick={() => handlePresetClick(presetAmount)}
              className={`px-4 py-3 rounded-full font-medium transition-colors ${
                selectedPreset === presetAmount
                  ? "bg-success-500 text-white border-2 border-success-500"
                  : "border-2 border-gray-300 text-gray-700 hover:border-primary-500 hover:text-primary-600"
              }`}
            >
              BZ${presetAmount.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="mb-3">
          <label className="block text-sm font-medium mb-2">Other Amount</label>
          <input
            type="text"
            value={amount}
            onChange={handleCustomAmountChange}
            placeholder="Enter amount (increments of 1)"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="1"
            step="1"
          />
        </div>

        {/* Donate Button */}
        <button
          onClick={handleDonate}
          disabled={!amount || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))}
          className="w-full bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
            ? `Donate ${formatCurrency(parseFloat(amount))}`
            : "Select Amount to Donate"}
        </button>
      </div>

      {/* Donation Modal */}
      {showDonationModal && amount && parseFloat(amount) > 0 && (
        <DonationModal
          campaignId={campaignId}
          campaignTitle={campaignTitle}
          amount={parseFloat(amount)}
          isOpen={showDonationModal}
          onClose={() => {
            setShowDonationModal(false);
            setAmount("");
            setSelectedPreset(null);
          }}
        />
      )}
    </>
  );
}
