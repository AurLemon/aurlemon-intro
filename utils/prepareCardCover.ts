const preparations = new Map<string, Promise<boolean>>()

/** 只准备当前/下一张真实封面；共享下载和解码结果，不挂载隐藏图片。 */
export const prepareCardCover = (url: string): Promise<boolean> => {
	if (!import.meta.client) return Promise.resolve(false)
	const existing = preparations.get(url)
	if (existing) return existing
	const image = new Image()
	image.decoding = 'async'
	image.src = url
	const ready = image.decode().then(
		() => true,
		() => {
			preparations.delete(url)
			return false
		},
	)
	preparations.set(url, ready)
	return ready
}
