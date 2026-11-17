"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AxiosError } from "axios";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/app/app/profile/hooks/useProfile";

const schema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password")
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
  })
  .refine((values) => values.new_password !== values.current_password, {
    message: "New password must be different from the current password",
    path: ["new_password"]
  });

type ChangePasswordValues = z.infer<typeof schema>;

/** Error envelope returned by POST /v1/auth/change-password. */
type ChangePasswordApiError = {
  error?: {
    code?: string;
    message?: string;
    request_id?: string;
  };
};

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordDialog({
  open,
  onOpenChange
}: ChangePasswordDialogProps) {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    }
  });

  // Reset the form whenever the dialog closes.
  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const onSubmit = (values: ChangePasswordValues) => {
    clearErrors("current_password");
    changePassword.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          const apiError = error as AxiosError<ChangePasswordApiError>;
          const message = apiError?.response?.data?.error?.message;
          if (message) {
            setError("current_password", { message });
          }
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          id="change-password-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <PasswordField
            label="Current Password"
            error={errors.current_password?.message}
            registration={register("current_password")}
            autoComplete="current-password"
          />
          <PasswordField
            label="New Password"
            error={errors.new_password?.message}
            registration={register("new_password")}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm New Password"
            error={errors.confirm_password?.message}
            registration={register("confirm_password")}
            autoComplete="new-password"
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changePassword.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="change-password-form"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            Save Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PasswordFieldProps = {
  label: string;
  error?: string;
  registration: ReturnType<
    ReturnType<typeof useForm<ChangePasswordValues>>["register"]
  >;
  autoComplete?: string;
};

function PasswordField({
  label,
  error,
  registration,
  autoComplete
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={label} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <PasswordInput
        id={label}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
        {...registration}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

/** Lightweight password input with a show/hide toggle. */
function PasswordInput(
  props: React.ComponentProps<typeof Input> & { id?: string }
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className="h-10 pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
