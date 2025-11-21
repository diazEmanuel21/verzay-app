"use client";

import { seedCrmDataAction } from "@/actions/crm-seed-actions";
import { Button } from "@/components/ui/button";

export const SeedPage = ({ userId }: { userId: string }) => {

    const handleSeed = async () => {
        await seedCrmDataAction(userId);
    }


    return (
        <form action={handleSeed}>
            <Button type="submit">
                Cargar data demo CRM
            </Button>
        </form>
    )
}
