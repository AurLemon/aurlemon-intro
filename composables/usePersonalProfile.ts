import { getPersonalProfileSnapshot } from '~/utils/personal-profile'

export const usePersonalProfile = () => {
	// SSR 和 hydration 共用时间，避免恰好跨生日或开学日时文案不一致。
	const timestamp = useState<number>('personal-profile-timestamp', () =>
		Date.now(),
	)
	let refreshTimer: ReturnType<typeof setInterval> | undefined

	onMounted(() => {
		timestamp.value = Date.now()
		refreshTimer = setInterval(() => {
			timestamp.value = Date.now()
		}, 60_000)
	})

	onUnmounted(() => {
		if (refreshTimer !== undefined) clearInterval(refreshTimer)
	})

	return computed(() => getPersonalProfileSnapshot(timestamp.value))
}
