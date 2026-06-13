import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { appFirebase } from "./firebase";
import { logger } from "@/lib/logger";

export async function uploadCustomExerciseImage(
  userId: string,
  exerciseId: string,
  file: File
): Promise<string> {
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `users/${userId}/gym/custom-exercises/${exerciseId}/photo.${ext}`;
  const storageRef = ref(appFirebase.storage, path);
  try {
    await uploadBytes(storageRef, file, {
      contentType: file.type || "image/jpeg",
    });
    return await getDownloadURL(storageRef);
  } catch (e) {
    logger.error("uploadCustomExerciseImage", e);
    throw e;
  }
}
