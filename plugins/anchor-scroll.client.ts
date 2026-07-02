export default defineNuxtPlugin(() => {
	const route = useRoute()

	const syncAnchorScroll = (): void => {
		const rawHash = route.hash

		if (!rawHash) {
			return
		}

		const id = decodeURIComponent(rawHash.replace(/^#/, ''))

		if (!id) {
			return
		}

		scheduleAnchorScroll(id)
	}

	onNuxtReady(() => {
		syncAnchorScroll()
	})

	watch(
		() => route.hash,
		() => {
			syncAnchorScroll()
		},
	)
})
