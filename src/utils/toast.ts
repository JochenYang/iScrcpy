/**
 * Toast notification utility
 * Creates DOM-based toast notifications with animations
 * Supports showing only one toast at a time to prevent overlapping
 */

type ToastType = "default" | "success" | "error" | "warning" | "info";

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

// Track the current toast element to prevent overlapping
let currentToast: HTMLElement | null = null;

/**
 * Remove any existing toast before showing a new one
 */
function clearExistingToast(): void {
  if (currentToast && currentToast.parentElement) {
    currentToast.remove();
  }
  currentToast = null;
}

/**
 * Show a toast notification
 * @param message - The message to display
 * @param options - Optional toast configuration
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  const { type = "default", duration = 2000 } = options;

  // Clear any existing toast first to prevent overlapping
  clearExistingToast();

  const toast = document.createElement("div");
  toast.className = `toast ${type !== "default" ? `toast-${type}` : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Track current toast
  currentToast = toast;

  setTimeout(() => {
    if (toast === currentToast) {
      toast.classList.add("fade-out");
      setTimeout(() => {
        if (toast === currentToast) {
          toast.remove();
          currentToast = null;
        }
      }, 300);
    }
  }, duration);
}

/**
 * Show a success toast
 */
export function showSuccess(message: string): void {
  showToast(message, { type: "success" });
}

/**
 * Show an error toast
 */
export function showError(message: string): void {
  showToast(message, { type: "error" });
}

/**
 * Show a warning toast
 */
export function showWarning(message: string): void {
  showToast(message, { type: "warning" });
}

/**
 * Show an info toast
 */
export function showInfo(message: string): void {
  showToast(message, { type: "info" });
}

/**
 * Dismiss the current toast manually
 */
export function dismissToast(): void {
  clearExistingToast();
}
