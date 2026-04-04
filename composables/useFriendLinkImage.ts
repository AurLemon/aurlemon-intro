const MAX_FRIEND_LINK_IMAGE_SIZE = 3 * 1024 * 1024
const TARGET_MIN_EDGE = 256

const loadImageElement = (file: File): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const image = new Image()
		const objectUrl = URL.createObjectURL(file)

		image.onload = () => {
			URL.revokeObjectURL(objectUrl)
			resolve(image)
		}
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl)
			reject(new Error('INVALID_IMAGE_BASE64'))
		}

		image.src = objectUrl
	})
}

const canvasToDataUrl = (canvas: HTMLCanvasElement): Promise<string> => {
	return new Promise((resolve, reject) => {
		try {
			resolve(canvas.toDataURL('image/webp', 0.9))
		} catch {
			try {
				resolve(canvas.toDataURL('image/jpeg', 0.9))
			} catch {
				reject(new Error('INVALID_IMAGE_BASE64'))
			}
		}
	})
}

export const useFriendLinkImage = () => {
	const normalizeImage = async (file: File): Promise<string> => {
		if (file.size > MAX_FRIEND_LINK_IMAGE_SIZE) {
			throw { statusMessage: 'IMAGE_TOO_LARGE' }
		}

		const image = await loadImageElement(file)
		const width = image.naturalWidth
		const height = image.naturalHeight

		if (!width || !height) {
			throw new Error('INVALID_IMAGE_BASE64')
		}

		const minEdge = Math.min(width, height)
		const scale = TARGET_MIN_EDGE / minEdge
		const targetWidth = Math.max(1, Math.round(width * scale))
		const targetHeight = Math.max(1, Math.round(height * scale))

		const canvas = document.createElement('canvas')
		canvas.width = targetWidth
		canvas.height = targetHeight

		const context = canvas.getContext('2d')

		if (!context) {
			throw new Error('INVALID_IMAGE_BASE64')
		}

		context.drawImage(image, 0, 0, targetWidth, targetHeight)
		return canvasToDataUrl(canvas)
	}

	return {
		normalizeImage,
		maxSizeBytes: MAX_FRIEND_LINK_IMAGE_SIZE,
	}
}
