import { PasswordResetEventArgs } from "@/features/auth/events/event-password-reset";
import { EventSchemas, Inngest } from "inngest";

type Events = {
  "app/password.password-reset": PasswordResetEventArgs;
};

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "app.ishmaelsroadstonextapp.com",
    schemas: new EventSchemas().fromRecord<Events>(),
});
