'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
    createIaCreditForUser,
    getIaCreditByUser,
    rechargeIaCredit,
} from '@/actions/actions-ia-credits';

interface Props {
    userId: string;
}

export const CreditMain = ({ userId }: Props) => {
    const [total, setTotal] = useState<number>(0);
    const [used, setUsed] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasCredits, setHasCredits] = useState<boolean>(false);

    useEffect(() => {
        const fetchCredits = async () => {
            try {
                setLoading(true);
                const res = await getIaCreditByUser(userId);

                if (res.success && res.data?.length) {
                    const credit = res.data[0];
                    setTotal(credit.total);
                    setUsed(credit.used);
                    setHasCredits(true);
                } else {
                    setHasCredits(false);
                    toast.error(res.message || 'No se encontraron créditos configurados.');
                }
            } catch (err) {
                toast.error('Error al obtener los créditos.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCredits();
    }, [userId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const renewalDate = new Date();

            const res = hasCredits
                ? await rechargeIaCredit(userId, total, renewalDate)
                : await createIaCreditForUser(userId, total, renewalDate);

            if (res.success) {
                toast.success(
                    hasCredits ? 'Créditos actualizados correctamente' : 'Créditos creados correctamente'
                );
                setHasCredits(true); // si era creación, ahora ya tiene créditos
            } else {
                toast.error(res.message || 'Error al guardar créditos');
            }
        } catch (err) {
            toast.error('Error inesperado al guardar créditos');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Créditos IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <p className="text-sm text-muted-foreground">Cargando créditos...</p>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Créditos totales</label>
                            <Input
                                type="number"
                                value={total}
                                min={1}
                                onChange={(e) => setTotal(parseInt(e.target.value))}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Créditos consumidos</label>
                            <Input value={used} disabled className="bg-muted cursor-not-allowed" />
                        </div>

                        <div className="pt-2">
                            <Button disabled={saving} onClick={handleSave}>
                                {saving ? 'Guardando...' : hasCredits ? 'Actualizar créditos' : 'Crear créditos'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
