import { defineEventHandler, readBody, getQuery } from 'h3'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import ip from 'ip'

const prisma = new PrismaClient()

// 内存中存储 IP 地址的请求时间
const ipRequestLimit: { [key: string]: number } = {}

export default defineEventHandler(async (event) => {
    const method = event.req.method

    if (method === 'GET') {
        // 处理 GET 请求，返回点赞的数量
        try {
            const likeCount = await prisma.like.count()
            return { like_count: likeCount }
        } catch (error) {
            console.error('Error fetching like count:', error)
            throw error
        }
    }

    if (method === 'POST') {
        // 处理 POST 请求，记录点赞信息并进行限制判断
        const { fingerprint } = await readBody(event)
        
        if (!fingerprint) {
            throw new Error("Fingerprint is required")
        }

        const userIp = ip.address() // 假设客户端传来的 IP 地址
        const now = Date.now()

        // 检查 IP 是否超过 5 分钟限制
        if (ipRequestLimit[userIp] && now - ipRequestLimit[userIp] < 5 * 60 * 1000) {
            throw new Error('IP has already requested within the last 5 minutes')
        }
        
        // 设置 IP 请求时间为当前时间
        ipRequestLimit[userIp] = now

        // 检查是否同一 fingerprint 在过去 30 分钟内已点赞
        const recentLike = await prisma.like.findFirst({
            where: {
                fingerprint,
                timestamp: {
                    gte: new Date(now - 30 * 60 * 1000), // 过去 30 分钟内
                }
            }
        })

        if (recentLike) {
            throw new Error('You have already liked in the last 30 minutes')
        }

        // 生成 UUID
        const uuid = uuidv4()

        // 创建新点赞记录
        try {
            const newLike = await prisma.like.create({
                data: {
                    ip: userIp,
                    fingerprint,
                    uuid,
                    timestamp: new Date(),
                },
            })

            return newLike
        } catch (error) {
            console.error('Error creating like:', error)
            throw error
        }
    }

    throw new Error('Unsupported HTTP method')
})
