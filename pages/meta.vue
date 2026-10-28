<script setup lang="ts">
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/ja'
import CcIcon from '~/assets/resources/brand/creative-commons/cc.svg'
import ByIcon from '~/assets/resources/brand/creative-commons/by.svg'
import NcIcon from '~/assets/resources/brand/creative-commons/nc.svg'
import SaIcon from '~/assets/resources/brand/creative-commons/sa.svg'
import type { SiteLikeSummary } from '~/shared/types/social'
import type {
	SiteMetaResponse,
	SiteServiceStatus,
} from '~/shared/types/site-meta'

interface InformationHint {
	label: string
	text: string
}

interface TechnologyItem {
	name: string
	version: string
}

interface InformationRow {
	label: string
	value: string
	href?: string
	title?: string
	hint?: InformationHint
	technologies?: TechnologyItem[]
	state?: SiteServiceStatus['state']
	updatedAt?: string
	committedAt?: string
}

interface InformationSection {
	id: string
	title: string
	rows: InformationRow[]
	hint?: InformationHint
}

dayjs.extend(localizedFormat)

const contentLicenseUrl = 'https://creativecommons.org/licenses/by-nc-sa/4.0/'
const contentLicenseIcons = [CcIcon, ByIcon, NcIcon, SaIcon]

const { t, locale } = useI18n({ useScope: 'global' })
const colorMode = useColorMode()
const { fingerprint } = useSiteFingerprint()
const likeSummary = useState<SiteLikeSummary | null>(
	'site-like-summary',
	() => null,
)
const { data, status, error, refresh } =
	await useFetch<SiteMetaResponse>('/api/site-meta')
const userAgent = ref('')
const clientReady = ref(false)
const unknown = computed(() => t('meta.states.unknown'))
const commit = computed(() => data.value?.build.commit ?? '')
const dateLocales: Record<string, string> = {
	'zh-CN': 'zh-cn',
	'en-US': 'en',
	'ja-JP': 'ja',
}
const dateLocale = computed(() => dateLocales[locale.value] ?? 'en')
const technologyNames: Record<string, string> = {
	nuxt: 'Nuxt',
	vue: 'Vue',
	typescript: 'TypeScript',
	'@nuxt/ui': 'Nuxt UI',
	'@nuxt/content': 'Nuxt Content',
	tailwindcss: 'Tailwind CSS',
	nitro: 'Nitro',
}
const tooltipUi = {
	content: 'h-auto max-w-[min(22rem,calc(100vw-2rem))] px-3 py-2',
	text: 'whitespace-normal text-pretty leading-relaxed',
}
const runtimeRows = computed<InformationRow[]>(() => [
	{
		label: t('meta.fields.commit'),
		value: commit.value ? commit.value.slice(0, 12) : unknown.value,
		href: commit.value
			? `https://github.com/AurLemon/aurlemon-intro/commit/${commit.value}`
			: undefined,
		title: commit.value || undefined,
		committedAt: data.value?.build.committedAt,
	},
	{
		label: t('meta.fields.nodeVersion'),
		value: data.value?.runtime.node ?? unknown.value,
	},
	{
		label: t('meta.fields.v8Version'),
		value: data.value?.runtime.v8 ?? unknown.value,
	},
	{
		label: t('meta.fields.platform'),
		value: data.value?.runtime.platform ?? unknown.value,
	},
	{
		label: t('meta.fields.architecture'),
		value: data.value?.runtime.architecture ?? unknown.value,
	},
	{
		label: t('meta.fields.serverTimezone'),
		value: data.value?.runtime.timezone ?? unknown.value,
	},
	{ label: t('meta.fields.rendering'), value: 'SSR' },
	{
		label: t('meta.fields.technologies'),
		value: unknown.value,
		technologies: data.value?.build.dependencies.map((item) => ({
			name: technologyNames[item.name] ?? item.name,
			version: item.version,
		})),
	},
])
const clientRows = computed<InformationRow[]>(() => [
	{
		label: t('meta.fields.userAgent'),
		value: userAgent.value || unknown.value,
	},
	{
		label: t('meta.fields.theme'),
		value: clientReady.value
			? t(`header.theme.${colorMode.value === 'dark' ? 'dark' : 'light'}`)
			: unknown.value,
	},
	{
		label: t('meta.fields.fingerprint'),
		value: fingerprint.value
			? `${fingerprint.value.slice(0, 8)}***${fingerprint.value.slice(-4)}`
			: unknown.value,
		hint: {
			label: t('meta.fingerprintInfo'),
			text: t('meta.fingerprintNote'),
		},
	},
	{
		label: t('meta.fields.like'),
		value: likeSummary.value
			? t(likeSummary.value.hasLiked ? 'meta.liked' : 'meta.notLiked')
			: unknown.value,
	},
])
const informationSections = computed<InformationSection[]>(() => [
	{
		id: 'runtime',
		title: t('meta.sections.runtime'),
		rows: runtimeRows.value,
	},
	{
		id: 'services',
		title: t('meta.sections.services'),
		hint: {
			label: t('meta.servicesInfo'),
			text: t('meta.servicesNote'),
		},
		rows:
			data.value?.services.map((service) => ({
				label: t(`meta.services.${service.id}`),
				value: t(`meta.states.${service.state}`),
				state: service.state,
				updatedAt: service.updatedAt,
				hint:
					service.id === 'email'
						? {
								label: t('meta.serviceInfo', {
									service: t('meta.services.email'),
								}),
								text: t('meta.serviceNotes.email'),
							}
						: undefined,
			})) ?? [],
	},
	{
		id: 'client',
		title: t('meta.sections.client'),
		rows: clientRows.value,
	},
])
const serviceIcons: Record<SiteServiceStatus['state'], string> = {
	cached: 'i-lucide-circle-check',
	available: 'i-lucide-circle-check',
	configured: 'i-lucide-settings',
	stale: 'i-lucide-clock',
	degraded: 'i-lucide-triangle-alert',
	unavailable: 'i-lucide-circle-x',
	unconfigured: 'i-lucide-circle-minus',
	unknown: 'i-lucide-circle-help',
}
const formatDate = (value: string): string => {
	// Only the browser knows the visitor's effective timezone.
	if (!clientReady.value) return unknown.value
	return dayjs(value).locale(dateLocale.value).format('L LTS')
}

onMounted(() => {
	userAgent.value = navigator.userAgent
	clientReady.value = true
})
</script>

<template>
	<div class="min-w-0 font-sans text-slate-900 dark:text-slate-100">
		<ContentHeader
			page="meta"
			:title="$t('main.contentPages.meta.title')"
			:show-emoji="false"
		/>

		<div class="space-y-12 text-base leading-relaxed">
			<section
				:aria-label="$t('meta.sections.license')"
				class="flex flex-col gap-5 [&>p]:my-0"
			>
				<ProseP lang="en" class="text-left!">
					<NuxtLink
						to="https://github.com/AurLemon/aurlemon-intro/blob/main/LICENSE"
						target="_blank"
						rel="noopener noreferrer"
						lang="en"
						:title="$t('meta.openLicense')"
						class="block w-fit max-w-full rounded-sm font-medium underline decoration-slate-400/40 underline-offset-4 transition-opacity duration-200 hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
					>
						Copyright (c) 2025 AurLemon. All rights reserved.
					</NuxtLink>
				</ProseP>
				<ProseP>{{ $t('meta.licenseNotice') }}</ProseP>
				<ProseP>
					<i18n-t keypath="meta.contentLicenseNotice" tag="span">
						<template #license>
							<NuxtLink
								:to="contentLicenseUrl"
								target="_blank"
								rel="license noopener noreferrer"
								:aria-label="$t('meta.contentLicenseLabel')"
								class="rounded-sm border-b border-slate-400/40 pb-0.5 transition-opacity duration-200 hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 motion-reduce:transition-none"
							>
								<span
									aria-hidden="true"
									class="mr-1.5 inline-flex gap-1 align-[-0.125em]"
								>
									<component
										:is="icon"
										v-for="(icon, index) in contentLicenseIcons"
										:key="index"
										class="size-4 fill-current [&_circle]:fill-none"
									/>
								</span>
								<wbr />
								<span>CC BY-NC-SA 4.0</span>
							</NuxtLink>
						</template>
					</i18n-t>
				</ProseP>
			</section>

			<div v-if="error" role="status" class="flex flex-wrap items-center gap-3">
				<p>{{ $t('meta.loadFailed') }}</p>
				<UButton
					color="neutral"
					variant="soft"
					size="xs"
					class="text-base"
					:loading="status === 'pending'"
					@click="refresh()"
					>{{ $t('meta.retry') }}</UButton
				>
			</div>

			<section
				v-for="section in informationSections"
				:key="section.id"
				:aria-labelledby="`${section.id}-title`"
			>
				<h2
					:id="`${section.id}-title`"
					class="mb-5 flex items-center gap-2 font-sans text-2xl font-semibold"
				>
					{{ section.title }}
					<UTooltip
						v-if="section.hint"
						:text="section.hint.text"
						:ui="tooltipUi"
						:delay-duration="50"
					>
						<button
							type="button"
							:aria-label="section.hint.label"
							class="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-slate-300 dark:hover:text-white"
						>
							<UIcon name="i-lucide-info" class="size-4" />
						</button>
					</UTooltip>
				</h2>
				<dl class="space-y-6">
					<div
						v-for="row in section.rows"
						:key="row.label"
						class="grid min-w-0 gap-1 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
					>
						<dt class="flex items-center gap-1.5 self-start font-normal">
							{{ row.label }}
							<UTooltip
								v-if="row.hint"
								:text="row.hint.text"
								:ui="tooltipUi"
								:delay-duration="50"
							>
								<button
									type="button"
									:aria-label="row.hint.label"
									class="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-slate-300 dark:hover:text-white"
								>
									<UIcon name="i-lucide-info" class="size-4" />
								</button>
							</UTooltip>
						</dt>
						<dd
							class="min-w-0 font-sans font-medium [overflow-wrap:anywhere] [word-break:normal]"
						>
							<div
								v-if="row.technologies?.length"
								class="flex flex-wrap gap-x-2.5 gap-y-1"
							>
								<span
									v-for="technology in row.technologies"
									:key="technology.name"
									class="inline-flex items-center gap-1"
								>
									{{ technology.name }}
									<UBadge
										color="neutral"
										variant="soft"
										size="sm"
										class="font-sans font-normal"
										>{{ technology.version }}</UBadge
									>
								</span>
							</div>
							<span v-else-if="row.href" class="flex items-center gap-2">
								<NuxtLink
									:to="row.href"
									:title="row.title"
									target="_blank"
									rel="noopener noreferrer"
									class="underline decoration-slate-400/40 underline-offset-4 transition-opacity duration-200 hover:opacity-70 focus-visible:opacity-70 motion-reduce:transition-none"
									>{{ row.value }}</NuxtLink
								>
								<UBadge
									v-if="row.committedAt"
									color="neutral"
									variant="soft"
									size="sm"
									class="font-sans font-normal"
									:title="
										$t('meta.commitTime', {
											time: formatDate(row.committedAt),
										})
									"
								>
									<time :datetime="row.committedAt">{{
										formatDate(row.committedAt)
									}}</time>
								</UBadge>
							</span>
							<span
								v-else-if="row.state"
								class="flex max-w-full items-center gap-2 whitespace-nowrap"
							>
								<UIcon
									aria-hidden="true"
									class="size-4 shrink-0"
									:name="serviceIcons[row.state]"
								/>
								{{ row.value }}
								<UBadge
									v-if="row.updatedAt"
									color="neutral"
									variant="soft"
									size="sm"
									class="min-w-0 font-sans font-normal"
									:title="`${$t('meta.lastSync')} ${formatDate(row.updatedAt)}`"
								>
									<time :datetime="row.updatedAt">{{
										formatDate(row.updatedAt)
									}}</time>
								</UBadge>
							</span>
							<template v-else>{{ row.value }}</template>
						</dd>
					</div>
				</dl>
			</section>
		</div>
	</div>
</template>
