/** Animate the visible modal height rather than an unbounded scrolling list. */
export const useModalHeightTransition = (
	content: Readonly<Ref<HTMLElement | null>>,
) => {
	let observer: ResizeObserver | undefined
	let frame = 0
	let generation = 0
	let dialog: HTMLElement | null = null
	let body: HTMLElement | null = null

	const update = () => {
		if (!dialog || !body || !content.value) return
		const style = getComputedStyle(body)
		const bodyInsets =
			(parseFloat(style.paddingTop) || 0) +
			(parseFloat(style.paddingBottom) || 0) +
			(parseFloat(style.borderTopWidth) || 0) +
			(parseFloat(style.borderBottomWidth) || 0)
		const chromeHeight = dialog.offsetHeight - body.offsetHeight
		const naturalHeight = chromeHeight + content.value.offsetHeight + bodyInsets
		const limit = parseFloat(getComputedStyle(dialog).maxHeight)
		const height = Math.min(
			naturalHeight,
			Number.isFinite(limit) ? limit : window.innerHeight,
		)
		const target = `${Math.ceil(height)}px`
		if (dialog.style.height !== target) dialog.style.height = target
	}
	const schedule = () => {
		cancelAnimationFrame(frame)
		frame = requestAnimationFrame(update)
	}
	const stop = () => {
		generation++
		observer?.disconnect()
		observer = undefined
		cancelAnimationFrame(frame)
		window.removeEventListener('resize', schedule)
		dialog = null
		body = null
	}
	const start = async () => {
		stop()
		const current = generation
		await nextTick()
		if (current !== generation || !content.value) return
		dialog = content.value.closest<HTMLElement>('[role="dialog"]')
		body = dialog?.querySelector<HTMLElement>('[data-slot="body"]') ?? null
		if (!dialog || !body) return
		// Pin the rendered loading state before committing the next target.
		dialog.style.height = `${dialog.offsetHeight}px`
		void dialog.offsetHeight
		observer = new ResizeObserver(schedule)
		observer.observe(content.value)
		window.addEventListener('resize', schedule)
		schedule()
	}
	onBeforeUnmount(stop)
	return { start, stop }
}
