export const useAccountPopover = () => {
	const open = useState('account-popover-open', () => false)
	const requestVersion = useState('account-popover-request-version', () => 0)

	return {
		open,
		requestVersion,
		show: () => {
			requestVersion.value += 1
			open.value = true
		},
		hide: () => {
			open.value = false
		},
	}
}
