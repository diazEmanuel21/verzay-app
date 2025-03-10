'use client';

import React, { useEffect, useState } from 'react';
import { getInstances, generarCodigoQR } from '@/actions/api-action';
import Image from 'next/image';

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
        <div className='flex flex-col items-center justify-center'>
            <button 
                onClick={handleOpenModal}
                className={`px-4 py-2 rounded-md text-white ${connectionStatus ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'}`} // Cambiamos las clases aquí
            >
                {connectionStatus ? 'Conectado' : 'Conectar'}
            </button>

            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center"
                    onClick={handleBackdropClick} // Manejar clics en el fondo
                >
                    <div className="bg-white relative text-center rounded-lg p-2">
                        <button 
                            onClick={handleCloseModal} 
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" 
                        >
                            Cerrar
                        </button>

                        {loading && <p>Cargando...</p>}
                        {error ? (
                            <p>{error}</p>
                        ) : (
                            <>
                                {connectionStatus ? (
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold text-black my-4">¡Super! Se completaron los Pasos</h3>
                                        <p className="text-green-500">WhatsApp Conectado</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <div className="bg-white p-4 rounded-lg text-center">
                                        {qrCode && (
                                            <Image
                                                src={qrCode}
                                                alt="Código QR"
                                                width={224} // equivalente a w-56 (56 * 4px = 224px)
                                                height={224} // o el alto que desees
                                                className="mx-auto"
                                            />
                                        )}
                                            <div className="mx-12">
                                                <h3 className="text-lg font-semibold text-black my-4">🤚 Lee antes de escanear</h3>
                                                <ul className="text-left text-sm text-gray-700">
                                                    <li className='py-1'>1. Abre <span className="font-bold text-black">WhatsApp Business</span> en tu teléfono.</li>
                                                    <li className='py-1'>2. Toca el icono <span className="font-bold text-black">Dispositivos vinculados</span> &gt; vincular un <span className="font-bold text-black">dispositivo</span>.</li>
                                                    <li className='py-1'>3. Apunta la <span className="font-bold text-black">cámara</span> de tu teléfono a la pantalla del dispositivo que quieras vincular para escanear el código <span className="font-bold text-black">QR</span>.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRCodeGenerator;