import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition
		}

		if (to.hash) {
			return { el: to.hash, behavior: 'smooth' }
		}

		if (import.meta.client) {
			return { left: 0, top: window.scrollY }
		}

		return { left: 0, top: 0 }
	},
}
