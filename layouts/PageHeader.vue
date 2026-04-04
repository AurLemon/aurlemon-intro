<template>
	<header class="sticky top-0 z-100 pt-6 md:pt-10 md:pb-16">
		<div
			class="absolute top-0 left-0 right-0 -bottom-3/5 z-10 pointer-events-none bg-white/85 dark:bg-slate-900/75 backdrop-blur-[48px] mask-[linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.98)_30%,rgba(0,0,0,0.92)_45%,rgba(0,0,0,0.8)_55%,rgba(0,0,0,0.58)_65%,rgba(0,0,0,0.35)_75%,rgba(0,0,0,0.15)_85%,transparent_100%)]"
		/>
		<div
			class="mx-auto max-w-4xl px-6 md:px-0 flex items-center justify-between relative z-40"
		>
			<div>
				<ReadingProgress targetSelector="#page-container" />
			</div>
			<div class="flex items-center gap-2">
				<UPopover
					:popper="{ placement: 'bottom-end' }"
					:ui="{ content: 'z-[40000]' }"
				>
					<UButton
						color="neutral"
						variant="ghost"
						size="xs"
						class="h-9 w-9 rounded-full hover:bg-slate-500/10 active:bg-slate-500/20"
						icon-only
						:aria-label="'主题模式'"
					>
						<UIcon :name="themeButtonIcon" class="h-5 w-5" />
					</UButton>

					<template #content>
						<div class="w-40 space-y-1 p-2">
							<UButton
								v-for="mode in themeModes"
								:key="mode.value"
								type="button"
								color="neutral"
								variant="ghost"
								class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
								:class="{
									'bg-primary-100/60 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200':
										selectedThemeMode === mode.value,
									'text-slate-600 dark:text-slate-300':
										selectedThemeMode !== mode.value,
								}"
								@click="selectTheme(mode.value)"
							>
								<UIcon :name="mode.icon" class="text-base" />
								<span>{{ mode.label }}</span>
								<UIcon
									v-if="selectedThemeMode === mode.value"
									name="i-lucide-check"
									class="ml-auto text-base"
								/>
							</UButton>
						</div>
					</template>
				</UPopover>

				<UPopover
					:popper="{ placement: 'bottom-end' }"
					:ui="{ content: 'z-[40000]' }"
				>
					<UButton
						color="neutral"
						variant="ghost"
						size="xs"
						class="h-9 w-9 rounded-full hover:bg-slate-500/10 active:bg-slate-500/20"
						icon-only
						:aria-label="t('header.switchLanguage')"
					>
						<UIcon name="i-lucide-languages" class="h-5 w-5" />
					</UButton>

					<template #content>
						<div class="w-40 space-y-1 p-2">
							<UButton
								v-for="item in localeItems"
								:key="item.value"
								type="button"
								color="neutral"
								variant="ghost"
								class="w-full justify-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
								:class="{
									'bg-primary-100/60 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200':
										selectedLocale === item.value,
									'text-slate-600 dark:text-slate-300':
										selectedLocale !== item.value,
								}"
								@click="selectLocale(item.value)"
							>
								<span>{{ item.label }}</span>
								<span
									v-if="item.badge"
									class="rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] leading-none text-slate-500 dark:bg-slate-400/10 dark:text-slate-400"
								>
									{{ item.badge }}
								</span>
								<UIcon
									v-if="selectedLocale === item.value"
									name="i-lucide-check"
									class="ml-auto text-base"
								/>
							</UButton>
						</div>
					</template>
				</UPopover>
			</div>
		</div>
	</header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()
const colorMode = useColorMode()
const nuxtApp = useNuxtApp()

type LocaleCode = 'zh-CN' | 'ja-JP' | 'en-US'
type ThemeMode = 'light' | 'dark' | 'system'

const themeIconMap = {
	light: 'i-lucide-sun',
	dark: 'i-lucide-moon',
} as const

const localeItems: { label: string; value: LocaleCode; badge?: string }[] = [
	{ label: '简体中文', value: 'zh-CN' },
	{ label: '日本語', value: 'ja-JP', badge: 'AI' },
	{ label: 'English', value: 'en-US', badge: 'AI' },
]

const themeModes: { value: ThemeMode; label: string; icon: string }[] = [
	{ value: 'light', label: '浅色', icon: themeIconMap.light },
	{ value: 'dark', label: '深色', icon: themeIconMap.dark },
	{ value: 'system', label: '跟随系统', icon: 'i-lucide-monitor' },
]

const selectedThemeMode = computed<ThemeMode>(() => {
	const pref = colorMode.preference
	return pref === 'light' || pref === 'dark' || pref === 'system'
		? pref
		: 'system'
})

const themeButtonIconMap = {
	light: themeIconMap.light,
	dark: themeIconMap.dark,
	system: 'i-lucide-monitor',
} as const

const themeButtonIcon = computed(
	() => themeButtonIconMap[selectedThemeMode.value],
)

const selectTheme = (mode: ThemeMode): void => {
	colorMode.preference = mode
}

const selectedLocale = computed(() => locale.value as LocaleCode)

const selectLocale = async (value: LocaleCode): Promise<void> => {
	if (!value || value === locale.value) {
		return
	}

	const setLocale = (
		nuxtApp.$i18n as { setLocale?: (code: LocaleCode) => Promise<void> }
	).setLocale

	if (setLocale) {
		await setLocale(value)
		return
	}

	locale.value = value
}
</script>

<style scoped>
.header-shell {
	background-color: var(--color-primary);
	border-color: color-mix(in srgb, var(--color-primary) 70%, transparent);
}
</style>
