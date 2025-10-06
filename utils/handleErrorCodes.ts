export const handleErrorCodes = (error: any) => {
  return `${'errors.' + error.response?.data?.error.code}`;
};