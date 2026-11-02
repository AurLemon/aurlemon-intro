/** Resolve avatars at the display boundary; keep raw provider URLs in storage. */
export const useSocialAvatar = () => {
	return (value?: string | null): string => {
		if (!value) return ''
		try {
			const source = new URL(value)
			if (
				!['github.com', 'avatars.githubusercontent.com'].includes(
					source.hostname,
				)
			)
				return value
			return `/api/social/avatar?url=${encodeURIComponent(source.href)}`
		} catch {
			return value
		}
	}
}
