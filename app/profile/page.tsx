"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadProfilePhoto, uploadVerificationDocument } from "@/lib/firebase/storage";
import Link from "next/link";
import Image from "next/image";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Lock, 
  Edit, 
  X, 
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileText
} from "lucide-react";
import { useThemedModal } from "@/components/ThemedModal";

export default function ProfilePage() {
  const { user, isLoading, updateUser, logout } = useAuth();
  const { alert } = useThemedModal();
  const [editingName, setEditingName] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [name, setName] = useState(user?.name || "Johannes Johnson");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [phoneInput, setPhoneInput] = useState("");
  const [idDocumentType, setIdDocumentType] = useState<"social_security" | "passport" | "">(user?.idDocumentType || "");
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track last saved state
  const [lastSavedState, setLastSavedState] = useState({
    name: user?.name || "Johannes Johnson",
    birthday: user?.birthday || "",
    phoneNumber: user?.phoneNumber || "",
    profilePhoto: user?.profilePhoto || null,
  });

  // Sync state with user data when user changes
  useEffect(() => {
    if (user) {
      const userState = {
        name: user.name || "Johannes Johnson",
        birthday: user.birthday || "",
        phoneNumber: user.phoneNumber || "",
        profilePhoto: user.profilePhoto || null,
      };
      setName(userState.name);
      setBirthday(userState.birthday);
      setPhoneNumber(userState.phoneNumber);
      setProfilePhoto(userState.profilePhoto);
      // Update last saved state to match current user data
      setLastSavedState(userState);
      // If phone is verified, don't allow editing
      if (user.phoneVerified) {
        setEditingPhone(false);
      }
      setIdDocumentType(user.idDocumentType || "");
    }
  }, [user]);

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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile.</p>
          <Link
            href="/auth/login?callbackUrl=/profile"
            className="inline-block bg-success-500 text-white px-6 py-3 rounded-full font-medium hover:bg-success-600 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveName = async () => {
    try {
      await updateUser({ name });
      setEditingName(false);
    } catch (error) {
      console.error("Error saving name:", error);
      alert("Failed to save name. Please try again.", { variant: "error" });
    }
  };

  const handleSaveBirthday = async () => {
    try {
      await updateUser({ birthday });
      setEditingBirthday(false);
    } catch (error) {
      console.error("Error saving birthday:", error);
      alert("Failed to save birthday. Please try again.", { variant: "error" });
    }
  };

  const handleSavePassword = () => {
    // TODO: Implement password change logic (requires current password verification)
    // For now, just close the edit mode
    setEditingPassword(false);
    alert("Password change functionality will be implemented with backend integration.", { title: "Coming soon", variant: "info" });
  };

  const handleDeactivateAccount = async () => {
    if (!user) return;
    setIsDeactivating(true);
    try {
      await updateUser({ status: "deleted" });
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deactivating account:", error);
      alert("Failed to deactivate account. Please try again or contact support.", { variant: "error" });
      setIsDeactivating(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file", { variant: "error" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB", { variant: "error" });
        return;
      }
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Don't save immediately - wait for "Save Settings" button
  };

  const handleSavePhone = async () => {
    const raw = phoneInput.trim();
    if (!raw) return;
    if (raw.length < 8 || !/^[\d\s\-+()]+$/.test(raw)) {
      alert("Please enter a valid phone number (e.g. +501 123-4567 or 123-4567).", { variant: "error" });
      return;
    }
    try {
      await updateUser({ phoneNumber: raw, phoneVerified: false, phonePending: true });
      setPhoneNumber(raw);
      setEditingPhone(false);
      setPhoneInput("");
    } catch (error) {
      console.error("Error saving phone:", error);
      alert("Failed to save phone number. Please try again.", { variant: "error" });
    }
  };

  const handleIdDocumentUpload = async () => {
    if (user?.idPending) {
      alert("You already have an ID document pending verification. Please wait for the verification process to complete before uploading a new document.", { variant: "error" });
      return;
    }
    if (!idDocumentType) {
      alert("Please select the type of ID document (Social Security or Passport).", { variant: "error" });
      return;
    }
    if (!idDocumentFile) {
      alert("Please select a file to upload.", { variant: "error" });
      return;
    }
    if (!user) return;

    setIsUploadingId(true);
    try {
      const documentUrl = await uploadVerificationDocument(user.id, idDocumentFile, idDocumentType);
      await updateUser({ 
        idDocument: documentUrl, 
        idDocumentType: idDocumentType as "social_security" | "passport",
        idVerified: false,
        idPending: true 
      });
      setIdDocumentFile(null);
      if (idFileInputRef.current) {
        idFileInputRef.current.value = '';
      }
      alert("ID document uploaded successfully. It will be reviewed by an admin.", { variant: "success" });
    } catch (error) {
      console.error("Error uploading ID document:", error);
      alert("Failed to upload ID document. Please try again.", { variant: "error" });
    } finally {
      setIsUploadingId(false);
    }
  };

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }
    console.log("File selected:", file.name, file.type, file.size);
    
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please select an image file (JPG, PNG) or PDF document.", { variant: "error" });
      if (idFileInputRef.current) {
        idFileInputRef.current.value = '';
      }
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB", { variant: "error" });
      if (idFileInputRef.current) {
        idFileInputRef.current.value = '';
      }
      return;
    }
    setIdDocumentFile(file);
    console.log("File set successfully:", file.name);
  };

  const handleAddPhone = () => {
    setEditingPhone(true);
    setPhoneInput("");
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* Themed success popup */}
      {showSavedPopup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white rounded-xl shadow-lg border border-success-200 px-5 py-4 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-success-800 font-medium">Settings saved successfully!</p>
          </div>
        </div>
      )}
      {showErrorPopup && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 bg-white rounded-xl shadow-lg border border-red-200 px-5 py-4 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-800 font-medium">Failed to save settings. Please try again.</p>
          </div>
        </div>
      )}

      <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-8">Account</h1>

      {/* Profile Photo Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Photo</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-6">
            <div
              className="relative flex-shrink-0 w-24 h-24 min-w-[6rem] min-h-[6rem] rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-medium"
              style={{ aspectRatio: "1" }}
            >
              {(profilePhoto || user?.profilePhoto) ? (
                <Image
                  src={profilePhoto || user?.profilePhoto || ""}
                  alt="Profile"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span>{name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="sr-only"
                id="photo-upload"
                aria-label="Upload profile photo"
              />
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Upload photo
              </label>
              {profilePhoto && (
                <div className="flex gap-2">
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Change
                  </label>
                  <button
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Name</h2>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {editingName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setName(user?.name || "Johannes Johnson");
                  setEditingName(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <p className="text-gray-900">{name}</p>
          )}
        </div>
      </div>

      {/* Phone Number Section — enter once, then read-only */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Phone number</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {phoneNumber ? (
            <div className="space-y-2">
              <p className="text-gray-900 font-medium">{phoneNumber}</p>
              {user?.phoneVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-verified-100 text-verified-700 rounded-full text-xs font-medium w-fit">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : user?.phonePending ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                  <AlertTriangle className="w-3 h-3" />
                  Pending approval
                </span>
              ) : null}
              {user?.phoneVerified && (
                <p className="text-sm text-gray-600">
                  This number cannot be changed or removed.
                </p>
              )}
            </div>
          ) : editingPhone ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You can add your phone number once. After saving, it will be pending admin approval and cannot be edited or removed.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. +5011234567 or 5011234567"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[200px]"
                  autoFocus
                />
                <button
                  onClick={handleSavePhone}
                  disabled={!phoneInput.trim()}
                  className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingPhone(false);
                    setPhoneInput("");
                  }}
                  className="p-2 text-gray-600 hover:text-gray-700"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No phone number on file</p>
              <p className="text-sm text-gray-500 mb-3">
                Add your phone number here. Once saved, it will be pending admin approval and cannot be edited or removed.
              </p>
              <button
                onClick={handleAddPhone}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Add phone number
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ID Document Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">ID Verification</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {user?.idDocument ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <p className="text-gray-900 font-medium">
                  {user.idDocumentType === "social_security" ? "Social Security Card" : "Passport"}
                </p>
              </div>
              {user?.idVerified ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-verified-100 text-verified-700 rounded-full text-xs font-medium w-fit">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                  <p className="text-sm text-gray-600">
                    Your ID document cannot be changed or removed.
                  </p>
                </>
              ) : user?.idPending ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    Pending approval
                  </span>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          ID document submitted and pending verification
                        </p>
                        <p className="text-sm text-amber-800">
                          Your ID document has already been submitted and is currently being reviewed by our team. You cannot upload a new document until the verification process is complete. You will be notified once your ID has been approved or if any additional information is needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Upload a photo of your Social Security card or Passport for verification. Once uploaded, it will be pending admin approval and cannot be changed.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Type</label>
                  <select
                    value={idDocumentType}
                    onChange={(e) => setIdDocumentType(e.target.value as "social_security" | "passport" | "")}
                    disabled={user?.idPending === true}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                  >
                    <option value="">Select ID type</option>
                    <option value="social_security">Social Security Card</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={idFileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleIdFileChange}
                      className="sr-only"
                      id="id-document-upload"
                      aria-label="Choose ID document file"
                      tabIndex={-1}
                    />
                    {user?.idPending || user?.idVerified ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        {idDocumentFile ? idDocumentFile.name : "Choose file"}
                      </button>
                    ) : (
                      <label
                        htmlFor="id-document-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {idDocumentFile ? idDocumentFile.name : "Choose file"}
                      </label>
                    )}
                  {idDocumentFile && !user?.idPending && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdDocumentFile(null);
                        if (idFileInputRef.current) {
                          idFileInputRef.current.value = '';
                        }
                      }}
                      className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleIdDocumentUpload}
                  disabled={!idDocumentType || !idDocumentFile || isUploadingId || user?.idVerified || user?.idPending === true}
                  className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingId ? "Uploading..." : "Upload ID Document"}
                </button>
                {user?.idPending && (
                  <p className="text-sm text-amber-600 mt-2">
                    You cannot upload a new ID document while your current submission is pending verification.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connected App Permissions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Connected app permissions</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-600">No connected apps yet</p>
        </div>
      </div>

      {/* Email Address Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Mail className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-900">Email address</h2>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-900">{user.email || "joejoe18johnson@gmail.com"}</p>
        </div>
      </div>

      {/* Birthday Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Birthday</h2>
          </div>
          {!editingBirthday && (
            <button
              onClick={() => setEditingBirthday(true)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {editingBirthday ? (
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <button
                onClick={handleSaveBirthday}
                className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setBirthday("");
                  setEditingBirthday(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : birthday ? (
            <p className="text-gray-900">{new Date(birthday).toLocaleDateString()}</p>
          ) : (
            <p className="text-gray-600">Add your birthday</p>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Password</h2>
          </div>
          {!editingPassword && (
            <button
              onClick={() => setEditingPassword(true)}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        <div className="px-6 py-4">
          {editingPassword ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSavePassword}
                  className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingPassword(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-900">●●●●●●●●●●●●</p>
              <button
                onClick={() => {
                  // TODO: Implement password reset email functionality
                  const userEmail = user?.email || "";
                  alert(`Password reset email will be sent to ${userEmail}`, { title: "Reset password", variant: "info" });
                  // In production, this would call an API endpoint to send reset email
                  console.log("Password reset requested for:", userEmail);
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium underline"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={async () => {
            try {
              let photoUrl: string | undefined;
              if (profilePhotoFile && user) {
                setIsUploadingPhoto(true);
                try {
                  photoUrl = await uploadProfilePhoto(user.id, profilePhotoFile);
                } finally {
                  setIsUploadingPhoto(false);
                }
                setProfilePhotoFile(null);
                setProfilePhoto(photoUrl);
              } else if (profilePhoto && !profilePhoto.startsWith("data:")) {
                photoUrl = profilePhoto;
              } else if (profilePhoto === null) {
                photoUrl = undefined;
              } else {
                photoUrl = lastSavedState.profilePhoto ?? undefined;
              }

              await updateUser({
                name,
                birthday: birthday || undefined,
                profilePhoto: photoUrl,
              });

              setLastSavedState({
                name,
                birthday: birthday || "",
                phoneNumber: phoneNumber || "",
                profilePhoto: photoUrl ?? null,
              });

              setEditingName(false);
              setEditingBirthday(false);
              setEditingPassword(false);
              setEditingPhone(false);
              setPhoneInput("");

              setShowSavedPopup(true);
              setTimeout(() => setShowSavedPopup(false), 3000);
            } catch (error) {
              console.error("Error saving settings:", error);
              setShowErrorPopup(true);
              setTimeout(() => setShowErrorPopup(false), 4000);
            }
          }}
          disabled={isUploadingPhoto}
          className="flex-1 px-6 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium disabled:opacity-70 disabled:cursor-wait"
        >
          {isUploadingPhoto ? "Uploading photo…" : "Save Settings"}
        </button>
        <button
          onClick={() => {
            // Revert all changes to last saved state
            setName(lastSavedState.name);
            setBirthday(lastSavedState.birthday);
            setPhoneNumber(lastSavedState.phoneNumber);
            setPhoneInput("");
            setProfilePhoto(lastSavedState.profilePhoto);
            setProfilePhotoFile(null);
            setEditingName(false);
            setEditingBirthday(false);
            setEditingPassword(false);
            setEditingPhone(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Deactivate Account Section */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Deactivate account</h2>
              <p className="text-sm text-gray-600 mb-4">
                If you deactivate your account, you won&apos;t be able to log in anymore, and your fundraisers will no longer appear on the platform.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                To learn more about your account management options,{" "}
                <Link href="#" className="text-primary-600 hover:text-primary-700 underline">
                  click here
                </Link>
                .
              </p>
              {showDeactivateConfirm ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-600">
                    Are you sure you want to deactivate your account? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeactivateAccount}
                      disabled={isDeactivating}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isDeactivating ? "Deactivating…" : "Yes, deactivate my account"}
                    </button>
                    <button
                      onClick={() => setShowDeactivateConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  Deactivate account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
