import { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from './auth'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Recursos com dados pessoais/sensíveis cuja manipulação deve ser
// registrada (LGPD, art. 37 — registro das operações de tratamento).
const AUDITED_RESOURCES = [
  'patients',
  'users',
  'queues',
  'appointments',
  'dependents',
  'health-insurances',
]

function resourceFromPath(path: string): { resource: string; resourceId?: string } | null {
  const segments = path.split('/').filter(Boolean) // ex.: ['api', 'patients', ':id']
  const apiIndex = segments.indexOf('api')
  const resource = segments[apiIndex + 1]

  if (!resource || !AUDITED_RESOURCES.includes(resource)) {
    return null
  }

  const candidate = segments[apiIndex + 2]
  const looksLikeId = candidate && /^[0-9a-f-]{8,}$/i.test(candidate)

  return { resource, resourceId: looksLikeId ? candidate : undefined }
}

/**
 * Trilha de auditoria: registra toda operação de escrita sobre recursos
 * com dados pessoais. Gravação assíncrona e tolerante a falhas — auditoria
 * nunca derruba a requisição.
 */
export function auditTrail(req: AuthRequest, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) {
    return next()
  }

  const target = resourceFromPath(req.path)

  if (!target) {
    return next()
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) return

    prisma.auditLog
      .create({
        data: {
          actorId: req.user?.id,
          actorRole: req.user?.role,
          action: `${req.method} ${req.path}`,
          resource: target.resource,
          resourceId: target.resourceId,
          ip: req.ip,
          userAgent: req.headers['user-agent']?.slice(0, 255),
          metadata: { statusCode: res.statusCode },
        },
      })
      .catch((error) => {
        console.error('[auditTrail] falha ao registrar auditoria:', error)
      })
  })

  next()
}
