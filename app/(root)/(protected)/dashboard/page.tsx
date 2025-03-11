import { auth } from "@/auth";
import LogoutButton from "@/components/logout-button";
import { db } from "@/lib/db";
import WhatsAppInstanceStatus from "@/components/form-qr";

import { currentUser } from "@/lib/auth";
import { UserInfo } from "@/components/user-info";
import FormInstance from "@/components/form-Instance";

import EnableToggleButton from "@/components/button-bot";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button"


export default async function DashboardPage() {

  const session = await currentUser();

  const user = await db.user.findUnique({
    where: {email: session?.email ?? ""}
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <>
<div className="flex flex-col items-center justify-between  border rounded-lg shadow-lg">
  <div className="">
    <FormInstance userId={user.id} />
  </div>
  <div className="flex space-x-4">
    <WhatsAppInstanceStatus userId={user.id} />
    <EnableToggleButton userId={user.id} userName={user.name}/>
  </div>
</div>
      
    </>

  );
}
