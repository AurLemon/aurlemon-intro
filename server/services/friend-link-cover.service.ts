import prisma from '~/lib/prisma'
import type { Prisma } from '~/generated/prisma/client'
import type {
	FriendLinkCoverAdminResponse,
	FriendLinkCoverSettings,
	FriendLinkCoverState,
	FriendLinkCoverSummary,
	FriendLinkCoverVariant,
} from '~/shared/types/friend-link-cover'
import {
	captureFriendLinkCover,
	getFriendLinkBrowserPath,
} from '~/server/utils/friend-link-capture'
import {
	readPersistedDataSnapshot,
	writePersistedDataSnapshot,
} from '~/server/utils/persisted-data-snapshot'

interface CoverSnapshot {
	url: string
	// Read once to migrate covers written by the previous JSON snapshot format.
	imageBase64?: string
	mobileImageBase64?: string
	mobileCapturedAt?: string
	capturedAt?: string
	attemptedAt?: string
	requestedAt?: string
	failed?: boolean
}
interface CoverLink {
	id: string
	url: string
	desktopCoverImage?: Uint8Array | null
	mobileCoverImage?: Uint8Array | null
	desktopCoverAt?: Date | null
	mobileCoverAt?: Date | null
}
const PREFIX = 'friend-link-cover:'
const SETTINGS_KEY = 'friend-link-cover-settings'
const DAY = 86_400_000
const defaults: FriendLinkCoverSettings = { intervalDays: 30 }
let running: Promise<void> | null = null
let stopping = false

const readCover = async (id: string): Promise<CoverSnapshot | null> =>
	(await readPersistedDataSnapshot<CoverSnapshot>({ cacheKey: PREFIX + id }))
		?.data ?? null
const writeCover = async (id: string, data: CoverSnapshot) =>
	writePersistedDataSnapshot({ cacheKey: PREFIX + id, data })

const summary = (
	link: CoverLink,
	cover?: CoverSnapshot | null,
): FriendLinkCoverSummary => {
	const saved = cover?.url === link.url ? cover : null
	const desktopAt =
		link.desktopCoverAt ??
		(saved?.capturedAt ? new Date(saved.capturedAt) : null)
	const mobileAt =
		link.mobileCoverAt ??
		(saved?.mobileCapturedAt ? new Date(saved.mobileCapturedAt) : null)
	const desktopReady = Boolean(
		(link.desktopCoverImage || saved?.imageBase64) && desktopAt,
	)
	const mobileReady = Boolean(
		(link.mobileCoverImage || saved?.mobileImageBase64) && mobileAt,
	)
	const baseUrl = `/api/friend-links/${encodeURIComponent(link.id)}/cover`
	return {
		url: desktopReady
			? `${baseUrl}?v=${encodeURIComponent(desktopAt!.toISOString())}`
			: null,
		capturedAt: desktopReady ? desktopAt!.toISOString() : null,
		mobileUrl: mobileReady
			? `${baseUrl}?variant=mobile&v=${encodeURIComponent(mobileAt!.toISOString())}`
			: null,
		mobileCapturedAt: mobileReady ? mobileAt!.toISOString() : null,
	}
}

export const getFriendLinkCoverSummaries = async (
	links: CoverLink[],
): Promise<Map<string, FriendLinkCoverSummary>> => {
	if (!links.length) return new Map()
	const rows = await prisma.externalDataSnapshot.findMany({
		where: { cacheKey: { in: links.map(({ id }) => PREFIX + id) } },
	})
	const covers = new Map<string, CoverSnapshot>()
	for (const row of rows) {
		try {
			covers.set(
				row.cacheKey.slice(PREFIX.length),
				JSON.parse(row.payloadJson) as CoverSnapshot,
			)
		} catch {
			/* Ignore a corrupt optional cover. */
		}
	}
	for (const link of links) {
		const saved = covers.get(link.id)
		if (!saved || saved.url !== link.url) continue
		const data: Prisma.FriendLinkUpdateManyMutationInput = {}
		if (!link.desktopCoverImage && saved.imageBase64 && saved.capturedAt) {
			data.desktopCoverImage = Buffer.from(saved.imageBase64, 'base64')
			data.desktopCoverAt = new Date(saved.capturedAt)
		}
		if (
			!link.mobileCoverImage &&
			saved.mobileImageBase64 &&
			saved.mobileCapturedAt
		) {
			data.mobileCoverImage = Buffer.from(saved.mobileImageBase64, 'base64')
			data.mobileCoverAt = new Date(saved.mobileCapturedAt)
		}
		if (saved.imageBase64 || saved.mobileImageBase64) {
			await prisma.$transaction(async (tx) => {
				const current = await tx.friendLink.findFirst({
					where: { id: link.id, url: link.url },
				})
				if (!current) return
				// A concurrent successful capture takes precedence over a legacy image.
				if (current.desktopCoverImage) {
					delete data.desktopCoverImage
					delete data.desktopCoverAt
				}
				if (current.mobileCoverImage) {
					delete data.mobileCoverImage
					delete data.mobileCoverAt
				}
				if (Object.keys(data).length)
					await tx.friendLink.update({ where: { id: link.id }, data })
				const metadata = { ...saved }
				delete metadata.imageBase64
				delete metadata.mobileImageBase64
				await tx.externalDataSnapshot.updateMany({
					where: {
						cacheKey: PREFIX + link.id,
						payloadJson: JSON.stringify(saved),
					},
					data: { payloadJson: JSON.stringify(metadata) },
				})
			})
		}
	}
	return new Map(
		links.map((link) => [link.id, summary(link, covers.get(link.id))]),
	)
}

export const readFriendLinkCoverImage = async (
	id: string,
	variant: FriendLinkCoverVariant = 'desktop',
) => {
	const link = await prisma.friendLink.findFirst({
		where: { id, isActive: true },
		select: {
			id: true,
			url: true,
			desktopCoverImage: true,
			mobileCoverImage: true,
			desktopCoverAt: true,
			mobileCoverAt: true,
		},
	})
	if (!link) return null
	const columnImage =
		variant === 'mobile' ? link.mobileCoverImage : link.desktopCoverImage
	const columnAt =
		variant === 'mobile' ? link.mobileCoverAt : link.desktopCoverAt
	if (columnImage && columnAt)
		return {
			bytes: Buffer.from(columnImage),
			capturedAt: columnAt.toISOString(),
		}
	const cover = await readCover(id)
	if (!cover || cover.url !== link.url) return null
	const image =
		variant === 'mobile' ? cover.mobileImageBase64 : cover.imageBase64
	const capturedAt =
		variant === 'mobile' ? cover.mobileCapturedAt : cover.capturedAt

	return image && capturedAt
		? { bytes: Buffer.from(image, 'base64'), capturedAt }
		: null
}

export const getFriendLinkCoverSettings =
	async (): Promise<FriendLinkCoverSettings> => {
		const saved = await readPersistedDataSnapshot<FriendLinkCoverSettings>({
			cacheKey: SETTINGS_KEY,
		})
		return saved && [0, 7, 30, 90].includes(saved.data.intervalDays)
			? saved.data
			: defaults
	}
export const saveFriendLinkCoverSettings = async (
	settings: FriendLinkCoverSettings,
) => {
	await writePersistedDataSnapshot({ cacheKey: SETTINGS_KEY, data: settings })
}

export const getFriendLinkCoverAdminState =
	async (): Promise<FriendLinkCoverAdminResponse> => {
		const links = await prisma.friendLink.findMany({
			where: { isActive: true },
			select: {
				id: true,
				url: true,
				desktopCoverImage: true,
				mobileCoverImage: true,
				desktopCoverAt: true,
				mobileCoverAt: true,
			},
		})
		const items = await Promise.all(
			links.map(async (link): Promise<FriendLinkCoverState> => {
				const saved = await readCover(link.id)
				const current = summary(link, saved)
				const cover = saved?.url === link.url ? saved : null
				return {
					id: link.id,
					status:
						cover?.requestedAt && cover.requestedAt > (cover.attemptedAt ?? '')
							? 'queued'
							: cover?.failed
								? 'failed'
								: current.url && current.mobileUrl
									? 'ready'
									: current.url || current.mobileUrl
										? 'partial'
										: 'fallback',
					coverUrl: current.url,
					mobileCoverUrl: current.mobileUrl,
					capturedAt: current.capturedAt,
					attemptedAt: cover?.attemptedAt ?? null,
				}
			}),
		)
		return {
			browserAvailable: Boolean(getFriendLinkBrowserPath()),
			settings: await getFriendLinkCoverSettings(),
			items,
		}
	}

export const requestFriendLinkCoverRefresh = async (
	id?: string,
): Promise<void> => {
	if (!getFriendLinkBrowserPath())
		throw createError({
			statusCode: 503,
			statusMessage: 'FRIEND_LINK_BROWSER_UNAVAILABLE',
		})
	const links = await prisma.friendLink.findMany({
		where: { isActive: true, ...(id ? { id } : {}) },
		select: {
			id: true,
			url: true,
			desktopCoverImage: true,
			mobileCoverImage: true,
			desktopCoverAt: true,
			mobileCoverAt: true,
		},
	})
	if (id && !links.length)
		throw createError({
			statusCode: 404,
			statusMessage: 'FRIEND_LINK_NOT_FOUND',
		})
	for (const link of links) {
		const saved = await readCover(link.id)
		const existing = saved?.url === link.url ? saved : { url: link.url }
		// A repeated click while queued keeps the same request rather than restarting it.
		if (
			existing.requestedAt &&
			existing.requestedAt > (existing.attemptedAt ?? '')
		)
			continue
		await writeCover(link.id, {
			...existing,
			requestedAt: new Date().toISOString(),
		})
	}
}

const refreshCovers = async () => {
	if (stopping || !getFriendLinkBrowserPath()) return
	const { intervalDays } = await getFriendLinkCoverSettings()
	const links = await prisma.friendLink.findMany({
		where: { isActive: true },
		select: {
			id: true,
			url: true,
			desktopCoverImage: true,
			mobileCoverImage: true,
			desktopCoverAt: true,
			mobileCoverAt: true,
		},
	})
	for (const link of links) {
		if (stopping) break
		const saved = await readCover(link.id)
		const cover = saved?.url === link.url ? saved : { url: link.url }
		const requested = Boolean(
			cover.requestedAt && cover.requestedAt > (cover.attemptedAt ?? ''),
		)
		const currentSummary = summary(link, cover)
		const stale = [
			currentSummary.capturedAt,
			currentSummary.mobileCapturedAt,
		].some(
			(capturedAt) =>
				!capturedAt ||
				Date.parse(capturedAt) + intervalDays * DAY <= Date.now(),
		)
		// Failed automatic captures retry the next day, rather than on every tick.
		const retryDue =
			!cover.attemptedAt || Date.parse(cover.attemptedAt) + DAY <= Date.now()
		if (!requested && (!intervalDays || !stale || !retryDue)) continue
		const attemptedAt = new Date().toISOString()
		const next: CoverSnapshot = { ...cover, attemptedAt, failed: false }
		const data: Prisma.FriendLinkUpdateManyMutationInput = {}
		// Migrate an old image even when this refresh cannot replace it.
		if (!link.desktopCoverImage && cover.imageBase64 && cover.capturedAt) {
			data.desktopCoverImage = Buffer.from(cover.imageBase64, 'base64')
			data.desktopCoverAt = new Date(cover.capturedAt)
		}
		if (
			!link.mobileCoverImage &&
			cover.mobileImageBase64 &&
			cover.mobileCapturedAt
		) {
			data.mobileCoverImage = Buffer.from(cover.mobileImageBase64, 'base64')
			data.mobileCoverAt = new Date(cover.mobileCapturedAt)
		}
		for (const variant of ['desktop', 'mobile'] as const) {
			if (stopping) return
			try {
				const bytes = await captureFriendLinkCover(link.url, variant)
				const capturedAt = new Date().toISOString()
				if (variant === 'mobile') {
					data.mobileCoverImage = Uint8Array.from(bytes)
					data.mobileCoverAt = new Date(capturedAt)
				} else {
					data.desktopCoverImage = Uint8Array.from(bytes)
					data.desktopCoverAt = new Date(capturedAt)
				}
			} catch {
				next.failed = true
			}
		}
		// URL changes and deletion invalidate captures still in flight.
		await prisma.$transaction(async (tx) => {
			const current = await tx.friendLink.findFirst({
				where: { id: link.id, url: link.url, isActive: true },
				select: { id: true },
			})
			if (!current) return

			if (Object.keys(data).length)
				await tx.friendLink.update({ where: { id: link.id }, data })
			const latestRow = await tx.externalDataSnapshot.findUnique({
				where: { cacheKey: PREFIX + link.id },
			})
			let latest: CoverSnapshot | null = null
			try {
				latest = latestRow
					? (JSON.parse(latestRow.payloadJson) as CoverSnapshot)
					: null
			} catch {
				/* Optional metadata. */
			}
			const metadata: CoverSnapshot = {
				url: link.url,
				attemptedAt: next.attemptedAt,
				requestedAt:
					latest?.url === link.url ? latest.requestedAt : next.requestedAt,
				failed: next.failed,
			}
			await tx.externalDataSnapshot.upsert({
				where: { cacheKey: PREFIX + link.id },
				create: {
					cacheKey: PREFIX + link.id,
					payloadJson: JSON.stringify(metadata),
				},
				update: { payloadJson: JSON.stringify(metadata) },
			})
		})
	}
}

export const processFriendLinkCovers = (): Promise<void> => {
	if (!running)
		running = refreshCovers().finally(() => {
			running = null
		})
	return running
}
export const startFriendLinkCoverWorker = () => {
	stopping = false
}
export const stopFriendLinkCoverWorker = async () => {
	stopping = true
	await running
}
