"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { addCampaignUnderReview } from "@/lib/campaignsUnderReview";
import { addCampaignUnderReviewToFirestore } from "@/lib/firebase/firestore";
import Link from "next/link";

export default function CreateCampaignPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fullDescription: "",
    goal: "",
    category: "",
    location: "",
    daysLeft: "",
    creatorType: "",
  });

  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofDragOver, setProofDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login?callbackUrl=/campaigns/create");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (proofFiles.length === 0) {
      alert("Please upload at least one proof document to verify your need.");
      return;
    }

    const goalNum = parseFloat(formData.goal) || 0;
    const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const creatorName = user?.name ?? "User";
    const creatorId = user?.id ?? "";

    addCampaignUnderReview({
      id: pendingId,
      title: formData.title,
      description: formData.description,
      goal: goalNum,
      category: formData.category,
      creatorName,
      submittedAt: new Date().toISOString(),
    });

    try {
      await addCampaignUnderReviewToFirestore({
        title: formData.title,
        description: formData.description,
        fullDescription: formData.fullDescription || "",
        goal: goalNum,
        category: formData.category,
        creatorName,
        creatorId,
      });
      router.push("/my-campaigns");
    } catch (err) {
      console.error("Failed to submit campaign for review:", err);
      alert("Your campaign could not be sent for review. Check that you're signed in and that Firestore rules allow writes to campaignsUnderReview. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setProofFiles((prev) => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const handleProofDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setProofDragOver(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) =>
          f.type === "application/pdf" ||
          f.type.startsWith("image/") ||
          f.type === "application/msword" ||
          f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      setProofFiles((prev) => [...prev, ...files]);
    }
  };

  const handleProofDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProofDragOver(true);
  };

  const handleProofDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProofDragOver(false);
  };

  const removeFile = (index: number) => {
    setProofFiles(proofFiles.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) setImageFile(file);
    e.target.value = "";
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setImageDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setImageFile(file);
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragOver(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragOver(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-medium mb-4">Start Your Campaign</h1>
      <p className="text-gray-600 mb-8">
        All campaigns require proof of need to ensure transparency and trust. Please provide supporting documents such as medical reports, financial statements, or other relevant documentation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Creator Type */}
        <div>
          <label className="block text-sm font-medium mb-2">
            I am a... *
          </label>
          <select
            name="creatorType"
            value={formData.creatorType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            <option value="">Select type</option>
            <option value="individual">Individual in Need</option>
            <option value="organization">Organization</option>
            <option value="charity">Registered Charity</option>
          </select>
        </div>

        {/* Campaign Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Campaign Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="Brief title describing your need"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            <option value="">Select a category</option>
            <option value="Medical">Medical</option>
            <option value="Education">Education</option>
            <option value="Disaster Relief">Disaster Relief</option>
            <option value="Community">Community</option>
            <option value="Emergency">Emergency</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Short Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="A brief summary of your campaign (2-3 sentences)"
          />
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Full Story *
          </label>
          <textarea
            name="fullDescription"
            value={formData.fullDescription}
            onChange={handleChange}
            required
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="Tell your story. What inspired you? What will you do with the funds?"
          />
        </div>

        {/* Goal Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Funding Goal (BZ$) *
          </label>
          <input
            type="number"
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            required
            min="1"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="5000"
            step="0.01"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            placeholder="e.g., Belize City, Belize or Orange Walk Town, Belize"
          />
        </div>

        {/* Campaign Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Campaign Duration *
          </label>
          <select
            name="daysLeft"
            value={formData.daysLeft}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
          >
            <option value="">Select duration</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="120">120 days</option>
          </select>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Campaign Image
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleImageChange}
            className="hidden"
            id="campaign-image-upload"
          />
          <label
            htmlFor="campaign-image-upload"
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
            className={`block border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              imageDragOver
                ? "border-primary-500 bg-primary-50"
                : "border-gray-300 hover:border-primary-500"
            }`}
          >
            {imageFile ? (
              <div className="space-y-2">
                <p className="text-primary-600 font-medium">{imageFile.name}</p>
                <p className="text-sm text-gray-500">
                  ({(imageFile.size / 1024).toFixed(1)} KB) — click or drop to replace
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </>
            )}
          </label>
        </div>

        {/* Note about Identity Verification */}
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-success-600 mt-0.5" />
            <div>
              <p className="text-sm text-success-800 font-medium mb-1">
                Your identity has been verified
              </p>
              <p className="text-sm text-success-700">
                Your account identity verification is complete. You can now create campaigns.
              </p>
            </div>
          </div>
        </div>

        {/* Proof Documents - REQUIRED */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <label className="block text-sm font-medium mb-2 text-yellow-900">
                Proof of Need Documents * (Required)
              </label>
              <p className="text-sm text-yellow-800 mb-4">
                To ensure transparency and build trust, please upload supporting documents such as:
              </p>
              <ul className="text-sm text-yellow-800 list-disc list-inside mb-4 space-y-1">
                <li>Medical reports or doctor&apos;s notes (for medical campaigns)</li>
                <li>Financial statements or income proof</li>
                <li>Official identification</li>
                <li>Organization registration documents (for organizations/charities)</li>
                <li>Any other relevant documentation proving your need</li>
              </ul>
            </div>
          </div>
          
          <label
            htmlFor="proof-upload"
            onDragOver={handleProofDragOver}
            onDragLeave={handleProofDragLeave}
            onDrop={handleProofDrop}
            className={`block border-2 border-dashed rounded-lg p-6 bg-white cursor-pointer transition-colors ${
              proofDragOver ? "border-primary-500 bg-primary-50" : "border-yellow-300 hover:border-yellow-500"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="proof-upload"
            />
            <div className="flex flex-col items-center text-center">
              <FileText className="w-10 h-10 text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload or drag and drop proof documents
              </p>
              <p className="text-xs text-gray-500">
                PDF, JPG, PNG, DOC up to 10MB each
              </p>
            </div>
          </label>

          {/* Uploaded Files List */}
          {proofFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Uploaded Documents:</p>
              {proofFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="bg-success-500 text-white px-8 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Submit for Review
          </button>
          <button
            type="button"
            className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
          >
            Save as Draft
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-900 font-medium mb-2">Important Information:</p>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Your campaign will be reviewed by our team to verify all provided documents before being published.</li>
            <li>Your account identity has already been verified, so you only need to provide proof of need for this specific campaign.</li>
            <li>This verification process typically takes 24-48 hours.</li>
            <li>All documents are securely stored and only used for verification purposes.</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
