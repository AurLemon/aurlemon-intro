const STORAGE_KEY = 'aurlemon.site-fingerprint'

const digestFingerprint = async (input: string): Promise<string> => {
	const encoded = new TextEncoder().encode(input)
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)

	return Array.from(new Uint8Array(hashBuffer))
		.map((item) => item.toString(16).padStart(2, '0'))
		.join('')
}

export const useSiteFingerprint = () => {
	const fingerprint = useState<string>('site-fingerprint', () => '')

	const ensureFingerprint = async (): Promise<string> => {
		if (!import.meta.client) {
			return ''
		}

		if (fingerprint.value) {
			return fingerprint.value
		}

		const cached = localStorage.getItem(STORAGE_KEY)

		if (cached) {
			fingerprint.value = cached
			return cached
		}

		const rawFingerprint = [
			navigator.userAgent,
			navigator.language,
			Intl.DateTimeFormat().resolvedOptions().timeZone,
			navigator.platform,
			String(navigator.hardwareConcurrency ?? ''),
			String(navigator.maxTouchPoints ?? ''),
			window.screen.width,
			window.screen.height,
			window.devicePixelRatio,
		].join('|')

		const hashed = await digestFingerprint(rawFingerprint)
		fingerprint.value = hashed
		localStorage.setItem(STORAGE_KEY, hashed)
		return hashed
	}

	return {
		fingerprint,
		ensureFingerprint,
	}
}
