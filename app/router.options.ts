import type { RouterConfig } from '@nuxt/schema'
import { waitForPageEnter } from '~/utils/page-scroll'

const scrollPositions = new Map<string, number>()

const getScrollKey = (fullPath: string | undefined) =>
	(fullPath ?? '').split('#', 1)[0] ?? ''

export default <RouterConfig>{
	async scrollBehavior(to, from, savedPosition) {
		const router = useRouter()

		if (import.meta.client) {
			scrollPositions.set(getScrollKey(from.fullPath), window.scrollY)
		}

		if (to.hash && !savedPosition) {
			return false
		}

		const position = savedPosition ?? {
			left: 0,
			top: scrollPositions.get(getScrollKey(to.fullPath)) ?? 0,
		}

		// Keep the outgoing page still, then scroll once the destination is mounted.
		if (import.meta.client && from.matched.length && to.path !== from.path) {
			const ready = await waitForPageEnter(to.path)
			if (!ready || router.currentRoute.value.fullPath !== to.fullPath)
				return false
		}

		const behavior =
			import.meta.client &&
			!window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'smooth'
				: 'instant'
		return { ...position, behavior }
	},
}
