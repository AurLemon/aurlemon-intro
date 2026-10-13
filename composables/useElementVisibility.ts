import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export const useElementVisibility = (target: Ref<HTMLElement | null>) => {
	const visible = ref(false)
	let observer: IntersectionObserver | undefined
	let observed: HTMLElement | null = null
	const observe = () => {
		if (observed) observer?.unobserve(observed)
		observed = target.value
		visible.value = false
		if (observed) observer?.observe(observed)
	}
	onMounted(() => {
		observer = new IntersectionObserver(([entry]) => {
			visible.value = entry?.isIntersecting ?? false
		})
		observe()
	})
	watch(target, () => {
		if (observer) observe()
	})
	onBeforeUnmount(() => observer?.disconnect())
	return visible
}
