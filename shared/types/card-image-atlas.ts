// 构建时测量，不包含额外的图片 URL。
import type { CardAppearanceProfile } from './card-appearance'

export interface CardAtlasRegion {
	id: string
	x: number
	y: number
	width: number
	height: number
	profile?: CardAppearanceProfile
}

// 多图只提供一个 URL；regions 是本地 SVG 裁切坐标，不是待下载的图片列表。
export interface CardImageAtlas {
	url: string
	width: number
	height: number
	regions: readonly CardAtlasRegion[]
}

export interface CardCoverMetadata {
	title: string
	author: readonly string[]
	category: string
	album?: string
	href: string
}

export interface CardImageCover extends Partial<CardCoverMetadata> {
	id: string
	url: string
}
