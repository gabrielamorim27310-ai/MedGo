import { createClient } from 'redis'

export class RedisCache {
  private client: ReturnType<typeof createClient> | null = null
  private connected: boolean = false

  constructor() {
    this.connect()
  }

  private async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      this.client = createClient({ url: redisUrl })

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.connected = false
      })

      this.client.on('connect', () => {
        console.log('✅ Redis connected')
        this.connected = true
      })

      await this.client.connect()
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      this.connected = false
    }
  }

  async get(key: string): Promise<any> {
    if (!this.connected || !this.client) return null

    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.connected || !this.client) return

    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.client.setEx(key, ttl, serialized)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected || !this.client) return

    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  async invalidateHospitalQueue(hospitalId: string): Promise<void> {
    await this.delete(`queue:stats:${hospitalId}`)
    await this.delete(`queue:list:${hospitalId}`)
  }
}
