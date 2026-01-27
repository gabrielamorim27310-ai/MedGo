import { Request, Response } from 'express'
import { AppointmentController } from '../../controllers/AppointmentController'
import { prisma } from '../../lib/prisma'
import { AppointmentStatus, AppointmentType } from '@medgo/shared-types'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}))

jest.mock('../../services/AppointmentNotificationService')

describe('AppointmentController', () => {
  let appointmentController: AppointmentController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    appointmentController = new AppointmentController()
    mockRequest = {
      body: {},
      params: {},
      query: {},
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create appointment successfully', async () => {
      const mockAppointment = {
        id: '1',
        patientId: 'patient-1',
        hospitalId: 'hospital-1',
        doctorId: 'doctor-1',
        type: AppointmentType.IN_PERSON,
        scheduledDate: new Date('2026-02-01T10:00:00'),
        reason: 'Consulta de rotina',
        status: AppointmentStatus.SCHEDULED,
        patient: {
          id: 'patient-1',
          name: 'João Silva',
          userId: 'user-1',
        },
        hospital: {
          id: 'hospital-1',
          name: 'Hospital Central',
          address: 'Rua A, 123',
        },
        doctor: {
          id: 'doctor-1',
          name: 'Dr. Maria',
          email: 'maria@example.com',
        },
      }

      mockRequest.body = {
        patientId: 'patient-1',
        hospitalId: 'hospital-1',
        doctorId: 'doctor-1',
        type: AppointmentType.IN_PERSON,
        scheduledDate: '2026-02-01T10:00:00',
        reason: 'Consulta de rotina',
      }

      ;(prisma.appointment.create as jest.Mock).mockResolvedValue(mockAppointment)

      await appointmentController.create(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointment)
    })

    it('should handle error when creating appointment', async () => {
      mockRequest.body = {
        patientId: 'patient-1',
        hospitalId: 'hospital-1',
        doctorId: 'doctor-1',
      }

      ;(prisma.appointment.create as jest.Mock).mockRejectedValue(
        new Error('Database error')
      )

      await appointmentController.create(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error creating appointment',
      })
    })
  })

  describe('findAll', () => {
    it('should return paginated appointments', async () => {
      const mockAppointments = [
        {
          id: '1',
          status: AppointmentStatus.SCHEDULED,
          patient: { id: '1', name: 'João Silva', cpf: '12345678901', phone: '11999999999' },
          hospital: { id: '1', name: 'Hospital Central', address: 'Rua A, 123' },
          doctor: { id: '1', name: 'Dr. Maria', email: 'maria@example.com' },
        },
      ]

      mockRequest.query = {
        page: '1',
        limit: '20',
      }

      ;(prisma.appointment.findMany as jest.Mock).mockResolvedValue(mockAppointments)
      ;(prisma.appointment.count as jest.Mock).mockResolvedValue(1)

      await appointmentController.findAll(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockAppointments,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    })

    it('should filter by status', async () => {
      mockRequest.query = {
        page: '1',
        limit: '20',
        status: AppointmentStatus.CONFIRMED,
      }

      ;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.appointment.count as jest.Mock).mockResolvedValue(0)

      await appointmentController.findAll(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AppointmentStatus.CONFIRMED,
          }),
        })
      )
    })
  })

  describe('confirm', () => {
    it('should confirm appointment successfully', async () => {
      const mockAppointment = {
        id: '1',
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
        patient: { id: '1', name: 'João Silva', userId: 'user-1' },
        hospital: { id: '1', name: 'Hospital Central' },
        doctor: { id: '1', name: 'Dr. Maria', email: 'maria@example.com' },
      }

      mockRequest.params = { id: '1' }

      ;(prisma.appointment.update as jest.Mock).mockResolvedValue(mockAppointment)

      await appointmentController.confirm(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointment)
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            status: AppointmentStatus.CONFIRMED,
          }),
        })
      )
    })
  })

  describe('cancel', () => {
    it('should cancel appointment with reason', async () => {
      const mockAppointment = {
        id: '1',
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Conflito de agenda',
        patient: { id: '1', name: 'João Silva', userId: 'user-1' },
        hospital: { id: '1', name: 'Hospital Central' },
        doctor: { id: '1', name: 'Dr. Maria', email: 'maria@example.com' },
      }

      mockRequest.params = { id: '1' }
      mockRequest.body = { reason: 'Conflito de agenda' }

      ;(prisma.appointment.update as jest.Mock).mockResolvedValue(mockAppointment)

      await appointmentController.cancel(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointment)
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AppointmentStatus.CANCELLED,
            cancellationReason: 'Conflito de agenda',
          }),
        })
      )
    })
  })

  describe('checkIn', () => {
    it('should check in appointment successfully', async () => {
      const mockAppointment = {
        id: '1',
        status: AppointmentStatus.CHECKED_IN,
        checkedInAt: new Date(),
        patient: { id: '1', name: 'João Silva', userId: 'user-1' },
        hospital: { id: '1', name: 'Hospital Central' },
        doctor: { id: '1', name: 'Dr. Maria', email: 'maria@example.com' },
      }

      mockRequest.params = { id: '1' }

      ;(prisma.appointment.update as jest.Mock).mockResolvedValue(mockAppointment)

      await appointmentController.checkIn(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith(mockAppointment)
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: AppointmentStatus.CHECKED_IN,
          }),
        })
      )
    })
  })

  describe('getAvailableSlots', () => {
    it('should return available time slots', async () => {
      mockRequest.query = {
        hospitalId: 'hospital-1',
        date: '2026-02-01',
      }

      ;(prisma.appointment.findMany as jest.Mock).mockResolvedValue([])

      await appointmentController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-02-01',
          availableSlots: expect.any(Array),
          totalSlots: expect.any(Number),
        })
      )
    })

    it('should return 400 if hospitalId is missing', async () => {
      mockRequest.query = {
        date: '2026-02-01',
      }

      await appointmentController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'hospitalId and date are required',
      })
    })
  })

  describe('getStatistics', () => {
    it('should return appointment statistics', async () => {
      mockRequest.query = {
        hospitalId: 'hospital-1',
      }

      ;(prisma.appointment.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.appointment.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { status: AppointmentStatus.SCHEDULED, _count: 20 },
          { status: AppointmentStatus.CONFIRMED, _count: 30 },
        ])
        .mockResolvedValueOnce([
          { type: AppointmentType.IN_PERSON, _count: 70 },
          { type: AppointmentType.TELEMEDICINE, _count: 30 },
        ])

      await appointmentController.getStatistics(
        mockRequest as Request,
        mockResponse as Response
      )

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          total: 100,
          byStatus: expect.any(Object),
          byType: expect.any(Object),
          upcoming: expect.any(Number),
          today: expect.any(Number),
        })
      )
    })
  })
})
