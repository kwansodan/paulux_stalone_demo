import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { dashboardPath } from "../paths"

export default async function UnauthorizedPage() {
  // const { user } = await getAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
          <CardDescription>You don&apos;t have permission to access this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={dashboardPath()}>Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
