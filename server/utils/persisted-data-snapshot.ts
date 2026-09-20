import prisma from '~/lib/prisma'

interface PersistedDataSnapshot<T> {
	data: T
	updatedAt: Date
}

declare global {
	var __persistedDataSnapshotRefreshes__:
		| Map<string, Promise<unknown>>
		| undefined
}

const inFlightRefreshes =
	globalThis.__persistedDataSnapshotRefreshes__ ??
	new Map<string, Promise<unknown>>()

if (!globalThis.__persistedDataSnapshotRefreshes__) {
	globalThis.__persistedDataSnapshotRefreshes__ = inFlightRefreshes
}

export const isPersistedDataSnapshotFresh = (
	updatedAt: Date,
	ttlMs: number,
	now = Date.now(),
): boolean => updatedAt.getTime() + ttlMs > now

export const readPersistedDataSnapshot = async <T>(options: {
	cacheKey: string
}): Promise<PersistedDataSnapshot<T> | null> => {
	const snapshot = await prisma.externalDataSnapshot.findUnique({
		where: { cacheKey: options.cacheKey },
	})

	if (!snapshot) {
		return null
	}

	try {
		return {
			data: JSON.parse(snapshot.payloadJson) as T,
			updatedAt: snapshot.updatedAt,
		}
	} catch {
		console.warn(
			`PERSISTED_DATA_SNAPSHOT_INVALID_JSON cacheKey=${options.cacheKey}`,
		)
		return null
	}
}

export const writePersistedDataSnapshot = async <T>(options: {
	cacheKey: string
	data: T
}): Promise<void> => {
	await prisma.externalDataSnapshot.upsert({
		where: { cacheKey: options.cacheKey },
		create: {
			cacheKey: options.cacheKey,
			payloadJson: JSON.stringify(options.data),
		},
		update: {
			payloadJson: JSON.stringify(options.data),
		},
	})
}

export const runDeduplicatedDataSnapshotRefresh = async <T>(options: {
	cacheKey: string
	loader: () => Promise<T>
}): Promise<T> => {
	const existing = inFlightRefreshes.get(options.cacheKey)
	if (existing) {
		return (await existing) as T
	}

	const refresh = options.loader().finally(() => {
		inFlightRefreshes.delete(options.cacheKey)
	})
	inFlightRefreshes.set(options.cacheKey, refresh)

	return await refresh
}
