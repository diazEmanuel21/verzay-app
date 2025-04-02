
export const validateFileType = (file: File, nodeType: string): boolean => {
    const validTypes: Record<string, string[]> = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        video: ['video/mp4', 'video/webm', 'video/ogg'],
        audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    // Si el tipo no está definido o es '*', aceptamos cualquier archivo
    if (!validTypes[nodeType] || nodeType === '*') return true;

    return validTypes[nodeType].includes(file.type);
};