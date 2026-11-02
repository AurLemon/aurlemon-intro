<template>
	<section
		class="flex flex-1 items-center justify-center py-12 text-slate-800 dark:text-slate-100"
		aria-labelledby="oauth-progress-title"
		aria-busy="true"
	>
		<div
			class="flex w-full max-w-md flex-col items-center rounded-xl border border-slate-200 bg-(--color-surface-0) px-6 py-10 text-center dark:border-slate-800 dark:bg-(--color-surface-1) sm:px-10"
		>
			<div
				class="flex size-20 items-center justify-center rounded-2xl border border-slate-200 bg-(--color-surface-1) dark:border-slate-700 dark:bg-(--color-surface-0)"
				aria-hidden="true"
			>
				<LinuxDoIcon v-if="provider === 'linuxdo'" class="size-10" />
				<UIcon v-else name="i-lucide-github" class="size-10" />
			</div>
			<span
				class="mt-8 size-6 animate-spin rounded-full border-2 border-primary-600 border-r-transparent motion-reduce:animate-none dark:border-primary-300 dark:border-r-transparent"
				aria-hidden="true"
			/>
			<h1
				id="oauth-progress-title"
				class="mt-6 text-xl font-semibold sm:text-2xl"
			>
				{{ t('social.oauthProgress.title', { provider: providerName }) }}
			</h1>
			<p
				class="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300"
				role="status"
				aria-live="polite"
			>
				{{ message }}
			</p>
		</div>
	</section>
</template>

<script setup lang="ts">
import LinuxDoIcon from '~/assets/icons/linux-do.svg'
import type { OAuthFlowProvider } from '~/shared/utils/oauth'

interface Props {
	message: string
	provider: OAuthFlowProvider
}

const props = defineProps<Props>()
const providerName = computed(() =>
	props.provider === 'linuxdo' ? 'Linux DO' : 'GitHub',
)
const { t } = useI18n({ useScope: 'global' })
</script>
