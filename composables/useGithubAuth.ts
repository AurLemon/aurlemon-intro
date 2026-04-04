import type { GithubAuthUser } from '~/shared/types/social'

const STORAGE_KEY = 'aurlemon.github-user'

export const useGithubAuth = () => {
	const route = useRoute()
	const user = useState<GithubAuthUser | null>('github-auth-user', () => null)
	const initialized = useState('github-auth-initialized', () => false)
	const loading = useState('github-auth-loading', () => false)
	const { showError } = useSocialFeedback()

	const persistUser = () => {
		if (!import.meta.client) {
			return
		}

		if (!user.value) {
			localStorage.removeItem(STORAGE_KEY)
			return
		}

		localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
	}

	const hydrateUser = () => {
		if (!import.meta.client || user.value) {
			return
		}

		const raw = localStorage.getItem(STORAGE_KEY)

		if (!raw) {
			return
		}

		try {
			user.value = JSON.parse(raw) as GithubAuthUser
		} catch {
			localStorage.removeItem(STORAGE_KEY)
		}
	}

	const refresh = async () => {
		if (loading.value) {
			return user.value
		}

		loading.value = true

		try {
			const response = await $fetch<{ user: GithubAuthUser | null }>(
				'/api/auth/me',
			)
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

		if (!initialized.value) {
			await refresh()
		}
	}

	const login = async (redirectPath?: string) => {
		const redirect = redirectPath ?? route.fullPath

		await navigateTo(
			`/api/auth/github?redirect=${encodeURIComponent(redirect)}`,
			{
				external: true,
			},
		)
	}

	const logout = async () => {
		await $fetch('/api/auth/logout', { method: 'POST' })
		user.value = null
		persistUser()
	}

	if (import.meta.client) {
		hydrateUser()
		watch(user, persistUser, { deep: true })
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
