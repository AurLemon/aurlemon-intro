import { defineEventHandler, getQuery } from 'h3'
import fetch from 'node-fetch'

const CACHE_EXPIRATION = 3600 * 1000 * 24 // 缓存有效期（1天）
let cache: { data: any; timestamp: number } | null = null

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const { user = 'AurLemon' } = getQuery(event)

    // 检查缓存
    if (cache && Date.now() - cache.timestamp < CACHE_EXPIRATION) {
        console.log('🍋 server/api/github: Get GitHub user info from cache')
        return cache.data
    }

    // 无缓就获取 GitHub 用户信息
    try {
        const response = await fetch(`https://api.github.com/users/${user}/repos`, {
            headers: {
                'Authorization': `token ${ config.githubToken }`
            }
        })
        if (!response.ok) {
            throw new Error('Failed to fetch repositories from GitHub')
        }

        const data = await response.json()
        const sortedData = data.sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)

        // 更新缓存
        cache = {
            data: sortedData,
            timestamp: Date.now()
        }
        return sortedData
    } catch (error) {
        console.error('🍋 server/api/github: Error fetching repositories:', error)
        throw error
    }
})
