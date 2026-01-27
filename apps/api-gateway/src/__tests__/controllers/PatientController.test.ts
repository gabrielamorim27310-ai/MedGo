import { Request, Response, NextFunction } from 'express'
import { PatientController } from '../../controllers/PatientController'
import { prisma } from '../../lib/prisma'
import { BloodType, Gender } from '@medgo/shared-types'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    patient: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

describe('PatientController', () => {
  let patientController: PatientController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    patientController = new PatientController()
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
    mockNext = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create patient successfully', async () => {
      const mockPatient = {
        id: '1',
        name: 'João Silva',
        cpf: '12345678901',
        email: 'joao@example.com',
        phone: '11987654321',
        birthDate: new Date('1990-01-01'),
        gender: Gender.MALE,
        bloodType: BloodType.A_POSITIVE,
        address: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
        emergencyContact: {
          name: 'Maria Silva',
          phone: '11987654322',
          relationship: 'Esposa',
        },
        healthInsuranceId: 'insurance-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRequest.body = {
        name: 'João Silva',
        cpf: '12345678901',
        email: 'joao@example.com',
        phone: '11987654321',
        birthDate: '1990-01-01',
        gender: Gender.MALE,
        bloodType: BloodType.A_POSITIVE,
        address: 'Rua A, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
      }

      ;(prisma.patient.create as jest.Mock).mockResolvedValue(mockPatient)

      await patientController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith(mockPatient)
    })

    it('should call next with error when creating patient fails', async () => {
      mockRequest.body = {
        name: 'João Silva',
      }

      const dbError = new Error('Database error')
      ;(prisma.patient.create as jest.Mock).mockRejectedValue(dbError)

      await patientController.create(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(dbError)
    })
  })

  describe('list', () => {
    it('should return paginated patients', async () => {
      const mockPatients = [
        {
          id: '1',
          name: 'João Silva',
          cpf: '12345678901',
          email: 'joao@example.com',
          phone: '11987654321',
          birthDate: new Date('1990-01-01'),
          gender: Gender.MALE,
        },
        {
          id: '2',
          name: 'Maria Santos',
          cpf: '98765432109',
          email: 'maria@example.com',
          phone: '11987654322',
          birthDate: new Date('1985-05-15'),
          gender: Gender.FEMALE,
        },
      ]

      mockRequest.query = {
        page: '1',
        limit: '20',
      }

      ;(prisma.patient.findMany as jest.Mock).mockResolvedValue(mockPatients)
      ;(prisma.patient.count as jest.Mock).mockResolvedValue(2)

      await patientController.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockPatients,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      })
    })

    it('should filter by search term', async () => {
      mockRequest.query = {
        page: '1',
        limit: '20',
        search: 'João',
      }

      ;(prisma.patient.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.patient.count as jest.Mock).mockResolvedValue(0)

      await patientController.list(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              OR: expect.any(Array),
            }),
          }),
        })
      )
    })
  })

  describe('getById', () => {
    it('should return patient by id', async () => {
      const mockPatient = {
        id: '1',
        name: 'João Silva',
        cpf: '12345678901',
        email: 'joao@example.com',
      }

      mockRequest.params = { id: '1' }

      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient)

      await patientController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith(mockPatient)
    })

    it('should call next with AppError if patient not found', async () => {
      mockRequest.params = { id: '999' }

      ;(prisma.patient.findUnique as jest.Mock).mockResolvedValue(null)

      await patientController.getById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
        })
      )
    })
  })

  describe('update', () => {
    it('should update patient successfully', async () => {
      const mockUpdatedPatient = {
        id: '1',
        name: 'João Silva Updated',
        cpf: '12345678901',
        email: 'joao.updated@example.com',
      }

      mockRequest.params = { id: '1' }
      mockRequest.body = {
        name: 'João Silva Updated',
        email: 'joao.updated@example.com',
      }

      ;(prisma.patient.update as jest.Mock).mockResolvedValue(mockUpdatedPatient)

      await patientController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedPatient)
    })

    it('should call next with error when updating patient fails', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = { name: 'João Silva' }

      const dbError = new Error('Database error')
      ;(prisma.patient.update as jest.Mock).mockRejectedValue(dbError)

      await patientController.update(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(dbError)
    })
  })

  describe('delete', () => {
    it('should delete patient successfully', async () => {
      mockRequest.params = { id: '1' }

      ;(prisma.patient.delete as jest.Mock).mockResolvedValue({})

      await patientController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(204)
      expect(mockResponse.send).toHaveBeenCalled()
    })

    it('should call next with error when deleting patient fails', async () => {
      mockRequest.params = { id: '1' }

      const dbError = new Error('Database error')
      ;(prisma.patient.delete as jest.Mock).mockRejectedValue(dbError)

      await patientController.delete(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(dbError)
    })
  })
})
