import { getDefaultResultOrder, setDefaultResultOrder } from 'node:dns'

declare global {
	var __dnsIpv4FirstReady__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__dnsIpv4FirstReady__) {
		return
	}

	globalThis.__dnsIpv4FirstReady__ = true

	try {
		const beforeOrder = getDefaultResultOrder()
		setDefaultResultOrder('ipv4first')
		const afterOrder = getDefaultResultOrder()

		console.info('[network] dns result order configured', {
			beforeOrder,
			afterOrder,
		})
	} catch (error) {
		console.warn('[network] failed to set dns result order', error)
	}
})
