"use client";

import { useState, useEffect } from "react";
import { X, Heart, CreditCard, Building2, Wallet, CheckCircle2, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { recordDonationAndUpdateCampaign } from "@/lib/firebase/firestore";

interface DonationModalProps {
  campaignId: string;
  campaignTitle: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = "credit-card" | "bank" | "digiwallet" | "paypal" | null;

export default function DonationModal({
  campaignId,
  campaignTitle,
  amount,
  isOpen,
  onClose,
}: DonationModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    phone: "",
    anonymous: false,
  });
  const [note, setNote] = useState("");
  const NOTE_MAX_LENGTH = 100;
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [bankDetailsCopied, setBankDetailsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const bankAccountDetails = {
    bankName: "Belize Bank",
    accountName: "GivahBz",
    accountNumber: "1234567890",
    routingNumber: "BELZ001",
    swiftCode: "BELZBZ2X",
  };

  const digiWalletDetails = {
    phoneNumber: "+501 123-4567",
    walletName: "DigiWallet",
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    try {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const donation = {
        campaignId,
        campaignTitle,
        amount,
        donorEmail: donorInfo.email.trim(),
        donorName: donorInfo.anonymous ? "Anonymous" : donorInfo.name.trim(),
        anonymous: donorInfo.anonymous,
        method: selectedMethod as "credit-card" | "bank" | "digiwallet" | "paypal",
        status: "completed" as const,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await recordDonationAndUpdateCampaign(donation, campaignId);

      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setSelectedMethod(null);
        setDonorInfo({ name: "", email: "", phone: "", anonymous: false });
        setNote("");
        setCardDetails({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
      }, 3000);
    } catch (error) {
      console.error("Error recording donation:", error);
      setIsProcessing(false);
      alert("There was a problem recording your donation. Please try again or contact support.");
    }
  };

  const copyBankDetails = () => {
    const details = `Bank: ${bankAccountDetails.bankName}\nAccount Name: ${bankAccountDetails.accountName}\nAccount Number: ${bankAccountDetails.accountNumber}\nRouting Number: ${bankAccountDetails.routingNumber}\nSWIFT Code: ${bankAccountDetails.swiftCode}\nAmount: BZ$${amount}`;
    navigator.clipboard.writeText(details);
    setBankDetailsCopied(true);
    setTimeout(() => setBankDetailsCopied(false), 2000);
  };

  // Lock body scroll when modal is open (fixes mobile scroll-through)
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 min-h-[100dvh] bg-black/50 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-lg max-w-2xl w-full max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Header - larger touch target for close on mobile */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:p-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl sm:text-2xl font-medium">Complete Your Donation</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-gray-500 hover:text-gray-700 active:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - scrollable on mobile */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success-600" />
              </div>
              <h3 className="text-3xl font-medium mb-4">Thank You!</h3>
              <p className="text-lg text-gray-600 mb-2">
                Your donation of {formatCurrency(amount)} has been received.
              </p>
              <p className="text-gray-600">
                Your support makes a real difference. Thank you for helping!
              </p>
            </div>
          ) : (
            <>
              {/* Campaign Info */}
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Donating to:</p>
                <p className="font-medium text-gray-900">{campaignTitle}</p>
                <p className="text-2xl font-medium text-primary-600 mt-2">
                  {formatCurrency(amount)}
                </p>
              </div>

              {/* Donor Information */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Your Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={donorInfo.name}
                      onChange={(e) => setDonorInfo({ ...donorInfo, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={donorInfo.phone}
                      onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. 5011234567"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={donorInfo.anonymous}
                      onChange={(e) => setDonorInfo({ ...donorInfo, anonymous: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="anonymous" className="text-sm text-gray-700">
                      Donate anonymously
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Add a note (optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LENGTH))}
                      maxLength={NOTE_MAX_LENGTH}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Say something nice with your donation..."
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {note.length}/{NOTE_MAX_LENGTH}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection - touch-friendly on mobile */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Select Payment Method</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("credit-card")}
                    className={`min-h-[56px] sm:min-h-0 p-4 border-2 rounded-xl sm:rounded-full transition-all ${
                      selectedMethod === "credit-card"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                    <p className="font-medium">Credit Card</p>
                    <p className="text-xs text-gray-600 mt-1">Visa, Mastercard</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("bank")}
                    className={`min-h-[56px] sm:min-h-0 p-4 border-2 rounded-xl sm:rounded-full transition-all ${
                      selectedMethod === "bank"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                    <p className="font-medium">Bank Transfer</p>
                    <p className="text-xs text-gray-600 mt-1">Direct bank transfer</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("digiwallet")}
                    className={`min-h-[56px] sm:min-h-0 p-4 border-2 rounded-xl sm:rounded-full transition-all ${
                      selectedMethod === "digiwallet"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                    <p className="font-medium">DigiWallet</p>
                    <p className="text-xs text-gray-600 mt-1">Mobile wallet</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod("paypal")}
                    className={`min-h-[56px] sm:min-h-0 p-4 border-2 rounded-xl sm:rounded-full transition-all ${
                      selectedMethod === "paypal"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300"
                    }`}
                  >
                    <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                      <span className="text-primary-600 font-medium text-lg">P</span>
                    </div>
                    <p className="font-medium">PayPal</p>
                    <p className="text-xs text-gray-600 mt-1">PayPal account</p>
                  </button>
                </div>
              </div>

              {/* Payment Method Forms */}
              {selectedMethod === "credit-card" && (
                <div className="mb-6 bg-white rounded-lg p-6">
                  <h4 className="font-medium mb-4">Credit Card Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardholderName}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Name on card"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                        required
                        maxLength={19}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiryDate}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                          required
                          maxLength={5}
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          required
                          maxLength={4}
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        🔒 Your payment information is encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === "bank" && (
                <div className="mb-6 bg-white rounded-lg p-6">
                  <h4 className="font-medium mb-4">Bank Transfer Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-medium">{bankAccountDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account Name:</span>
                      <span className="font-medium">{bankAccountDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium">{bankAccountDetails.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Routing Number:</span>
                      <span className="font-medium">{bankAccountDetails.routingNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">SWIFT Code:</span>
                      <span className="font-medium">{bankAccountDetails.swiftCode}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">Amount:</span>
                        <span className="text-xl font-medium text-primary-600">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={copyBankDetails}
                      className="w-full mt-4 bg-success-500 text-white px-4 py-2 rounded-full font-medium hover:bg-success-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {bankDetailsCopied ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Bank Details
                        </>
                      )}
                    </button>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                      <p className="text-xs text-yellow-800">
                        ⚠️ Please include the campaign ID ({campaignId}) in your transfer reference. 
                        Transfers typically take 1-3 business days to process.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === "digiwallet" && (
                <div className="mb-6 bg-white rounded-lg p-6">
                  <h4 className="font-medium mb-4">DigiWallet Payment</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        DigiWallet Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g. 5011234567"
                      />
                    </div>
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <p className="text-sm text-primary-800 mb-2">
                        <strong>Payment Instructions:</strong>
                      </p>
                      <ol className="text-sm text-primary-700 list-decimal list-inside space-y-1">
                        <li>Open your DigiWallet app</li>
                        <li>Select &quot;Send Money&quot; or &quot;Pay&quot;</li>
                        <li>Enter phone number: <strong>{digiWalletDetails.phoneNumber}</strong></li>
                        <li>Enter amount: <strong>{formatCurrency(amount)}</strong></li>
                        <li>Add reference: Campaign {campaignId}</li>
                        <li>Confirm payment</li>
                      </ol>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        💡 DigiWallet payments are instant and secure.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === "paypal" && (
                <div className="mb-6 bg-white rounded-lg p-6">
                  <h4 className="font-medium mb-4">PayPal Payment</h4>
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-primary-200 rounded-lg p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-blue-600 rounded-lg">
                        <span className="text-white font-medium text-2xl">PayPal</span>
                      </div>
                      <p className="text-gray-700 mb-4">
                        You will be redirected to PayPal to complete your donation of
                      </p>
                      <p className="text-2xl font-medium text-primary-600 mb-4">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        After payment, you&apos;ll be redirected back to this page.
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        🔒 PayPal provides secure payment processing. You can use your PayPal account or credit card.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button - min height for touch on mobile */}
              <div className="flex gap-3 sm:gap-4 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 min-h-[48px] border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl sm:rounded-full font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={
                    !selectedMethod ||
                    !donorInfo.name ||
                    !donorInfo.email ||
                    isProcessing ||
                    (selectedMethod === "credit-card" &&
                      (!cardDetails.cardNumber ||
                        !cardDetails.expiryDate ||
                        !cardDetails.cvv ||
                        !cardDetails.cardholderName))
                  }
                  className="flex-1 min-h-[48px] bg-success-500 text-white px-6 py-3 rounded-xl sm:rounded-full font-medium hover:bg-success-600 active:bg-success-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : selectedMethod === "paypal" ? (
                    <>
                      <span className="font-medium">PayPal</span>
                      Continue to PayPal
                    </>
                  ) : selectedMethod === "bank" ? (
                    "I've Made the Transfer"
                  ) : selectedMethod === "digiwallet" ? (
                    "I've Made the Payment"
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Complete Donation
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
