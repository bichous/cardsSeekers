import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import usersRouter from './routes/users'
import ordersRouter from './routes/orders'
import adminRouter from './routes/admin'
import productsRouter from './routes/products'
import uploadRouter from './routes/upload'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin', adminRouter)
app.use('/api/products', productsRouter)
app.use('/api/upload', uploadRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
