import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

// Upload profile photo
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const fileRef = ref(storage, `profile-photos/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

// Upload campaign image (for live campaigns)
export async function uploadCampaignImage(campaignId: string, file: File): Promise<string> {
  const fileRef = ref(storage, `campaigns/${campaignId}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

/** Upload cover image for a campaign under review (before it has a campaign id). */
export async function uploadUnderReviewCampaignImage(
  pendingId: string,
  index: 0 | 1,
  file: File
): Promise<string> {
  try {
    if (!file) {
      throw new Error("File is required");
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }
    const ext = file.name.split(".").pop() || "jpg";
    const fileRef = ref(storage, `campaigns-under-review/${pendingId}/image${index + 1}.${ext}`);
    console.log(`Uploading image ${index + 1} to: campaigns-under-review/${pendingId}/image${index + 1}.${ext}`);
    await uploadBytes(fileRef, file);
    console.log(`Image ${index + 1} uploaded, getting download URL...`);
    const url = await getDownloadURL(fileRef);
    console.log(`Image ${index + 1} URL obtained:`, url);
    return url;
  } catch (error: any) {
    console.error(`Error uploading image ${index + 1}:`, error);
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("permission") || errorMessage.includes("Permission")) {
      throw new Error(`Permission denied: Unable to upload image ${index + 1}. Please check your Firebase Storage rules.`);
    } else if (errorMessage.includes("quota") || errorMessage.includes("Quota")) {
      throw new Error(`Storage quota exceeded: Unable to upload image ${index + 1}.`);
    } else {
      throw new Error(`Failed to upload image ${index + 1}: ${errorMessage}`);
    }
  }
}

// Upload verification document
export async function uploadVerificationDocument(
  userId: string,
  file: File,
  documentType: string
): Promise<string> {
  try {
    if (!file) {
      throw new Error("File is required");
    }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      throw new Error("File must be an image (JPG, PNG) or PDF document");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File size must be less than 10MB");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    if (!documentType) {
      throw new Error("Document type is required");
    }
    
    const fileRef = ref(storage, `verification-docs/${userId}/${documentType}/${Date.now()}_${file.name}`);
    console.log(`Uploading verification document to: verification-docs/${userId}/${documentType}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    console.log("Verification document uploaded, getting download URL...");
    const url = await getDownloadURL(fileRef);
    console.log("Verification document URL obtained:", url);
    return url;
  } catch (error: any) {
    console.error("Error uploading verification document:", error);
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes("permission") || errorMessage.includes("Permission")) {
      throw new Error("Permission denied: Unable to upload document. Please check your Firebase Storage rules.");
    } else if (errorMessage.includes("quota") || errorMessage.includes("Quota")) {
      throw new Error("Storage quota exceeded: Unable to upload document.");
    } else {
      throw new Error(`Failed to upload verification document: ${errorMessage}`);
    }
  }
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
