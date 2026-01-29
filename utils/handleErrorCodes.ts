import { AxiosError } from 'axios';

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
  code?: string;
}

/**
 * Maps backend error codes to i18n translation keys.
 * Some codes need special mapping for content policy violations.
 */
const ERROR_CODE_MAP: Record<string, string> = {
  // Content policy violations - map to specific messages
  CONTENT_POLICY_VIOLATION: 'CONTENT_POLICY_VIOLATION',

  // Account status
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_BANNED',
};

/**
 * Extracts the error code from various API error response formats.
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (!error) return undefined;

  // Handle Axios errors
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;

    // Try different response formats
    return data?.error?.code || data?.code;
  }

  // Handle plain error objects
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.response && typeof errorObj.response === 'object') {
      const response = errorObj.response as { data?: ApiErrorResponse };
      return response.data?.error?.code || response.data?.code;
    }
  }

  return undefined;
};

/**
 * Extracts the error message from API error response.
 */
export const getErrorMessage = (error: unknown): string | undefined => {
  if (!error) return undefined;

  // Handle Axios errors
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;

    return data?.error?.message || data?.message;
  }

  // Handle plain error objects
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.response && typeof errorObj.response === 'object') {
      const response = errorObj.response as { data?: ApiErrorResponse };
      return response.data?.error?.message || response.data?.message;
    }
  }

  return undefined;
};

/**
 * Returns the i18n translation key for an API error.
 * Falls back to a generic error message if the code is unknown.
 */
export const handleErrorCodes = (error: unknown): string => {
  const code = getErrorCode(error);

  if (!code) {
    return 'errors.CLIENT_ERROR';
  }

  // Check if we have a special mapping
  const mappedCode = ERROR_CODE_MAP[code] || code;

  return `errors.${mappedCode}`;
};

/**
 * Checks if an error is a content policy violation.
 */
export const isContentPolicyError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  return code === 'CONTENT_POLICY_VIOLATION';
};

/**
 * Checks if an error is a banned account error.
 */
export const isBannedError = (error: unknown): boolean => {
  if (!error) return false;

  // Check HTTP status code
  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 403) {
      const code = getErrorCode(error);
      return code === 'ACCOUNT_BANNED' || code === 'ACCOUNT_SUSPENDED';
    }
  }

  return false;
};

/**
 * Gets ban details from error response (for displaying to user).
 */
export const getBanDetails = (error: unknown): {
  reason?: string;
  bannedUntil?: string;
  isPermanent: boolean;
} | null => {
  if (!isBannedError(error)) return null;

  if ((error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError<{
      error?: {
        reason?: string;
        bannedUntil?: string;
        isPermanent?: boolean;
      };
    }>;

    const errorData = axiosError.response?.data?.error;

    return {
      reason: errorData?.reason,
      bannedUntil: errorData?.bannedUntil,
      isPermanent: errorData?.isPermanent ?? !errorData?.bannedUntil,
    };
  }

  return null;
};

/**
 * Returns a user-friendly error message for content policy violations.
 * This extracts the backend message which contains specifics about the violation.
 */
export const getContentPolicyMessage = (error: unknown): string | undefined => {
  if (!isContentPolicyError(error)) return undefined;
  return getErrorMessage(error);
};
