export const getBaseUrl = () => {
    const environment = process.env.NODE_ENV;

    if (environment === "development") {
        return "http://localhost:3000";
    }

    return process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || "";
}