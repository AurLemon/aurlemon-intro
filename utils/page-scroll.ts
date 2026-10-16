interface PendingPageScroll {
	path: string
	resolve: (ready: boolean) => void
}

let pendingScroll: PendingPageScroll | undefined
let enteredPath: string | undefined

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
}

export const resolvePageEnter = (path: string): void => {
	enteredPath = path
	const pending = pendingScroll
	if (pending?.path !== path) return
	pendingScroll = undefined
	pending?.resolve(true)
}
