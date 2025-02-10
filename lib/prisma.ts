import { PrismaClient } from '@prisma/client'

const config: any = useRuntimeConfig()

const prismaClientSingleton = () => {
    // 神医：
    // https://stackoverflow.com/questions/78550989/tables-do-not-exist-in-prisma-database-after-nuxt-app-deployment
    // https://github.com/nuxt/nuxt/issues/21753
    return new PrismaClient({
        datasources: {
            db: {
                url: config.bdUrl
            }
        }
    })
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
