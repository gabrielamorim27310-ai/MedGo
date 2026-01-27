import { Request, Response, NextFunction } from 'express'
import { AuthController } from '../../controllers/AuthController'
import { prisma } from '../../lib/prisma'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcrypt')
jest.mock('jsonwebtoken')

describe('AuthController', () => {
  let authController: AuthController
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    authController = new AuthController()
    mockRequest = {
      body: {},
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: 'PATIENT',
        status: 'ACTIVE',
      }

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      ;(jwt.sign as jest.Mock).mockReturnValue('mock-token')

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }),
        token: 'mock-token',
        refreshToken: 'mock-token',
      })
    })

    it('should return 401 with invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      )
    })

    it('should call next with AppError when password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        status: 'ACTIVE',
      }

      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      )
    })
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockNewUser = {
        id: '1',
        email: 'newuser@example.com',
        name: 'New User',
        cpf: '12345678901',
        phone: '11987654321',
        role: 'PATIENT',
        status: 'ACTIVE',
      }

      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        cpf: '12345678901',
        phone: '11987654321',
        role: 'PATIENT',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.create as jest.Mock).mockResolvedValue(mockNewUser)
      ;(jwt.sign as jest.Mock).mockReturnValue('mock-token')

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: expect.objectContaining({
          email: mockNewUser.email,
          name: mockNewUser.name,
        }),
        token: 'mock-token',
        refreshToken: 'mock-token',
      })
    })

    it('should call next with AppError if user already exists', async () => {
      const mockExistingUser = {
        id: '1',
        email: 'existing@example.com',
      }

      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockExistingUser)

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 409,
        })
      )
    })
  })
})
