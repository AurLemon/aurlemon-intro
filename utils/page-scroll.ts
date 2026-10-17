interface PendingPageScroll {
	path: string
	resolve: (ready: boolean) => void
}

export interface PageScrollPosition {
	left: number
	top: number
}

let pendingScroll: PendingPageScroll | undefined
let enteredPath: string | undefined
let restoreEnteredPage: ((position: PageScrollPosition) => void) | undefined

export const waitForPageEnter = (path: string): Promise<boolean> => {
	pendingScroll?.resolve(false)
	pendingScroll = undefined
	if (enteredPath === path) return Promise.resolve(true)
	return new Promise((resolve) => {
		pendingScroll = { path, resolve }
	})
}

export const resetPageEnter = (): void => {
	enteredPath = undefined
	restoreEnteredPage = undefined
}

export const resolvePageEnter = (
	path: string,
	restore?: (position: PageScrollPosition) => void,
): void => {
	enteredPath = path
	restoreEnteredPage = restore
	const pending = pendingScroll
	if (pending?.path !== path) return
	pendingScroll = undefined
	pending?.resolve(true)
}

export const restorePageScroll = (
	path: string,
	position: PageScrollPosition,
): boolean => {
	if (enteredPath !== path || !restoreEnteredPage) return false
	restoreEnteredPage(position)
	return true
}
