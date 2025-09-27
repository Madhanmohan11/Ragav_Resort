import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// --- Variant-based styles ---
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        success: "border-green-400 bg-green-50 text-green-800",
        error: "border-red-400 bg-red-50 text-red-800",
        info: "border-blue-400 bg-blue-50 text-blue-800",
        warning: "border-yellow-400 bg-yellow-50 text-yellow-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

export function Toaster() {
  const { toasts } = useToast();
  const AUTO_CLOSE_TIME = 2000; // 2 seconds

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant = "info", ...props }) => (
        <AutoCloseToast
          key={id}
          id={id}
          variant={variant}
          title={title}
          description={description}
          action={action}
          autoClose={AUTO_CLOSE_TIME}
          {...props}
        />
      ))}

      {/* Top-right position */}
      <ToastViewport className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[420px] sm:max-w-full sm:right-2 sm:top-2" />
    </ToastProvider>
  );
}

// --- Auto-close wrapper ---
const AutoCloseToast = ({
  id,
  title,
  description,
  action,
  variant = "info",
  autoClose = 2000,
  ...props
}: any) => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), autoClose);
    return () => clearTimeout(timer);
  }, [autoClose]);

  if (!open) return null;

  return (
    <Toast {...props} className={cn(toastVariants({ variant }))}>
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
    </Toast>
  );
};
