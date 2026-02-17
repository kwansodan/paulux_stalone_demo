import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

interface PasswordResetPageProps {
  params: Promise<{ tokenId: string }>
}
export default async function ResetPasswordPage({ params }: PasswordResetPageProps) {
  const { tokenId } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {<ResetPasswordForm tokenId={tokenId}/>}

    </div>
  )
}