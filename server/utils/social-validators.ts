import sharp from 'sharp'
import {
	FRIEND_LINK_IMAGE_MAX_BYTES,
	getFriendLinkImageMime,
} from '~/shared/utils/friend-link-image'

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

export const ensureImageBase64 = async (value: unknown): Promise<string> => {
	const fail = (statusMessage: string): never => {
		throw createError({ statusCode: 400, statusMessage })
	}
	if (typeof value !== 'string' || !value.trim())
		return fail('INVALID_IMAGE_BASE64')
	const normalized = value.trim()
	if (normalized.length > Math.ceil(FRIEND_LINK_IMAGE_MAX_BYTES / 3) * 4 + 64)
		return fail('IMAGE_TOO_LARGE')
	const match = normalized.match(
		/^data:(image\/(?:webp|avif|png|jpeg|jpg));base64,([A-Za-z0-9+/]+={0,2})$/i,
	)
	if (!match) return fail('UNSUPPORTED_FRIEND_LINK_IMAGE_FORMAT')
	const bytes = Buffer.from(match[2]!, 'base64')
	if (bytes.length > FRIEND_LINK_IMAGE_MAX_BYTES) return fail('IMAGE_TOO_LARGE')
	if (
		!bytes.length ||
		bytes.toString('base64').replace(/=+$/, '') !== match[2]!.replace(/=+$/, '')
	)
		return fail('INVALID_IMAGE_BASE64')
	const mime = getFriendLinkImageMime(bytes)
	if (
		!mime ||
		mime !== match[1]!.toLowerCase().replace('image/jpg', 'image/jpeg')
	)
		return fail('UNSUPPORTED_FRIEND_LINK_IMAGE_FORMAT')
	try {
		const image = await sharp(bytes)
			.rotate()
			.resize({ width: 256, height: 256, fit: 'outside' })
			.webp({ quality: 90 })
			.toBuffer()
		return `data:image/webp;base64,${image.toString('base64')}`
	} catch {
		return fail('INVALID_IMAGE_BASE64')
	}
}

export const ensureOptionalImageBase64 = async (
	value: unknown,
): Promise<string | null> => {
	if (value === undefined || value === null) {
		return null
	}

	if (typeof value !== 'string') return ensureImageBase64(value)

	const trimmed = value.trim()

	if (!trimmed) {
		return null
	}

	return ensureImageBase64(trimmed)
}
