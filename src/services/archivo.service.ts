import { supabase } from '../config/supabase';
import { archivoRepository } from '../repositories/archivo.repository';
import { AppError } from '../middlewares/errorHandler';
import { Archivo } from '../types/models';
import { ArchivoMetaDto, JwtPayload } from '../types/dtos';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const archivoService = {
  async subir(
    file: Express.Multer.File,
    meta: ArchivoMetaDto,
    usuario: JwtPayload
  ): Promise<Archivo> {
    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError(
        'Tipo de archivo no permitido. Tipos aceptados: JPEG, PNG, WebP, GIF',
        422,
        [
          `Tipo recibido: ${file.mimetype}`,
          `Tipos permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`,
        ]
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('El archivo excede el tamaño máximo permitido de 5 MB', 422, [
        `Tamaño recibido: ${file.size} bytes`,
        `Tamaño máximo: ${MAX_FILE_SIZE} bytes`,
      ]);
    }

    // Generate unique path: {modulo}/{timestamp}-{originalname}
    const filePath = `${meta.modulo}/${Date.now()}-${file.originalname}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('archivos')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new AppError(`Error al subir el archivo: ${uploadError.message}`, 500);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('archivos')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Register in archivos table
    const archivo = await archivoRepository.insert({
      nombre_archivo: file.originalname,
      url: publicUrl,
      tipo_archivo: file.mimetype,
      modulo: meta.modulo,
      referencia_id: meta.referencia_id ?? null,
      subido_por: usuario.usuario_id,
    });

    return archivo;
  },
};
