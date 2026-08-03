import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACCEPTED_IMAGE_TYPES,
  readImageDimensions,
  validateAvatarFile,
} from "@/lib/avatarUpload";

/**
 * File input + preview state for profile avatar selection (Profile modal + Settings).
 */
export function useAvatarFileSelection() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    previewRef.current = avatarPreview;
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const clearAvatarSelection = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarError(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }, []);

  const handleAvatarFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setAvatarError(null);
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        setAvatarPreview(null);
      }
      setAvatarFile(null);
      if (!file) return;

      const validationError = validateAvatarFile(file);
      if (validationError) {
        setAvatarError(validationError);
        return;
      }

      void (async () => {
        try {
          await readImageDimensions(file);
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(file));
        } catch {
          setAvatarError("Invalid image file.");
        }
      })();
    },
    [],
  );

  return {
    avatarFile,
    avatarPreview,
    avatarError,
    avatarInputRef,
    handleAvatarFileChange,
    clearAvatarSelection,
    acceptedImageTypes: ACCEPTED_IMAGE_TYPES,
  };
}
