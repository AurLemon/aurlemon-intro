<template>
	<header class="flex items-center justify-between sticky top-6 z-40 my-6">
		<div>
			<ReadingProgress targetSelector="#article-container" />
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
					<UIcon :name="currentThemeIcon" class="h-5 w-5" />
				</UButton>

				<template #content>
					<div class="w-40 space-y-1 p-2">
						<button
							v-for="mode in themeModes"
							:key="mode.value"
							type="button"
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
							:class="{
								'bg-primary-100/60 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200':
									selectedThemeMode === mode.value,
								'text-slate-600 dark:text-slate-300':
									selectedThemeMode !== mode.value,
							}"
							@click="selectTheme(mode.value)"
						>
							<UIcon
								:name="mode.value === 'system' ? currentThemeIcon : mode.icon"
								class="text-base"
							/>
							<span>{{ mode.label }}</span>
							<UIcon
								v-if="selectedThemeMode === mode.value"
								name="i-lucide-check"
								class="ml-auto text-base"
							/>
						</button>
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
						<button
							v-for="item in localeItems"
							:key="item.value"
							type="button"
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
							:class="{
								'bg-primary-100/60 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200':
									selectedLocale === item.value,
								'text-slate-600 dark:text-slate-300':
									selectedLocale !== item.value,
							}"
							@click="selectLocale(item.value)"
						>
							<span>{{ item.label }}</span>
							<UIcon
								v-if="selectedLocale === item.value"
								name="i-lucide-check"
								class="ml-auto text-base"
							/>
						</button>
					</div>
				</template>
			</UPopover>
		</div>
	</header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()
const colorMode = useColorMode()
const nuxtApp = useNuxtApp()

type LocaleCode = 'zh-CN' | 'ja-JP' | 'en-US'
type ThemeMode = 'light' | 'dark' | 'system'

const localeItems: { label: string; value: LocaleCode }[] = [
	{ label: '简体中文', value: 'zh-CN' },
	{ label: '日本語', value: 'ja-JP' },
	{ label: 'English', value: 'en-US' },
]

const themeModes: { value: ThemeMode; label: string; icon: string }[] = [
	{ value: 'light', label: '浅色', icon: 'i-lucide-sun' },
	{ value: 'dark', label: '深色', icon: 'i-lucide-moon' },
	{ value: 'system', label: '跟随系统', icon: 'i-lucide-sun' },
]

const currentTheme = computed<'light' | 'dark'>(() =>
	colorMode.value === 'dark' ? 'dark' : 'light',
)

const selectedThemeMode = computed<ThemeMode>(() => {
	const pref = colorMode.preference
	return pref === 'light' || pref === 'dark' || pref === 'system'
		? pref
		: 'system'
})

const currentThemeIcon = computed(() => {
	const found = themeModes.find((mode) => mode.value === currentTheme.value)
	return found?.icon ?? 'i-lucide-sun'
})

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
