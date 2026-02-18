import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

// Upload profile photo
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const fileRef = ref(storage, `profile-photos/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// Upload campaign image
export async function uploadCampaignImage(campaignId: string, file: File): Promise<string> {
  const fileRef = ref(storage, `campaigns/${campaignId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// Upload verification document
export async function uploadVerificationDocument(
  userId: string,
  file: File,
  documentType: string
): Promise<string> {
  const fileRef = ref(storage, `verification-docs/${userId}/${documentType}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// Delete file
export async function deleteFile(fileUrl: string): Promise<void> {
  const fileRef = ref(storage, fileUrl);
  await deleteObject(fileRef);
}

// Delete profile photo
export async function deleteProfilePhoto(photoUrl: string): Promise<void> {
  try {
    await deleteFile(photoUrl);
  } catch (error) {
    console.error("Error deleting profile photo:", error);
  }
}
