export const useAccountModal = () => {
	const open = useState('account-modal-open', () => false)
	return {
		open,
		show: () => {
			open.value = true
		},
		hide: () => {
			open.value = false
		},
	}
}
