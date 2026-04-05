<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '~/layouts/PageHeader.vue'
import PageFooter from '~/layouts/PageFooter.vue'
import PageMenu from '~/layouts/PageMenu.vue'

type NuxtErrorLike = {
	statusCode?: number
	status?: number
	statusText?: string
	message?: string
}

const props = defineProps<{
	error: NuxtErrorLike
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const statusCode = computed(
	() => props.error.statusCode ?? props.error.status ?? 500,
)

const handleBackHome = () => clearError({ redirect: localePath('/') })
const handleBackAbout = () => clearError({ redirect: localePath('/about') })

useHead(() => ({
	title: `${statusCode.value} - ${t('error.pageTitle')}`,
	meta: [
		{
			name: 'robots',
			content: 'noindex,nofollow',
		},
	],
}))
</script>

<template>
	<UApp
		:toaster="{
			position: 'top-right',
			ui: {
				viewport: 'z-[60000]',
			},
		}"
	>
		<div class="flex flex-col min-h-[105vh]">
			<PageHeader />

			<main
				class="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-12 md:px-0 md:py-20"
			>
				<section class="w-full overflow-hidden md:p-12">
					<div class="flex flex-col items-center text-center">
						<div
							class="font-serif text-[clamp(5rem,16vw,10rem)] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100"
						>
							{{ statusCode }}
						</div>

						<div
							class="mt-4 text-lg font-medium tracking-[0.35em] text-slate-500 dark:text-slate-400 md:text-xl"
						>
							{{ t('error.accessError') }}
						</div>

						<div class="mt-8 flex flex-wrap justify-center gap-1">
							<UButton color="primary" variant="link" @click="handleBackHome">
								{{ t('error.backHome') }}
							</UButton>
							<UButton color="neutral" variant="link" @click="handleBackAbout">
								{{ t('error.backAbout') }}
							</UButton>
						</div>
					</div>
				</section>
			</main>

			<PageFooter />
			<PageMenu />
		</div>
	</UApp>
</template>
