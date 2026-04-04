import { ensureDatabaseBootstrap } from '~/server/utils/db-bootstrap'

export default defineNitroPlugin(async () => {
	await ensureDatabaseBootstrap()
})
