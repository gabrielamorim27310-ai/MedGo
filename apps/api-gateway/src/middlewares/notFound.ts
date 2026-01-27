import { Request, Response } from 'express'

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  })
}
