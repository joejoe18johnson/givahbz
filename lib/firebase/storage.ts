import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { storage, auth } from "./config";

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

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

// Sanitize file name for Storage path (no path separators or problematic chars)
function sanitizeFileName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim() || "document";
  return base.replace(/[/\\?#*[\]^\s]+/g, "_").slice(0, 180) || "document";
}

// Upload verification document with timeout and progress tracking
export async function uploadVerificationDocument(
  userId: string,
  file: File,
  documentType: string,
  onProgress?: (progress: number) => void
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
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid !== userId) {
      throw new Error("You must be signed in to upload. Please sign in and try again.");
    }

    const safeName = sanitizeFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
    const path = `verification-docs/${userId}/${documentType}/${Date.now()}_${safeName}.${ext}`;
    const fileRef = ref(storage, path);
    console.log(`Uploading verification document to: ${path}`, `Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const startTime = Date.now();
    
    // Use uploadBytesResumable for better control and progress tracking
    const uploadTask = uploadBytesResumable(fileRef, file);
    
    // Create a promise that resolves when upload completes
    const uploadPromise = new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(1)}%`);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        () => {
          console.log("Upload completed");
          if (onProgress) {
            onProgress(100);
          }
          resolve();
        }
      );
    });
    
    // Add timeout: 60 seconds for upload + 10 seconds for URL retrieval = 70 seconds total
    const timeoutMs = 70000;
    await withTimeout(uploadPromise, timeoutMs, "Upload timed out after 60 seconds. Please check your internet connection and try again.");
    
    const uploadTime = Date.now() - startTime;
    console.log(`Verification document uploaded in ${uploadTime}ms, getting download URL...`);
    
    // Get download URL with timeout
    const urlPromise = getDownloadURL(fileRef);
    const url = await withTimeout(urlPromise, 10000, "Failed to get download URL. The file may have uploaded but URL retrieval timed out.");
    
    const totalTime = Date.now() - startTime;
    console.log(`Verification document URL obtained in ${totalTime}ms:`, url);
    return url;
  } catch (error: any) {
    console.error("Error uploading verification document:", error);
    const code = error?.code || "";
    const errorMessage = error?.message || String(error);
    if (code === "storage/unauthenticated" || errorMessage.includes("unauthenticated")) {
      throw new Error("You must be signed in to upload. Please sign in and try again.");
    }
    if (code === "storage/unauthorized" || errorMessage.includes("permission") || errorMessage.includes("Permission")) {
      throw new Error(
        "Permission denied. In Firebase Console go to Storage > Rules and ensure verification-docs allow write for authenticated users."
      );
    }
    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      throw new Error("Upload timed out. Check your internet connection and try again with a smaller file.");
    }
    if (errorMessage.includes("quota") || errorMessage.includes("Quota")) {
      throw new Error("Storage quota exceeded. Try a smaller file or contact support.");
    }
    if (code === "storage/unknown" && !errorMessage) {
      throw new Error("Upload failed. Check that Firebase Storage is enabled and your storage bucket is set in .env (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).");
    }
    throw new Error(`Upload failed: ${errorMessage}`);
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
