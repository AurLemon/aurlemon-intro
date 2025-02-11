import { defineEventHandler, readBody } from 'h3'
import prisma from '~/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import ip from 'ip'

const ipRequestLimit: { [key: string]: number } = {}

export default defineEventHandler(async (event) => {
    const method = event.node.req.method

    if (method === 'GET') {
        try {
            const likeCount = await prisma.like.count()
            return { like_count: likeCount }
        } catch (error) {
            console.error('Error fetching like count:', error)
            return { error: 'Database error' }
        }
    }

    if (method === 'POST') {
        const { fingerprint } = await readBody(event)

        if (!fingerprint) {
            return { error: "Fingerprint is required" }
        }

        const userIp = ip.address()
        const now = Date.now()

        if (ipRequestLimit[userIp] && now - ipRequestLimit[userIp] < 5 * 60 * 1000) {
            return { error: 'IP has already requested within the last 5 minutes' }
        }

        ipRequestLimit[userIp] = now

        const recentLike = await prisma.like.findFirst({
            where: {
                fingerprint,
                timestamp: { gte: new Date(now - 30 * 60 * 1000) },
            },
        })

        if (recentLike) {
            return { error: 'You have already liked in the last 30 minutes' }
        }

        try {
            const newLike = await prisma.like.create({
                data: {
                    ip: userIp,
                    fingerprint,
                    uuid: uuidv4(),
                    timestamp: new Date(),
                },
            })

            return { status: "success", newLike }
        } catch (error) {
            console.error('Error creating like:', error)
            return { error: 'Database error' }
        }
    }

    return { error: 'Unsupported HTTP method' }
})