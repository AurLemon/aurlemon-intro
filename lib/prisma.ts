import { PrismaClient } from '@prisma/client'

const config: any = useRuntimeConfig()

const prismaClientSingleton = () => {
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
