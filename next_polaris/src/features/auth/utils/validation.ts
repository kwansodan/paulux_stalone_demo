import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});


export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});


export const PasswordResetSchema = z
  .object({
    password: z.string().min(6, "Password is too short").max(191),
    confirmPassword: z.string().min(6, "Password is too short").max(191),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;