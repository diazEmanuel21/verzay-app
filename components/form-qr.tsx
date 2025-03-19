'use client';

import { useEffect, useState } from 'react';
import { getInstances, generarCodigoQR } from '@/actions/api-action';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, QrCode, CheckCircle, Link, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface QRCodeGeneratorProps {
    instanceName: string;
    instanceId: string;
}

interface QRCodeGeneratorComponentProps {
    userId: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorComponentProps> = ({ userId }) => {
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [instanceData, setInstanceData] = useState<QRCodeGeneratorProps | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const fetchQRCode = async (instanceName: string, apiKey: string) => {
        setLoading(true);
        const response = await generarCodigoQR(instanceName, apiKey);

        if (response.success) {
            setQrCode(response.qr?.code || null);
            setConnectionStatus(response.connectionState?.instance.state || null);
        }
        setLoading(false);
    };

    useEffect(() => {
        const loadInstances = async () => {
            try {
                const instances = await getInstances(userId);

                if (Array.isArray(instances) && instances.length > 0) {
                    const { instanceName, instanceId } = instances[0];
                    setInstanceData({ instanceName, instanceId });
                    fetchQRCode(instanceName, instanceId);

                    const intervalId = setInterval(() => {
                        fetchQRCode(instanceName, instanceId);
                    }, 10000);

                    return () => clearInterval(intervalId);
                } else {
                    setError('No se encontraron instancias para este usuario.');
                }
            } catch (error) {
                setError('Error al cargar instancias: ' + (error instanceof Error ? error.message : String(error)));
            }
        };

        loadInstances();
    }, [userId]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleBackdropClick = (event: React.MouseEvent) => {
        // Cierra el modal solo si se hace clic en el fondo (no en el contenido del modal)
        if (event.currentTarget === event.target) {
            handleCloseModal();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <Button
                onClick={handleOpenModal}
                variant={connectionStatus ? "default" : "secondary"}
                className="flex items-center gap-2"
            >
                {connectionStatus ? (
                    <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Conectado
                    </>
                ) : (
                    <>
                        <Link className="w-4 h-4" />
                        Conectar
                    </>
                )}
            </Button>

            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent onClick={handleBackdropClick}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            {connectionStatus ? "¡Conexión exitosa!" : "Escanea el código QR"}
                        </DialogTitle>
                        <DialogDescription>
                            {connectionStatus
                                ? "Ya puedes usar la integración con WhatsApp."
                                : "Sigue las instrucciones antes de escanear el código QR."}
                        </DialogDescription>
                    </DialogHeader>

                    {loading && (
                        <div className="flex items-center justify-center">
                            <Loader2 className="animate-spin w-6 h-6" />
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!error && !loading && (
                        <>
                            {connectionStatus ? (
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircle className="w-10 h-10 text-green-500" />
                                    <p className="text-green-600 font-medium">WhatsApp conectado correctamente</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    {qrCode && (
                                        <Image
                                            src={qrCode}
                                            alt="Código QR"
                                            width={224}
                                            height={224}
                                            className="mx-auto rounded-lg border"
                                        />
                                    )}
                                    <div className="mt-4 text-left space-y-2 text-sm text-gray-700 max-w-sm">
                                        <h3 className="font-semibold text-base">🤚 Lee antes de escanear:</h3>
                                        <ul className="list-decimal list-inside space-y-1">
                                            <li>
                                                Abre <span className="font-bold text-black">WhatsApp Business</span> en tu teléfono.
                                            </li>
                                            <li>
                                                Toca el icono <span className="font-bold text-black">Dispositivos vinculados</span> &gt; vincular un <span className="font-bold text-black">dispositivo</span>.
                                            </li>
                                            <li>
                                                Apunta la <span className="font-bold text-black">cámara</span> de tu teléfono a la pantalla para escanear el código <span className="font-bold text-black">QR</span>.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QRCodeGenerator;