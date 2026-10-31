export const FRIEND_LINK_IMAGE_MAX_BYTES = 3 * 1024 * 1024
export const FRIEND_LINK_IMAGE_ACCEPT =
	'image/webp,image/avif,image/png,image/jpeg,.webp,.avif,.png,.jpeg,.jpg'

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
	String.fromCharCode(...bytes.subarray(start, end))

// Check file contents rather than trusting the extension or declared MIME.
export const getFriendLinkImageMime = (bytes: Uint8Array): string | null => {
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
		return 'image/jpeg'
	if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte))
		return 'image/png'
	if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP')
		return 'image/webp'
	if (bytes.length >= 16 && ascii(bytes, 4, 8) === 'ftyp') {
		const length = new DataView(
			bytes.buffer,
			bytes.byteOffset,
			bytes.byteLength,
		).getUint32(0)
		for (let i = 8; i + 4 <= Math.min(length, bytes.length); i += 4) {
			if (i === 12) continue // Minor version is not a compatible brand.
			if (['avif', 'avis'].includes(ascii(bytes, i, i + 4))) return 'image/avif'
		}
	}
	return null
}
