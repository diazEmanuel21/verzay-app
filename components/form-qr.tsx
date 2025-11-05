'use client';

import { useEffect, useState } from 'react';
import { getInstances, generateQRCode } from '@/actions/api-action';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, QrCode, CheckCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Skeleton } from './ui/skeleton';

interface QRCodeGeneratorProps {
    instanceName: string;
    instanceId: string;
}

interface QRCodeGeneratorComponentProps {
    userId: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorComponentProps> = ({ userId }) => {
    const router = useRouter();
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [instanceData, setInstanceData] = useState<QRCodeGeneratorProps | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const fetchQRCode = async (instanceName: string) => {
        setLoading(true);
        const response = await generateQRCode({ instanceName, userId });
        if (response.success) {
            setQrCode(response.qr?.code || null);
            setConnectionStatus(response.connectionState?.instance.state || null);
            router.refresh();
        }
        setLoading(false);
    };

    useEffect(() => {
        const loadInstances = async () => {
            try {
                const instances = await getInstances(userId);

                if (Array.isArray(instances) && instances.length > 0) {
                    const whatsappInstance = instances.findIndex(i=>i.instanceType=='Whatsapp')                
                    const { instanceName, instanceId } = instances[whatsappInstance];
                    setInstanceData({ instanceName, instanceId });
                    fetchQRCode(instanceName);

                    const intervalId = setInterval(() => {
                        fetchQRCode(instanceName);
                    }, 40000);

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
        // Cierra el modal solo si se hace clic en el fondo (no en el content del modal)
        if (event.currentTarget === event.target) {
            handleCloseModal();
        }
    };

    return (
        <>
            {loading ? (
                <Skeleton className="w-full h-10 rounded-md" />
            ) : (
                <Button
                    className={`w-full transition-all duration-300 ${!connectionStatus
                        ? "shadow-[0_0_12px_#22c55e] hover:shadow-[0_0_18px_#22c55e] ring-1 ring-green-400"
                        : ""
                        }`}
                    onClick={handleOpenModal}
                    variant={connectionStatus ? "default" : "secondary"}
                >
                    <QrCode className="mr-2 h-4 w-4" />
                    {connectionStatus ? "Conectado" : "Conectar"}
                </Button>
            )}

            <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
                <DialogContent onClick={handleBackdropClick} className="border-border">
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
                                    <div className="mt-4 text-left space-y-2 text-sm max-w-sm">
                                        <h3 className="font-semibold text-base">🤚 Lee antes de escanear:</h3>
                                        <ul className="list-decimal list-inside space-y-1">
                                            <li>
                                                Abre <span className="font-bold">WhatsApp Business</span> en tu teléfono.
                                            </li>
                                            <li>
                                                Toca el icono <span className="font-bold">Dispositivos vinculados</span> &gt; vincular un <span className="font-bold">dispositivo</span>.
                                            </li>
                                            <li>
                                                Apunta la <span className="font-bold">cámara</span> de tu teléfono a la pantalla para escanear el código<span className="font-bold ">QR</span>.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default QRCodeGenerator;