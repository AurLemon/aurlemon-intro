import covers from '~/assets/resources/homepage/music/background.card-atlas.json?covers'
import { usePreferenceRotation } from '~/composables/usePreferenceRotation'
import type {
	CardCoverMetadata,
	CardImageCover,
} from '~/shared/types/card-image-atlas'

interface MusicCover extends CardCoverMetadata {
	id: string
	url: string
}
interface CoverCycle {
	remaining: string[]
	lastId: string
}

const musicCovers = covers.filter(
	(cover: CardImageCover): cover is MusicCover =>
		Boolean(
			cover.title && cover.author?.length && cover.category && cover.href,
		),
)
if (musicCovers.length !== covers.length || !musicCovers.length)
	throw new Error('MUSIC_COVER_METADATA_MISSING')

export const useMusicPreference = (paused: Ref<boolean> = ref(false)) => {
	const cycle = useCookie<CoverCycle>('homepage-music-cover-cycle', {
		default: () => ({ remaining: [], lastId: '' }),
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30,
	})
	const prepareNextCover = () => {
		const ids = new Set(musicCovers.map((cover) => cover.id))
		let remaining = Array.isArray(cycle.value?.remaining)
			? [...new Set(cycle.value.remaining.filter((id) => ids.has(id)))]
			: []
		if (!remaining.length) {
			remaining = [...ids]
			for (let index = remaining.length - 1; index > 0; index--) {
				const random = Math.floor(Math.random() * (index + 1))
				const previous = remaining[index]!
				remaining[index] = remaining[random]!
				remaining[random] = previous
			}
			if (remaining.length > 1 && remaining[0] === cycle.value?.lastId) {
				const first = remaining[0]!
				remaining[0] = remaining[1]!
				remaining[1] = first
			}
		}
		const id = remaining.shift()!
		return { id, remaining }
	}
	const nextCover = () => {
		const next = prepareNextCover()
		cycle.value = { remaining: next.remaining, lastId: next.id }
		return next.id
	}
	const selectedId = useState('homepage-music-cover-id', nextCover)
	// 首次 hydration 复用 SSR；返回首页推进，停留时等待最小展示与阅读窗口。
	if (import.meta.client && !useNuxtApp().isHydrating)
		selectedId.value = nextCover()
	let disposed = false
	let preparing = false
	const advance = async () => {
		if (disposed || preparing || document.hidden) return
		preparing = true
		const { id, remaining } = prepareNextCover()
		const cover = musicCovers.find((cover) => cover.id === id)!
		try {
			// 只准备下一张；图片解码完成后同步交接封面、文案和作品名。
			const image = new Image()
			image.src = cover.url
			await image.decode()
			if (!disposed && !document.hidden && !paused.value) {
				cycle.value = { remaining, lastId: id }
				selectedId.value = id
			}
		} catch {
			// 下载失败不消耗队列，下一周期重试，避免未展示的作品被跳过。
		} finally {
			preparing = false
		}
	}
	const deferFor = usePreferenceRotation(advance, paused)
	onBeforeUnmount(() => {
		disposed = true
	})
	const cover = computed(
		() =>
			musicCovers.find((cover) => cover.id === selectedId.value) ??
			musicCovers[0]!,
	)
	return { cover, deferFor }
}
