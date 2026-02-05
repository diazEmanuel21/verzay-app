import { ChangeUserPasswordForm } from "./ChangeUserPasswordForm";
import { ResetAllPasswords } from "./ResetAllPasswords";

export default async function PasswordPage({
  searchParams,
}: {
  searchParams?: { userId?: string };
}) {
  const userId = searchParams?.userId;

  return (
    <div className="flex flex-1 w-full h-full">
      {userId ? <ChangeUserPasswordForm userId={userId} /> : <ResetAllPasswords />}
    </div>
  );
}