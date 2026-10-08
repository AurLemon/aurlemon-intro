<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import wordmarkSource from '~/assets/resources/sitemark/text_mark.svg?raw'

interface HandwritingProps {
	/** Total writing time in milliseconds. */
	duration?: number
	/** Write, fade the ink in place, and repeat while visible. */
	loop?: boolean
}

interface HandwritingSpeedZone {
	/** Fraction of the stroke length. */
	start: number
	end: number
	speed: number
}

interface HandwritingStroke {
	d: string
	width: number
	duration: number
	pauseBefore: number
	clipX: number
	clipWidth: number
	speedZones?: HandwritingSpeedZone[]
}

const props = withDefaults(defineProps<HandwritingProps>(), {
	duration: 4000,
	loop: false,
})
const svgRef = ref<SVGSVGElement | null>(null)
const complete = ref(false)
const maskId = `aurlemon-writing-${useId()}`
// Keep the artwork in the shared SVG; these paths describe only the pen movement.
const wordmarkPath = wordmarkSource.match(/\bd="([^"]+)"/)?.[1]
const strokes: HandwritingStroke[] = [
	{
		d: 'M 30 430 C 95 327 198 164 276 64 C 307 21 334 19 331 74 C 323 149 295 232 274 323 C 263 364 265 384 278 401',
		width: 100,
		duration: 360,
		pauseBefore: 0,
		clipX: 0,
		clipWidth: 365,
		speedZones: [{ start: 0.04, end: 0.4, speed: 1.45 }],
	},
	{
		d: 'M 51 288 C 115 253 210 237 323 222',
		width: 82,
		duration: 130,
		pauseBefore: 45,
		clipX: 0,
		clipWidth: 365,
		speedZones: [{ start: 0.08, end: 0.95, speed: 1.7 }],
	},
	{
		d: 'M 416 220 C 395 255 350 327 364 352 C 390 412 473 282 514 211 C 492 260 467 306 480 344 C 496 386 531 372 564 331',
		width: 94,
		duration: 270,
		pauseBefore: 55,
		clipX: 335,
		clipWidth: 230,
		speedZones: [
			{ start: 0.27, end: 0.53, speed: 1.65 },
			{ start: 0.8, end: 1, speed: 2.1 },
		],
	},
	{
		d: 'M 645 199 C 626 242 600 298 586 352 C 610 298 663 244 696 240 C 720 224 732 230 734 247 C 737 268 764 254 804 244',
		width: 100,
		duration: 200,
		pauseBefore: 0,
		clipX: 565,
		clipWidth: 245,
		speedZones: [
			{ start: 0.32, end: 0.58, speed: 1.55 },
			{ start: 0.76, end: 1, speed: 2.35 },
		],
	},
	{
		d: 'M 972 28 C 919 92 870 176 837 244 C 804 312 781 366 803 397 C 832 445 904 418 972 384 L 1024 354',
		width: 100,
		duration: 310,
		pauseBefore: 25,
		clipX: 755,
		clipWidth: 320,
		speedZones: [
			{ start: 0.04, end: 0.48, speed: 1.4 },
			{ start: 0.75, end: 1, speed: 2 },
		],
	},
	{
		d: 'M 1018 286 C 1068 316 1122 267 1138 225 C 1157 174 1104 174 1067 217 C 1013 277 979 351 1023 368 C 1064 394 1146 342 1224 292',
		width: 95,
		duration: 260,
		pauseBefore: 30,
		clipX: 970,
		clipWidth: 270,
		speedZones: [{ start: 0.76, end: 1, speed: 2.2 }],
	},
	{
		d: 'M 1209 220 C 1273 179 1258 208 1234 252 L 1194 355 C 1228 304 1281 246 1309 235 C 1334 229 1307 295 1300 338 C 1336 296 1381 249 1402 251 C 1426 251 1398 298 1404 334 C 1410 381 1465 340 1518 296',
		width: 96,
		duration: 290,
		pauseBefore: 10,
		clipX: 1180,
		clipWidth: 355,
		speedZones: [
			{ start: 0.3, end: 0.43, speed: 1.6 },
			{ start: 0.56, end: 0.7, speed: 1.8 },
			{ start: 0.84, end: 1, speed: 2.3 },
		],
	},
	{
		d: 'M 1540 282 C 1564 230 1616 182 1642 202 C 1697 237 1618 370 1569 370 C 1505 366 1519 309 1540 282',
		width: 96,
		duration: 240,
		pauseBefore: 15,
		clipX: 1490,
		clipWidth: 205,
		speedZones: [{ start: 0.31, end: 0.64, speed: 1.3 }],
	},
	{
		d: 'M 1741 219 C 1723 268 1693 306 1682 354 C 1735 320 1783 276 1819 263 C 1860 247 1814 335 1862 357 C 1881 366 1916 348 1945 327',
		width: 126,
		duration: 270,
		pauseBefore: 15,
		clipX: 1670,
		clipWidth: 296,
		speedZones: [
			{ start: 0.29, end: 0.52, speed: 1.7 },
			{ start: 0.8, end: 1, speed: 2 },
		],
	},
]

let animations: Animation[] = []
let observer: IntersectionObserver | null = null
let motionPreference: MediaQueryList | null = null
let disposed = false
let started = false
let inView = false

// Slow the pen at turns and near stroke endpoints instead of sweeping uniformly.
const createPenFrames = (
	path: SVGPathElement,
	trailingDistance = 0,
	speedZones: HandwritingSpeedZone[] = [],
): Keyframe[] => {
	const sampleCount = 96
	const length = path.getTotalLength()
	const points = Array.from({ length: sampleCount + 1 }, (_, index) =>
		path.getPointAtLength((index / sampleCount) * length),
	)
	const weights = Array.from({ length: sampleCount }, (_, index) => {
		const previous = points[Math.max(0, index - 1)]!
		const point = points[index]!
		const next = points[index + 1]!
		const incomingX = point.x - previous.x
		const incomingY = point.y - previous.y
		const outgoingX = next.x - point.x
		const outgoingY = next.y - point.y
		const magnitude =
			Math.hypot(incomingX, incomingY) * Math.hypot(outgoingX, outgoingY)
		const alignment =
			magnitude > 0
				? Math.max(
						-1,
						Math.min(
							1,
							(incomingX * outgoingX + incomingY * outgoingY) / magnitude,
						),
					)
				: 1
		const endpointWeight =
			0.7 * Math.exp(-index / (sampleCount / 12)) +
			0.4 * Math.exp(-(sampleCount - 1 - index) / (sampleCount / 12))
		const progress = (index + 0.5) / sampleCount
		const speed = speedZones.reduce((current, zone) => {
			if (progress <= zone.start || progress >= zone.end) return current
			const position = (progress - zone.start) / (zone.end - zone.start)
			// Ease into each connecting sweep and slow again before the next turn.
			return Math.max(
				current,
				1 + (zone.speed - 1) * Math.sin(Math.PI * position) ** 2,
			)
		}, 1)
		return (1 + 2 * (1 - alignment) + endpointWeight) / speed
	})
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
	let elapsed = 0
	const frames: Keyframe[] = [
		{ strokeDashoffset: '1', opacity: 0, offset: 0 },
		{ strokeDashoffset: '1', opacity: 1, offset: 0.001 },
	]
	weights.forEach((weight, index) => {
		elapsed += weight
		const progress = (index + 1) / sampleCount
		// Let the smaller round tip lead; catch up completely at each stroke end.
		const trailingProgress =
			(trailingDistance / length) * Math.sin(Math.PI * progress)
		frames.push({
			strokeDashoffset: String(
				1 - Math.max(0, Math.min(1, progress - trailingProgress)),
			),
			opacity: 1,
			offset: elapsed / totalWeight,
		})
	})
	return frames
}

const finish = (): void => {
	complete.value = true
	observer?.disconnect()
	// Cancelling also works for infinite animations when reduced motion is enabled.
	animations.forEach((animation) => animation.cancel())
}

const updatePlayback = (): void => {
	if (!started || complete.value) return
	const playing = !document.hidden && (!props.loop || inView)
	animations.forEach((animation) =>
		playing ? animation.play() : animation.pause(),
	)
}

const onMotionPreferenceChange = (event: MediaQueryListEvent): void => {
	if (event.matches) finish()
}

onMounted(() => {
	const svg = svgRef.value
	if (!svg || disposed) return
	motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
	motionPreference.addEventListener('change', onMotionPreferenceChange)
	if (motionPreference.matches || props.duration <= 0) {
		finish()
		return
	}

	const totalWeight = strokes.reduce(
		(total, stroke) => total + stroke.duration + stroke.pauseBefore,
		0,
	)
	const holdDuration = 1000
	const fadeDuration = 1000
	const fadeStart = props.duration + holdDuration
	const fadeEnd = fadeStart + fadeDuration
	const cycleDuration = props.loop ? fadeEnd + 400 : props.duration
	let elapsed = 0
	animations = Array.from(
		svg.querySelectorAll<SVGGElement>('[data-writing-stroke]'),
	).flatMap((group, index) => {
		const stroke = strokes[index]!
		elapsed += (stroke.pauseBefore / totalWeight) * props.duration
		const start = elapsed
		const duration = (stroke.duration / totalWeight) * props.duration
		const end = start + duration
		elapsed = end
		return Array.from(group.querySelectorAll<SVGPathElement>('path')).map(
			(path) => {
				const penFrames = createPenFrames(
					path,
					path.hasAttribute('data-writing-body') ? stroke.width * 0.35 : 0,
					stroke.speedZones,
				)
				const hiddenFrame = { strokeDashoffset: '1', opacity: 0 }
				const frames: Keyframe[] = [
					{ ...hiddenFrame, offset: 0 },
					...penFrames.map((frame) => ({
						...frame,
						offset: Math.min(
							1,
							(start + frame.offset! * duration) / cycleDuration,
						),
					})),
				]
				if (props.loop) {
					// Keep overlapping mask strokes opaque; fade the rendered ink once.
					frames.push({ strokeDashoffset: '0', opacity: 1, offset: 1 })
				}
				const animation = path.animate(frames, {
					duration: cycleDuration,
					iterations: props.loop ? Infinity : 1,
					easing: 'linear',
					fill: 'both',
				})
				animation.pause()
				return animation
			},
		)
	})

	if (props.loop) {
		const ink = svg.querySelector<SVGPathElement>('[data-writing-ink]')
		if (ink) {
			const animation = ink.animate(
				[
					{ opacity: 1, offset: 0 },
					{
						opacity: 1,
						offset: fadeStart / cycleDuration,
						easing: 'ease-in-out',
					},
					{ opacity: 0, offset: fadeEnd / cycleDuration },
					{ opacity: 0, offset: 1 },
				],
				{ duration: cycleDuration, iterations: Infinity, fill: 'both' },
			)
			animation.pause()
			animations.push(animation)
		}
		const outline = svg.querySelector<SVGPathElement>('[data-writing-outline]')
		if (outline) {
			const animation = outline.animate(
				[
					{ opacity: 0.3, offset: 0 },
					{ opacity: 0.3, offset: props.duration / cycleDuration },
					{ opacity: 0, offset: (props.duration + 200) / cycleDuration },
					{
						opacity: 0,
						offset: (props.duration + holdDuration) / cycleDuration,
					},
					{
						opacity: 0.3,
						offset: fadeEnd / cycleDuration,
					},
					{ opacity: 0.3, offset: 1 },
				],
				{ duration: cycleDuration, iterations: Infinity, fill: 'both' },
			)
			animation.pause()
			animations.push(animation)
		}
	} else {
		void Promise.all(animations.map((animation) => animation.finished))
			.then(() => {
				if (!disposed) complete.value = true
			})
			.catch(() => {
				/* Cancellation on unmount or reduced motion is expected. */
			})
	}

	document.addEventListener('visibilitychange', updatePlayback)
	observer = new IntersectionObserver(
		(entries) => {
			inView = entries.some(
				(entry) => entry.isIntersecting && entry.intersectionRatio >= 0.75,
			)
			if (inView && !started) {
				started = true
				if (!props.loop) observer?.disconnect()
			}
			updatePlayback()
		},
		{ threshold: [0, 0.75] },
	)
	observer.observe(svg)
})

onBeforeUnmount(() => {
	disposed = true
	observer?.disconnect()
	document.removeEventListener('visibilitychange', updatePlayback)
	motionPreference?.removeEventListener('change', onMotionPreferenceChange)
	animations.forEach((animation) => animation.cancel())
})
</script>

<template>
	<svg
		ref="svgRef"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 1966 462"
		role="img"
		aria-label="AurLemon"
	>
		<defs>
			<clipPath
				v-for="(stroke, index) in strokes"
				:id="`${maskId}-stroke-${index}`"
				:key="index"
				clipPathUnits="userSpaceOnUse"
			>
				<rect :x="stroke.clipX" y="0" :width="stroke.clipWidth" height="462" />
			</clipPath>
			<mask
				:id="maskId"
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="1966"
				height="462"
			>
				<g
					fill="none"
					stroke="white"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<g
						v-for="(stroke, index) in strokes"
						:key="index"
						data-writing-stroke
						:clip-path="`url(#${maskId}-stroke-${index})`"
					>
						<path
							data-writing-body
							:d="stroke.d"
							:stroke-width="stroke.width"
							pathLength="1"
							stroke-dasharray="1"
							stroke-dashoffset="0"
						/>
						<path
							:d="stroke.d"
							:stroke-width="stroke.width * 0.65"
							stroke-linecap="round"
							stroke-linejoin="round"
							pathLength="1"
							stroke-dasharray="1"
							stroke-dashoffset="0"
						/>
					</g>
				</g>
			</mask>
		</defs>
		<path
			:d="wordmarkPath"
			data-writing-outline
			fill="none"
			stroke="currentColor"
			stroke-width="0.65"
			vector-effect="non-scaling-stroke"
			class="transition-opacity duration-200 motion-reduce:transition-none"
			:class="complete ? 'opacity-0' : 'opacity-30'"
		/>
		<path
			:d="wordmarkPath"
			data-writing-ink
			fill="currentColor"
			fill-rule="evenodd"
			:mask="complete ? undefined : `url(#${maskId})`"
		/>
	</svg>
</template>
