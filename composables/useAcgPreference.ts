import coverSources from '~/assets/resources/homepage/acg/background.card-atlas.json?covers'
import type { CardCoverMetadata } from '~/shared/types/card-image-atlas'
import { usePreferenceRotation } from '~/composables/usePreferenceRotation'

interface AcgCover extends CardCoverMetadata {
	id: string
	url: string
}
interface CoverDeck {
	visible: string[]
	remaining: string[]
}
const covers = coverSources.filter((cover): cover is AcgCover =>
	Boolean(cover.title && cover.author?.length && cover.category && cover.href),
)
if (covers.length !== coverSources.length || covers.length < 3)
	throw new Error('ACG_COVER_METADATA_MISSING')

const shuffle = (ids: string[]) => {
	for (let index = ids.length - 1; index > 0; index--) {
		const random = Math.floor(Math.random() * (index + 1))
		const previous = ids[index]!
		ids[index] = ids[random]!
		ids[random] = previous
	}
	return ids
}

export const useAcgPreference = (paused: Ref<boolean> = ref(false)) => {
	const deck = useState<CoverDeck>('homepage-acg-cover-deck', () => ({
		visible: covers
			.slice(0, 3)
			.reverse()
			.map((cover) => cover.id),
		remaining: shuffle(covers.slice(3).map((cover) => cover.id)),
	}))
	const advance = () => {
		const remaining = deck.value.remaining.length
			? [...deck.value.remaining]
			: shuffle(
					covers
						.filter((cover) => !deck.value.visible.includes(cover.id))
						.map((cover) => cover.id),
				)
		// 新封面从左侧进入，原来的左、中封面依次向右；最右侧决定当前作品。
		const incoming = remaining.shift()
		if (incoming)
			deck.value = {
				visible: [incoming, ...deck.value.visible.slice(0, 2)],
				remaining,
			}
	}
	if (import.meta.client && !useNuxtApp().isHydrating) advance()
	const deferFor = usePreferenceRotation(advance, paused)
	const visibleCovers = computed(() =>
		deck.value.visible.map((id) => covers.find((cover) => cover.id === id)!),
	)
	return {
		deferFor,
		covers: visibleCovers,
		current: computed(() => visibleCovers.value[2]!),
	}
}
