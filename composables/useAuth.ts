import type { AuthUser, OAuthProviderName } from '~/shared/types/social'

const STORAGE_KEY = 'aurlemon.user'

export const useAuth = () => {
	const route = useRoute()
	const user = useState<AuthUser | null>('auth-user', () => null)
	const initialized = useState('auth-initialized', () => false)
	const loading = useState('auth-loading', () => false)
	const { showError } = useSocialFeedback()

	const persistUser = () => {
		if (!import.meta.client) return
		if (!user.value) {
			localStorage.removeItem(STORAGE_KEY)
			return
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
	}

	const hydrateUser = () => {
		if (!import.meta.client || user.value) return
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return
		try {
			const storedUser = JSON.parse(raw) as AuthUser & { handle?: unknown }
			if (!storedUser.username && typeof storedUser.handle === 'string') {
				storedUser.username = storedUser.handle
			}
			user.value = storedUser
		} catch {
			localStorage.removeItem(STORAGE_KEY)
		}
	}

	const refresh = async () => {
		if (loading.value) return user.value
		loading.value = true
		try {
			const response = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
			user.value = response.user
			persistUser()
			return user.value
		} catch (error) {
			user.value = null
			persistUser()
			showError(error)
			return null
		} finally {
			loading.value = false
			initialized.value = true
		}
	}

	const ensureReady = async () => {
		hydrateUser()
		if (!initialized.value) await refresh()
	}

	const login = async (
		provider: OAuthProviderName,
		intent: 'sign-in' | 'connect' = 'sign-in',
		redirectPath?: string,
	) => {
		const redirect = redirectPath ?? route.fullPath
		const providerPath = provider === 'LINUX_DO' ? 'linuxdo' : 'github'
		if (import.meta.client) {
			await nextTick()
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
			})
		}
		await navigateTo(
			`/api/auth/${providerPath}?intent=${intent}&redirect=${encodeURIComponent(redirect)}`,
			{ external: true },
		)
	}

	const logout = async () => {
		await $fetch('/api/auth/logout', { method: 'POST' })
		user.value = null
		persistUser()
	}

	if (import.meta.client) {
		onMounted(() => {
			hydrateUser()
			watch(user, persistUser, { deep: true })
		})
	}

	return {
		user,
		initialized,
		loading,
		isLoggedIn: computed(() => Boolean(user.value)),
		ensureReady,
		refresh,
		login,
		logout,
	}
}
