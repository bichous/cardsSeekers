import { Router } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { requireAuth } from '../middleware/auth'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Solo se permiten imágenes'))
  },
})

// POST /api/upload  — sube una imagen a Cloudinary y devuelve la URL segura
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se recibió ningún archivo' })
    return
  }

  const stream = cloudinary.uploader.upload_stream(
    { folder: 'cardseekers/products', resource_type: 'image' },
    (error, result) => {
      if (error || !result) {
        res.status(500).json({ error: 'Error al subir a Cloudinary' })
        return
      }
      res.json({ url: result.secure_url })
    }
  )

  stream.end(req.file.buffer)
})

export default router
