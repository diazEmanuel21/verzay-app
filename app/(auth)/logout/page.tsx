"use client";

import { useEffect } from "react";
import { handleLogout } from "@/lib/handleLogout";

export default function LogoutPage() {
    useEffect(() => {
        handleLogout()
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
            Cerrando sesión...
        </div>
    );
}
