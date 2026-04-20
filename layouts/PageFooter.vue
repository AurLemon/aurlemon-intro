<template>
	<footer class="mx-auto max-w-4xl w-full px-6 lg:px-0 my-6 mb-16 mt-auto">
		<div class="mb-12 flex justify-center items-center">
			<SiteLikeButton
				:refresh-signal="socialSummaryRefreshSignal"
				@summary-change="handleSiteLikeSummaryChange"
			/>
			<UTooltip :text="messageTooltipLabel" :delay-duration="50">
				<div
					class="transition-all duration-300 ease-out"
					:class="
						messageReady
							? 'opacity-100 translate-y-0 scale-100'
							: 'opacity-0 translate-y-1 scale-95 pointer-events-none'
					"
				>
					<UButton
						color="neutral"
						variant="link"
						class="rounded-full"
						@click="messageOpen = true"
					>
						<UIcon name="i-lucide-messages-square" class="h-5 w-5" />
						<span class="block text-base">{{ messageButtonLabel }}</span>
					</UButton>
				</div>
			</UTooltip>
			<GithubLoginCountButton
				:count="githubLoginUserCount"
				:ready="githubLoginReady"
				@open-list="githubLoginListOpen = true"
			/>
		</div>
		<div class="w-full flex flex-col justify-between lg:flex-row">
			<SiteMark />
			<div
				class="mt-3 lg:mt-0 break-all flex flex-wrap gap-x-2 lg:items-center lg:gap-x-4 text-[15px] text-slate-800 dark:text-slate-200 tracking-wide"
				@mouseleave="hoveredLink = null"
			>
				<NuxtLink
					:to="localePath('/about')"
					:class="linkClass(0)"
					@mouseenter="hoveredLink = 0"
				>
					{{ $t('footer.aboutSite') }}
				</NuxtLink>
				<NuxtLink
					:to="localePath('/friends')"
					:class="linkClass(1)"
					@mouseenter="hoveredLink = 1"
				>
					{{ $t('footer.friendLink') }}
				</NuxtLink>
				<NuxtLink
					to="https://github.com/AurLemon"
					target="_blank"
					rel="noopener noreferrer"
					:class="linkClass(2)"
					@mouseenter="hoveredLink = 2"
				>
					{{ $t('footer.githubProfile') }}
				</NuxtLink>
				<NuxtLink
					to="https://beian.miit.gov.cn"
					target="_blank"
					rel="noopener noreferrer"
					:class="linkClass(3)"
					@mouseenter="hoveredLink = 3"
				>
					{{ $t('footer.miitRegistration') }}
				</NuxtLink>
			</div>
		</div>
		<MessageBoardModal
			v-model:open="messageOpen"
			@open-site-like-list="openSiteLikeListFromMessage"
			@refresh-message-count="loadMessageCount"
		/>
		<SiteLikeListModal
			v-model:open="siteLikeListOpen"
			@refresh-summary="refreshSocialSummary"
		/>
		<GithubLoginUserListModal
			v-model:open="githubLoginListOpen"
			@refresh-summary="refreshSocialSummary"
		/>
	</footer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'

import SiteMark from '~/components/branding/AurLemon.vue'
import GithubLoginCountButton from '~/components/footer/GithubLoginCountButton.vue'
import SiteLikeButton from '~/components/footer/SiteLikeButton.vue'
import GithubLoginUserListModal from '~/components/message/GithubLoginUserListModal.vue'
import MessageBoardModal from '~/components/message/MessageBoardModal.vue'
import SiteLikeListModal from '~/components/message/SiteLikeListModal.vue'
import type {
	MessageBoardResponse,
	MessageCommentItem,
	SiteLikeSummary,
} from '~/shared/types/social'

const { t } = useI18n()
const localePath = useLocalePath()
const hoveredLink = ref<number | null>(null)
const messageOpen = ref(false)
const siteLikeListOpen = ref(false)
const githubLoginListOpen = ref(false)
const messageCount = ref(0)
const messageReady = ref(false)
const githubLoginUserCount = ref(0)
const githubLoginReady = ref(false)
const socialSummaryRefreshSignal = ref(0)

const countMessageItems = (items: MessageCommentItem[]): number =>
	items.reduce((total, item) => total + 1 + countMessageItems(item.replies), 0)

const messageButtonLabel = computed(() =>
	t('social.message.count', { count: messageCount.value }),
)

const messageTooltipLabel = computed(() => t('social.tooltip.messageBoard'))

const handleSiteLikeSummaryChange = (summary: SiteLikeSummary) => {
	githubLoginUserCount.value = summary.githubLoginUserCount
	githubLoginReady.value = true
}

const refreshSocialSummary = () => {
	socialSummaryRefreshSignal.value += 1
}

const loadMessageCount = async () => {
	try {
		const response = await $fetch<MessageBoardResponse>('/api/messages')
		messageCount.value =
			response.pagination?.totalCommentCount ??
			countMessageItems(response.items)
	} catch {
		messageCount.value = 0
	} finally {
		messageReady.value = true
	}
}

const openSiteLikeListFromMessage = async () => {
	messageOpen.value = false
	await nextTick()
	siteLikeListOpen.value = true
}

const linkClass = (index: number) => [
	'transition-colors',
	hoveredLink.value === null
		? 'text-slate-800 dark:text-slate-200'
		: hoveredLink.value === index
			? 'text-slate-800 dark:text-slate-200'
			: 'text-slate-500 dark:text-slate-400',
]

onMounted(() => {
	void loadMessageCount()
})
</script>
