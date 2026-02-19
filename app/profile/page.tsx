"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
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
  AlertTriangle
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [name, setName] = useState(user?.name || "Johannes Johnson");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [phoneInput, setPhoneInput] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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

  const handleSaveName = () => {
    updateUser({ name });
    setEditingName(false);
  };

  const handleSaveBirthday = () => {
    updateUser({ birthday });
    setEditingBirthday(false);
  };

  const handleSavePassword = () => {
    // TODO: Implement password change logic (requires current password verification)
    // For now, just close the edit mode
    setEditingPassword(false);
    alert("Password change functionality will be implemented with backend integration.");
  };

  const handleDeactivateAccount = () => {
    // TODO: Implement account deactivation
    console.log("Account deactivation requested");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      // Create preview URL - only update state, don't save yet
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        setProfilePhoto(photoUrl);
        // Don't save immediately - wait for "Save Settings" button
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

  const handleSavePhone = () => {
    if (phoneInput.trim()) {
      const newPhone = phoneInput.trim();
      setPhoneNumber(newPhone);
      // When saving a new phone number, it's not verified yet
      updateUser({ phoneNumber: newPhone, phoneVerified: false });
      setEditingPhone(false);
      setPhoneInput("");
    }
  };

  const handleAddPhone = () => {
    setEditingPhone(true);
    setPhoneInput("");
  };

  const handleEditPhone = () => {
    setEditingPhone(true);
    setPhoneInput(phoneNumber);
  };

  const handleRemovePhone = () => {
    setPhoneNumber("");
    updateUser({ phoneNumber: undefined, phoneVerified: false });
    setEditingPhone(false);
    setPhoneInput("");
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-medium text-gray-900 mb-8">Account</h1>

      {/* Profile Photo Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Photo</h2>
        </div>
        <div className="px-6 py-6">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-medium">
              {(profilePhoto || user?.profilePhoto) ? (
                <img 
                  src={profilePhoto || user?.profilePhoto || ""} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
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
                className="hidden"
                id="photo-upload"
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

      {/* Verified Phone Number Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Verified Phone Number</h2>
          </div>
        </div>
        <div className="px-6 py-4">
          {phoneNumber ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="text-gray-900 font-medium">{phoneNumber}</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-verified-100 text-verified-700 rounded-full text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-sm text-gray-600">
                This is the phone number used during account registration. It cannot be changed.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">No phone number on file</p>
              <p className="text-sm text-gray-500">
                Phone number is set during account registration and cannot be changed later.
              </p>
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
                  alert(`Password reset email will be sent to ${userEmail}`);
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
          onClick={() => {
            try {
              // Save all current settings (phone number is read-only and cannot be changed)
              updateUser({
                name,
                birthday: birthday || undefined,
                profilePhoto: profilePhoto || undefined,
              });
              
              // Update last saved state to current values
              setLastSavedState({
                name,
                birthday: birthday || "",
                phoneNumber: phoneNumber || "",
                profilePhoto: profilePhoto || null,
              });
              
              // Close all editing modes
              setEditingName(false);
              setEditingBirthday(false);
              setEditingPassword(false);
              setEditingPhone(false);
              setPhoneInput("");
              
              alert("Settings saved successfully!");
            } catch (error) {
              console.error("Error saving settings:", error);
              alert("Failed to save settings. Please try again.");
            }
          }}
          className="flex-1 px-6 py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium"
        >
          Save Settings
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
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Yes, deactivate my account
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
