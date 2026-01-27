import { Appointment, NotificationType, NotificationChannel } from '@medgo/shared-types'
import axios from 'axios'

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003/api'

export class AppointmentNotificationService {
  private async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ) {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications`, {
        userId,
        type,
        channel: NotificationChannel.EMAIL,
        title,
        message,
        data,
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  async notifyAppointmentCreated(appointment: Appointment) {
    const scheduledDate = new Date(appointment.scheduledDate).toLocaleString('pt-BR')

    await this.sendNotification(
      appointment.patient.userId,
      NotificationType.APPOINTMENT_CONFIRMED,
      'Agendamento Criado',
      `Seu agendamento foi criado para ${scheduledDate} no ${appointment.hospital.name}.`,
      {
        appointmentId: appointment.id,
        hospitalName: appointment.hospital.name,
        doctorName: appointment.doctor.name,
        scheduledDate: appointment.scheduledDate,
      }
    )
  }

  async notifyAppointmentConfirmed(appointment: Appointment) {
    const scheduledDate = new Date(appointment.scheduledDate).toLocaleString('pt-BR')

    await this.sendNotification(
      appointment.patient.userId,
      NotificationType.APPOINTMENT_CONFIRMED,
      'Agendamento Confirmado',
      `Seu agendamento para ${scheduledDate} foi confirmado!`,
      {
        appointmentId: appointment.id,
        hospitalName: appointment.hospital.name,
        doctorName: appointment.doctor.name,
        scheduledDate: appointment.scheduledDate,
      }
    )
  }

  async notifyAppointmentCancelled(appointment: Appointment) {
    const scheduledDate = new Date(appointment.scheduledDate).toLocaleString('pt-BR')

    await this.sendNotification(
      appointment.patient.userId,
      NotificationType.APPOINTMENT_CANCELLED,
      'Agendamento Cancelado',
      `Seu agendamento para ${scheduledDate} foi cancelado. ${
        appointment.cancellationReason
          ? `Motivo: ${appointment.cancellationReason}`
          : ''
      }`,
      {
        appointmentId: appointment.id,
        hospitalName: appointment.hospital.name,
        cancellationReason: appointment.cancellationReason,
      }
    )
  }

  async notifyAppointmentRescheduled(appointment: Appointment) {
    const scheduledDate = new Date(appointment.scheduledDate).toLocaleString('pt-BR')

    await this.sendNotification(
      appointment.patient.userId,
      NotificationType.APPOINTMENT_RESCHEDULED,
      'Agendamento Reagendado',
      `Seu agendamento foi reagendado para ${scheduledDate}.`,
      {
        appointmentId: appointment.id,
        hospitalName: appointment.hospital.name,
        doctorName: appointment.doctor.name,
        scheduledDate: appointment.scheduledDate,
      }
    )
  }

  async sendAppointmentReminder(appointment: Appointment) {
    const scheduledDate = new Date(appointment.scheduledDate).toLocaleString('pt-BR')
    const timeUntil = this.getTimeUntilAppointment(appointment.scheduledDate)

    await this.sendNotification(
      appointment.patient.userId,
      NotificationType.APPOINTMENT_REMINDER,
      'Lembrete de Agendamento',
      `Você tem um agendamento ${timeUntil} no ${appointment.hospital.name} com Dr(a). ${appointment.doctor.name}.`,
      {
        appointmentId: appointment.id,
        hospitalName: appointment.hospital.name,
        hospitalAddress: appointment.hospital.address,
        doctorName: appointment.doctor.name,
        scheduledDate: appointment.scheduledDate,
      }
    )
  }

  private getTimeUntilAppointment(scheduledDate: Date): string {
    const now = new Date()
    const scheduled = new Date(scheduledDate)
    const diffMs = scheduled.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `em ${diffDays} dia${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `em ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else {
      return 'em breve'
    }
  }

  async scheduleAppointmentReminders(appointment: Appointment) {
    const scheduledDate = new Date(appointment.scheduledDate)
    const now = new Date()

    const oneDayBefore = new Date(scheduledDate)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    oneDayBefore.setHours(9, 0, 0, 0)

    if (oneDayBefore > now) {
      await this.sendNotification(
        appointment.patient.userId,
        NotificationType.APPOINTMENT_REMINDER,
        'Lembrete de Agendamento - 1 dia',
        `Lembrete: Você tem um agendamento amanhã às ${scheduledDate.toLocaleTimeString(
          'pt-BR',
          { hour: '2-digit', minute: '2-digit' }
        )} no ${appointment.hospital.name}.`,
        {
          appointmentId: appointment.id,
          hospitalName: appointment.hospital.name,
          scheduledDate: appointment.scheduledDate,
        }
      )
    }

    const oneHourBefore = new Date(scheduledDate)
    oneHourBefore.setHours(oneHourBefore.getHours() - 1)

    if (oneHourBefore > now) {
      await this.sendNotification(
        appointment.patient.userId,
        NotificationType.APPOINTMENT_REMINDER,
        'Lembrete de Agendamento - 1 hora',
        `Lembrete: Seu agendamento é em 1 hora no ${appointment.hospital.name}.`,
        {
          appointmentId: appointment.id,
          hospitalName: appointment.hospital.name,
          hospitalAddress: appointment.hospital.address,
          scheduledDate: appointment.scheduledDate,
        }
      )
    }
  }
}
