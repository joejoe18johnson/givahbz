"use client";

import { useState } from "react";
import { Upload, FileText, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [idProofType, setIdProofType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  
  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdProofFile(e.target.files[0]);
    }
  };

  const handleAddressProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAddressProofFile(e.target.files[0]);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }
    
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setStep(2);
    setError("");
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!idProofType) {
      setError("Please select the type of ID you are uploading.");
      return;
    }
    
    if (!idProofFile) {
      setError("Please upload proof of ID.");
      return;
    }
    
    if (!addressProofFile) {
      setError("Please upload proof of address.");
      return;
    }
    
    // In a real app, upload files to server
    const success = await signup(formData.email, formData.password, formData.name);
    
    if (success) {
      // Store verification status
      const userData = {
        idProofType,
        idProofUploaded: true,
        addressProofUploaded: true,
        verificationStatus: "pending",
      };
      localStorage.setItem(`belizeFund_verification_${formData.email}`, JSON.stringify(userData));
      
      router.push("/auth/verification-pending");
    } else {
      setError("Account creation failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-600">Join GivahBz and help make a difference</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= 1 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? "bg-primary-600" : "bg-gray-200"}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= 2 ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-600"
            }`}>
              2
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
            >
              Continue to Identity Verification
            </button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="bg-primary-50 border-2 border-primary-300 rounded-lg p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-primary-600 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-lg font-medium mb-2 text-primary-900">
                    Identity Verification Required
                  </h2>
                  <p className="text-sm text-primary-800 mb-4">
                    All users must verify their identity before creating campaigns. This helps ensure trust and security for everyone.
                  </p>
                </div>
              </div>

              {/* ID Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Type of ID Document *
                </label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Select ID type</option>
                  <option value="social_security">Social Security Card</option>
                  <option value="passport">Passport</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>

              {/* ID Proof Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Upload Proof of ID *
                </label>
                <div className="border-2 border-dashed border-primary-300 rounded-lg p-6 bg-white">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleIdProofChange}
                    className="hidden"
                    id="id-proof-upload"
                    required
                  />
                  <label
                    htmlFor="id-proof-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FileText className="w-10 h-10 text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {idProofFile ? idProofFile.name : "Click to upload ID document"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </label>
                  {idProofFile && (
                    <div className="mt-2 flex items-center justify-between bg-white p-2 rounded">
                      <span className="text-sm text-gray-700">{idProofFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setIdProofFile(null)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Acceptable forms: Social Security Card, Passport, or National ID
                </p>
              </div>

              {/* Address Proof Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900">
                  Upload Proof of Address *
                </label>
                <div className="border-2 border-dashed border-primary-300 rounded-lg p-6 bg-white">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleAddressProofChange}
                    className="hidden"
                    id="address-proof-upload"
                    required
                  />
                  <label
                    htmlFor="address-proof-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FileText className="w-10 h-10 text-primary-600 mb-2" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {addressProofFile ? addressProofFile.name : "Click to upload address proof"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </label>
                  {addressProofFile && (
                    <div className="mt-2 flex items-center justify-between bg-white p-2 rounded">
                      <span className="text-sm text-gray-700">{addressProofFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setAddressProofFile(null)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Acceptable forms: Utility bill, bank statement, government letter, or lease agreement (dated within last 3 months)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
