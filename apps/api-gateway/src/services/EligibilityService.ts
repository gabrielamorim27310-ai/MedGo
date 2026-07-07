import { EligibilityResult } from '@acolhe/shared-types'
import { prisma } from '../lib/prisma'

/**
 * Verificação de elegibilidade junto à operadora no momento do check-in:
 * confere se o hospital aceita o plano do paciente e se o plano cobre o
 * tipo de atendimento — substituindo a triagem manual de carteirinha
 * na recepção.
 */
export class EligibilityService {
  async check(params: {
    patientId: string
    hospitalId: string
    specialty: string
    isEmergency: boolean
  }): Promise<EligibilityResult> {
    const { patientId, hospitalId, specialty, isEmergency } = params
    const reasons: string[] = []

    const [patient, hospital] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          healthInsurance: {
            include: {
              plans: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
      prisma.hospital.findUnique({
        where: { id: hospitalId },
        select: { acceptedHealthInsurances: true, name: true },
      }),
    ])

    const checkedAt = new Date()

    if (!patient || !hospital) {
      return {
        eligible: false,
        checkedAt,
        reasons: ['Paciente ou hospital não encontrado'],
      }
    }

    // Paciente particular (sem plano): sempre elegível, sem cobertura.
    if (!patient.healthInsurance) {
      return {
        eligible: true,
        checkedAt,
        reasons: ['Atendimento particular (sem plano vinculado)'],
      }
    }

    const insurance = patient.healthInsurance

    if (insurance.status !== 'ACTIVE') {
      reasons.push(`Operadora ${insurance.name} está com status ${insurance.status}`)
    }

    const hospitalAccepts =
      hospital.acceptedHealthInsurances.includes(insurance.id) ||
      hospital.acceptedHealthInsurances.includes(insurance.name)

    if (!hospitalAccepts) {
      reasons.push(`${hospital.name} não é conveniado à operadora ${insurance.name}`)
    }

    // Melhor plano ativo que cobre o atendimento solicitado.
    const coveringPlan = insurance.plans.find((plan) => {
      if (isEmergency) return plan.coverageEmergencyRoom
      return (
        plan.coverageSpecialties.length === 0 ||
        plan.coverageSpecialties.includes(specialty)
      )
    })

    if (!coveringPlan && insurance.plans.length > 0) {
      reasons.push(
        isEmergency
          ? 'Nenhum plano ativo cobre pronto-socorro'
          : `Nenhum plano ativo cobre a especialidade ${specialty}`
      )
    }

    const eligible = reasons.length === 0

    return {
      eligible,
      checkedAt,
      healthInsuranceId: insurance.id,
      healthInsuranceName: insurance.name,
      planName: coveringPlan?.name,
      coPayment: coveringPlan
        ? isEmergency
          ? coveringPlan.coPaymentEmergency
          : coveringPlan.coPaymentConsultation
        : undefined,
      reasons: eligible ? ['Cobertura confirmada'] : reasons,
    }
  }
}

export const eligibilityService = new EligibilityService()
