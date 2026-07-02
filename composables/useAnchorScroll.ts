const HEADER_SELECTOR = '[data-page-header]'
const EXTRA_OFFSET = 12
const ANCHOR_SCROLL_RETRY_LIMIT = 12

const getAnchorTarget = (id: string): HTMLElement | null => {
	if (!import.meta.client) {
		return null
	}

	return document.getElementById(id)
}

const getHeaderOffset = (): number => {
	if (!import.meta.client) {
		return 0
	}

	const header = document.querySelector<HTMLElement>(HEADER_SELECTOR)

	return header
		? header.getBoundingClientRect().height + EXTRA_OFFSET
		: EXTRA_OFFSET
}

const updateHash = (id: string): void => {
	const nextHash = `#${id}`

	if (window.location.hash === nextHash) {
		window.history.replaceState(window.history.state, '', nextHash)
		return
	}

	window.history.pushState(window.history.state, '', nextHash)
}

export const scrollToAnchor = (id: string): void => {
	const target = getAnchorTarget(id)

	if (!target) {
		return
	}

	const targetTop = window.scrollY + target.getBoundingClientRect().top
	const top = Math.max(0, targetTop - getHeaderOffset())

	window.scrollTo({
		top,
		behavior: 'auto',
	})
}

export const scheduleAnchorScroll = (id: string, attempt = 0): void => {
	if (!import.meta.client) {
		return
	}

	if (getAnchorTarget(id)) {
		scrollToAnchor(id)
		return
	}

	if (attempt >= ANCHOR_SCROLL_RETRY_LIMIT) {
		return
	}

	requestAnimationFrame(() => {
		scheduleAnchorScroll(id, attempt + 1)
	})
}

export const useAnchorScroll = (id: MaybeRefOrGetter<string | undefined>) => {
	const resolvedId = computed(() => toValue(id))

	const scrollCurrentAnchor = (): void => {
		if (!import.meta.client || !resolvedId.value) {
			return
		}

		scheduleAnchorScroll(resolvedId.value)
	}

	const handleAnchorClick = (event: MouseEvent): void => {
		if (!resolvedId.value) {
			return
		}

		event.preventDefault()
		updateHash(resolvedId.value)
		scrollCurrentAnchor()
	}

	onMounted(() => {
		if (!import.meta.client || !resolvedId.value) {
			return
		}

		if (window.location.hash === `#${resolvedId.value}`) {
			scrollCurrentAnchor()
		}
	})

	return {
		handleAnchorClick,
	}
}
