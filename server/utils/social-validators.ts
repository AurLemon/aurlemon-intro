export const ensureNonEmptyString = (
	value: unknown,
	message: string,
	maxLength = 500,
): string => {
	if (typeof value !== 'string') {
		throw createError({
			statusCode: 400,
			statusMessage: message,
		})
	}

	const trimmed = value.trim()

	if (!trimmed || trimmed.length > maxLength) {
		throw createError({
			statusCode: 400,
			statusMessage: message,
		})
	}

	return trimmed
}

export const ensureValidUrl = (value: unknown, message: string): string => {
	const normalized = ensureNonEmptyString(value, message, 500)

	try {
		const parsed = new URL(normalized)

		if (!['http:', 'https:'].includes(parsed.protocol)) {
			throw new Error('Invalid protocol')
		}

		return parsed.toString()
	} catch {
		throw createError({
			statusCode: 400,
			statusMessage: message,
		})
	}
}

export const ensureImageBase64 = (value: unknown): string => {
	const normalized = ensureNonEmptyString(
		value,
		'INVALID_IMAGE_BASE64',
		6_000_000,
	)

	if (!normalized.startsWith('data:image/')) {
		throw createError({
			statusCode: 400,
			statusMessage: 'INVALID_IMAGE_BASE64',
		})
	}

	return normalized
}

export const ensureOptionalImageBase64 = (value: unknown): string | null => {
	if (value === undefined || value === null) {
		return null
	}

	if (typeof value !== 'string') {
		return null
	}

	const trimmed = value.trim()

	if (!trimmed) {
		return null
	}

	if (!trimmed.startsWith('data:image/')) {
		return null
	}

	try {
		return ensureImageBase64(trimmed)
	} catch {
		return null
	}
}
