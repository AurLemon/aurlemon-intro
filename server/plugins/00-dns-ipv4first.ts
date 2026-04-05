import { setDefaultResultOrder } from 'node:dns'

declare global {
	var __dnsIpv4FirstReady__: boolean | undefined
}

export default defineNitroPlugin(() => {
	if (globalThis.__dnsIpv4FirstReady__) {
		return
	}

	globalThis.__dnsIpv4FirstReady__ = true

	try {
		setDefaultResultOrder('ipv4first')
		console.info('[network] dns result order = ipv4first')
	} catch (error) {
		console.warn('[network] failed to set dns result order', error)
	}
})
