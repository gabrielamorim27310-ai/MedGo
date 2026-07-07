import { TissGuide, TussProcedure } from '@acolhe/shared-types'
import { prisma } from '../lib/prisma'
import { AppError } from '../middlewares/errorHandler'

/**
 * Prontuário eletrônico integrado no padrão TISS (Troca de Informações
 * na Saúde Suplementar / ANS): gera a guia de consulta a partir do
 * atendimento concluído, pronta para envio à operadora — eliminando a
 * papelada da recepção.
 */
export class TissService {
  /** Número de guia no padrão prestador: AAAAMMDD + sequência do dia. */
  async generateGuideNumber(): Promise<string> {
    const today = new Date()
    const datePart = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('')

    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)

    const issuedToday = await prisma.appointment.count({
      where: {
        tissGuideNumber: { not: null },
        updatedAt: { gte: startOfDay },
      },
    })

    return `${datePart}-${String(issuedToday + 1).padStart(5, '0')}`
  }

  async buildGuide(appointmentId: string): Promise<TissGuide> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        hospital: {
          select: { name: true, cnpj: true },
        },
        patient: {
          include: {
            user: { select: { name: true, cpf: true } },
            healthInsurance: { select: { name: true } },
          },
        },
      },
    })

    if (!appointment) {
      throw new AppError('Atendimento não encontrado', 404)
    }

    if (appointment.status !== 'COMPLETED') {
      throw new AppError('Guia TISS só pode ser emitida para atendimentos concluídos', 422)
    }

    const doctor = await prisma.user.findUnique({
      where: { id: appointment.doctorId },
      select: { name: true },
    })

    const procedures = Array.isArray(appointment.tussProcedures)
      ? (appointment.tussProcedures as unknown as TussProcedure[])
      : []

    return {
      guideNumber: appointment.tissGuideNumber ?? (await this.generateGuideNumber()),
      guideType: 'CONSULTA',
      issuedAt: new Date(),
      provider: {
        cnpj: appointment.hospital.cnpj,
        name: appointment.hospital.name,
      },
      beneficiary: {
        name: appointment.patient.user.name,
        cpf: appointment.patient.user.cpf,
        healthInsuranceNumber: appointment.patient.healthInsuranceNumber ?? undefined,
        healthInsuranceName: appointment.patient.healthInsurance?.name,
      },
      professional: {
        name: doctor?.name ?? 'Profissional não identificado',
      },
      attendance: {
        date: appointment.scheduledDate,
        specialty: appointment.specialty,
        cid10: appointment.cid10 ?? undefined,
        reason: appointment.reason,
        diagnosis: appointment.diagnosis ?? undefined,
      },
      procedures,
    }
  }
}

export const tissService = new TissService()
