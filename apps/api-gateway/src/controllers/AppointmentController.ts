import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import {
  AppointmentStatus,
  AppointmentType,
  CreateAppointmentDTO,
  UpdateAppointmentDTO,
} from '@medgo/shared-types'
import { AppointmentNotificationService } from '../services/AppointmentNotificationService'

export class AppointmentController {
  private notificationService: AppointmentNotificationService

  constructor() {
    this.notificationService = new AppointmentNotificationService()
  }

  async create(req: Request, res: Response) {
    try {
      const data: CreateAppointmentDTO = req.body

      const appointment = await prisma.appointment.create({
        data: {
          ...data,
          status: AppointmentStatus.SCHEDULED,
        },
        include: {
          patient: true,
          hospital: true,
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      await this.notificationService.notifyAppointmentCreated(appointment as any)
      await this.notificationService.scheduleAppointmentReminders(appointment as any)

      res.status(201).json(appointment)
    } catch (error) {
      console.error('Error creating appointment:', error)
      res.status(500).json({ message: 'Error creating appointment' })
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        status,
        type,
        hospitalId,
        patientId,
        doctorId,
        startDate,
        endDate,
      } = req.query

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
      const take = parseInt(limit as string)

      const where: any = {}

      if (status) where.status = status
      if (type) where.type = type
      if (hospitalId) where.hospitalId = hospitalId
      if (patientId) where.patientId = patientId
      if (doctorId) where.doctorId = doctorId

      if (startDate || endDate) {
        where.scheduledDate = {}
        if (startDate) where.scheduledDate.gte = new Date(startDate as string)
        if (endDate) where.scheduledDate.lte = new Date(endDate as string)
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take,
          include: {
            patient: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    cpf: true,
                    phone: true,
                  },
                },
              },
            },
            hospital: {
              select: {
                id: true,
                name: true,
                street: true,
                number: true,
                neighborhood: true,
                city: true,
                state: true,
              },
            },
          },
          orderBy: { scheduledDate: 'asc' },
        }),
        prisma.appointment.count({ where }),
      ])

      res.json({
        data: appointments,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / take),
      })
    } catch (error) {
      console.error('Error fetching appointments:', error)
      res.status(500).json({ message: 'Error fetching appointments' })
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const { id } = req.params

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  cpf: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' })
      }

      res.json(appointment)
    } catch (error) {
      console.error('Error fetching appointment:', error)
      res.status(500).json({ message: 'Error fetching appointment' })
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data: UpdateAppointmentDTO = req.body

      const appointment = await prisma.appointment.update({
        where: { id },
        data,
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  cpf: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      res.json(appointment)
    } catch (error) {
      console.error('Error updating appointment:', error)
      res.status(500).json({ message: 'Error updating appointment' })
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params

      await prisma.appointment.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      res.status(500).json({ message: 'Error deleting appointment' })
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const { id } = req.params

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CONFIRMED,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      res.json(appointment)
    } catch (error) {
      console.error('Error confirming appointment:', error)
      res.status(500).json({ message: 'Error confirming appointment' })
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { reason } = req.body

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: reason ? `Cancelado: ${reason}` : undefined,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      res.json(appointment)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      res.status(500).json({ message: 'Error cancelling appointment' })
    }
  }

  async reschedule(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { scheduledDate, reason } = req.body

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          scheduledDate: new Date(scheduledDate),
          status: AppointmentStatus.RESCHEDULED,
          notes: reason ? `Reagendado: ${reason}` : undefined,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      res.json(appointment)
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      res.status(500).json({ message: 'Error rescheduling appointment' })
    }
  }

  async checkIn(req: Request, res: Response) {
    try {
      const { id } = req.params

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.IN_PROGRESS,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      res.json(appointment)
    } catch (error) {
      console.error('Error checking in appointment:', error)
      res.status(500).json({ message: 'Error checking in appointment' })
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { notes } = req.body

      const appointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: AppointmentStatus.COMPLETED,
          notes: notes || undefined,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
          hospital: true,
        },
      })

      res.json(appointment)
    } catch (error) {
      console.error('Error completing appointment:', error)
      res.status(500).json({ message: 'Error completing appointment' })
    }
  }

  async getAvailableSlots(req: Request, res: Response) {
    try {
      const { hospitalId, doctorId, date, specialtyId } = req.query

      if (!hospitalId || !date) {
        return res.status(400).json({
          message: 'hospitalId and date are required',
        })
      }

      const selectedDate = new Date(date as string)
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999))

      const where: any = {
        hospitalId: hospitalId as string,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
        },
      }

      if (doctorId) where.doctorId = doctorId
      if (specialtyId) where.specialtyId = specialtyId

      const bookedAppointments = await prisma.appointment.findMany({
        where,
        select: {
          scheduledDate: true,
        },
      })

      const workingHours = {
        start: 8,
        end: 18,
      }

      const slotDuration = 30

      const availableSlots: string[] = []
      const bookedTimes = new Set(
        bookedAppointments.map((app) => app.scheduledDate.toISOString())
      )

      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotTime = new Date(selectedDate)
          slotTime.setHours(hour, minute, 0, 0)

          if (!bookedTimes.has(slotTime.toISOString())) {
            availableSlots.push(slotTime.toISOString())
          }
        }
      }

      res.json({
        date: date,
        availableSlots,
        totalSlots: availableSlots.length,
      })
    } catch (error) {
      console.error('Error fetching available slots:', error)
      res.status(500).json({ message: 'Error fetching available slots' })
    }
  }

  async getStatistics(req: Request, res: Response) {
    try {
      const { hospitalId, startDate, endDate } = req.query

      const where: any = {}
      if (hospitalId) where.hospitalId = hospitalId
      if (startDate || endDate) {
        where.scheduledDate = {}
        if (startDate) where.scheduledDate.gte = new Date(startDate as string)
        if (endDate) where.scheduledDate.lte = new Date(endDate as string)
      }

      const [total, byStatus, byType, upcoming, today] = await Promise.all([
        prisma.appointment.count({ where }),
        prisma.appointment.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.appointment.groupBy({
          by: ['type'],
          where,
          _count: true,
        }),
        prisma.appointment.count({
          where: {
            ...where,
            scheduledDate: {
              gte: new Date(),
            },
            status: {
              notIn: [
                AppointmentStatus.CANCELLED,
                AppointmentStatus.COMPLETED,
                AppointmentStatus.NO_SHOW,
              ],
            },
          },
        }),
        prisma.appointment.count({
          where: {
            ...where,
            scheduledDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
      ])

      res.json({
        total,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>),
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count
          return acc
        }, {} as Record<string, number>),
        upcoming,
        today,
      })
    } catch (error) {
      console.error('Error fetching appointment statistics:', error)
      res.status(500).json({ message: 'Error fetching appointment statistics' })
    }
  }
}
