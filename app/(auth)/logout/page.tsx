"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
    useEffect(() => {
        signOut({ callbackUrl: "/login" });
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
            Cerrando sesión...
        </div>
    );
}
