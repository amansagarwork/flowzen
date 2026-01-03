import { toast as sonnerToast, Toaster } from 'sonner';

// Default options for better UX with multiple toasts
const defaultOptions = {
  duration: 4000, // 4 seconds default
  position: 'bottom-right' as const,
  dismissible: true,
};

// Global toast functions that can be used anywhere
export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    return sonnerToast.success(message, { ...defaultOptions, ...options });
  },
  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    return sonnerToast.error(message, { ...defaultOptions, duration: 5000, ...options }); // Errors stay longer
  },
  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
    return sonnerToast.info(message, { ...defaultOptions, ...options });
  },
  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    return sonnerToast.warning(message, { ...defaultOptions, ...options });
  },
  loading: (message: string, options?: Parameters<typeof sonnerToast.loading>[1]) => {
    return sonnerToast.loading(message, { ...defaultOptions, duration: Infinity, ...options }); // Loading stays until dismissed
  },
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id);
  },
  promise: sonnerToast.promise,
};

// Custom hook for easy access to toast functions
export function useToast() {
  return toast;
}

// Export Toaster component for the layout
export { Toaster };

// Re-export everything from sonner for advanced usage
export * from 'sonner';
