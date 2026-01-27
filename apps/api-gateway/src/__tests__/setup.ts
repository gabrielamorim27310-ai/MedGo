// Setup global test configuration
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'
  process.env.JWT_EXPIRES_IN = '1h'
  process.env.JWT_REFRESH_EXPIRES_IN = '7d'
})

afterAll(() => {
  // Cleanup
})
