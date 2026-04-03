<template>
	<div
		class="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
	>
		<nav
			class="pointer-events-auto inline-flex items-center gap-1 rounded-[1.4rem] border border-sky-200/90 bg-white/95 p-1 shadow-[0_8px_30px_rgba(59,130,246,0.08)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
		>
			<NuxtLink
				v-for="item in navItems"
				:key="item.to"
				:to="localePath(item.to)"
				class="min-w-16 rounded-full px-4 py-2 text-center text-base leading-none transition-colors duration-200"
				:class="linkClass(item.to)"
				:aria-current="isActive(item.to) ? 'page' : undefined"
			>
				{{ item.label }}
			</NuxtLink>
		</nav>
	</div>
</template>

<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()

const navItems = [
	{ label: '概览', to: '/' },
	{ label: '项目', to: '/project' },
	{ label: '自述', to: '/profile' },
	{ label: '偏好', to: '/more' },
] as const

const isActive = (path: string): boolean => route.path === localePath(path)

const linkClass = (path: string) => [
	'text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-300',
	isActive(path)
		? 'bg-sky-100 text-sky-600 font-semibold shadow-sm dark:bg-sky-400/15 dark:text-sky-300'
		: 'hover:bg-slate-50 dark:hover:bg-slate-800/80',
]
</script>
