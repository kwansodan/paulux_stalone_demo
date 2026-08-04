import { SESSION_COOKIE_NAME } from "@/constants";
import { cookies } from "next/headers";



export async function setSessionCookie(sessionToken: string, expiresAt: Date) {

    const cookie = {
        name: SESSION_COOKIE_NAME,
        value: sessionToken,
        attributes: {
            httpOnly: true,
            sameSite: "lax" as const,
            secure: process.env.SECURE_COOKIES !== "false",
            path: "/",
            expires: expiresAt,
        }
    }

    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.attributes)

    return cookie.value
}

export const deleteSessionCookie = async () => {
    const cookie = {
        name: SESSION_COOKIE_NAME,
        value: "",
        attributes: {
            httpOnly: true,
            sameSite: "lax" as const,
            secure: process.env.SECURE_COOKIES !== "false",
            path: "/",
            maxAge: 0,
        },
    };

    (await cookies()).set(cookie.name, cookie.value, cookie.attributes);
};


