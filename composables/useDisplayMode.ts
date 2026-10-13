export interface DisplayModeState {
	compact: boolean
	hover: boolean
}

export const COMPACT_VIEWPORT_QUERY = '(width < 64rem)'
export const HOVER_POINTER_QUERY = '(hover: hover) and (pointer: fine)'

export const useDisplayModeState = () =>
	useState<DisplayModeState>('display-mode', () => ({
		compact: false,
		hover: true,
	}))

export const useDisplayMode = () => {
	const state = useDisplayModeState()
	return {
		isCompact: computed(() => state.value.compact),
		canHover: computed(() => state.value.hover),
		isMobileMotion: computed(() => state.value.compact || !state.value.hover),
	}
}
