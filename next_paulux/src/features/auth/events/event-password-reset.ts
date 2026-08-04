import { inngest } from "@/lib/inngest"
import { prisma } from "@/lib/prisma";
import { generatePasswordResetLink } from "../utils/generate-password-reset-link";
import { sendEmailPasswordReset } from "../emails/send-email-password-reset";


export const passwordResetEvent = inngest.createFunction(
  { id: "password-reset" },
  { event: "app/password.password-reset" },
  async ({ event, step }) => {
    const { userId } = event.data;

    const user = await step.run("fetch-user", async () => {
      return prisma.user.findUniqueOrThrow({
        where: { id: userId }
      });
    });

    const passwordResetLink = await step.run("generate-reset-link", async () => {
      return generatePasswordResetLink(user.id);
    });

    const emailResult = await step.run("send-reset-email", async () => {
      const result = await sendEmailPasswordReset(user.email, passwordResetLink)
      if (result.error) {
        throw new Error(`${result.error.name}: ${result.error.message}`);
      }
      return result;
    });

    return {
      event,
      body: emailResult
    }
  }
)