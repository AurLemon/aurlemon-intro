<template>
	<header data-page-header class="sticky top-0 z-100 pt-6 lg:pt-10 lg:pb-16">
		<div
			class="absolute top-0 left-0 right-0 -bottom-4/5 lg:-bottom-3/5 z-10 pointer-events-none backdrop-blur-[8px] dark:backdrop-blur-[12px] mask-[linear-gradient(to_bottom,black_0%,rgba(0,0,0,0.95)_18%,rgba(0,0,0,0.82)_32%,rgba(0,0,0,0.6)_46%,rgba(0,0,0,0.35)_60%,rgba(0,0,0,0.14)_72%,rgba(0,0,0,0.03)_84%,transparent_92%)]"
		/>
		<div
			class="absolute top-0 left-0 right-0 -bottom-4/5 lg:-bottom-3/5 z-10 pointer-events-none bg-[linear-gradient(to_bottom,rgba(250,250,250,0.94)_0%,rgba(250,250,250,0.88)_18%,rgba(250,250,250,0.72)_32%,rgba(250,250,250,0.5)_46%,rgba(250,250,250,0.27)_60%,rgba(250,250,250,0.1)_72%,rgba(250,250,250,0.02)_84%,transparent_92%)] dark:bg-[linear-gradient(to_bottom,rgba(25,32,36,0.88)_0%,rgba(25,32,36,0.8)_18%,rgba(25,32,36,0.65)_32%,rgba(25,32,36,0.45)_46%,rgba(25,32,36,0.25)_60%,rgba(25,32,36,0.1)_72%,rgba(25,32,36,0.02)_84%,transparent_92%)]"
		/>
		<div
			class="mx-auto max-w-4xl px-6 lg:px-0 flex items-center justify-between relative z-40"
		>
			<div>
				<ReadingProgress targetSelector="#page-container" />
			</div>
			<div
				data-theme-controls
				class="flex shrink-0 items-center gap-2 [view-transition-name:header-controls]"
			>
				<UPopover
					:popper="{ placement: 'bottom-end' }"
					:ui="{
						content:
							'z-[40000] theme-controls-popover [view-transition-name:header-theme-menu]',
					}"
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
					:ui="{
						content:
							'z-[40000] theme-controls-popover [view-transition-name:header-language-menu]',
					}"
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
import { computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n({ useScope: 'global' })
const colorMode = useColorMode()
const { applyThemeChange, isTransitioning } = useThemeTransition()
const nuxtApp = useNuxtApp()

type LocaleCode = 'zh-CN' | 'ja-JP' | 'en-US'
type ThemeMode = 'light' | 'dark' | 'system'

const themeIconMap = {
	light: 'i-lucide-sun',
	dark: 'i-lucide-moon',
} as const

const getThemeModeIcon = (mode: ThemeMode): string =>
	mode === 'system' ? 'i-lucide-monitor' : themeIconMap[mode]

const localeItems: { label: string; value: LocaleCode; badge?: string }[] = [
	{ label: '简体中文', value: 'zh-CN' },
	{ label: '日本語', value: 'ja-JP', badge: 'AI' },
	{ label: 'English', value: 'en-US', badge: 'AI' },
]

const themeModes: { value: ThemeMode; label: string; icon: string }[] = [
	{ value: 'light', label: '浅色', icon: themeIconMap.light },
	{ value: 'dark', label: '深色', icon: themeIconMap.dark },
	{ value: 'system', label: '跟随系统', icon: getThemeModeIcon('system') },
]

const selectedThemeMode = computed<ThemeMode>(() => {
	const pref = colorMode.preference
	return pref === 'light' || pref === 'dark' || pref === 'system'
		? pref
		: 'system'
})

const themeButtonIcon = computed(() =>
	getThemeModeIcon(selectedThemeMode.value),
)

const selectTheme = (mode: ThemeMode): void => {
	if (colorMode.preference === mode && !isTransitioning.value) return
	void applyThemeChange(() => {
		colorMode.preference = mode
	})
}

const selectedLocale = computed(() => locale.value as LocaleCode)

const restoreScrollPosition = (savedY: number) => {
	if (!import.meta.client) {
		return
	}

	const restore = () => {
		window.scrollTo({ top: savedY, behavior: 'auto' })
	}

	restore()
	requestAnimationFrame(() => {
		restore()
		window.dispatchEvent(new Event('scroll'))
	})
}

const selectLocale = async (value: LocaleCode): Promise<void> => {
	if (!value || value === locale.value) {
		return
	}

	const savedScrollY = import.meta.client ? window.scrollY : 0

	const setLocale = (
		nuxtApp.$i18n as { setLocale?: (code: LocaleCode) => Promise<void> }
	).setLocale

	if (setLocale) {
		await setLocale(value)
		await nextTick()
		restoreScrollPosition(savedScrollY)
		return
	}

	locale.value = value
	await nextTick()
	restoreScrollPosition(savedScrollY)
}
</script>
