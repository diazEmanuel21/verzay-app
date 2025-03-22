import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No se proporcionó un archivo.' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucketName = process.env.S3_BUCKET_NAME || 'uploads';
    const fileName = `${randomUUID()}-${file.name}`;

    await minioClient.putObject(
      bucketName,
      fileName,
      buffer,
      buffer.length, // ¡Aquí le pasas el tamaño!
      { 'Content-Type': file.type } // Metadata
    );

    const fileUrl = `${process.env.S3_PUBLIC_URL}/${bucketName}/${fileName}`;
    return NextResponse.json({
      message: 'Archivo subido con éxito.',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Error subiendo el archivo a MinIO:', error);
    return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 });
  }
}