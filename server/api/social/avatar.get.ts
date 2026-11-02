import { servePublicImage } from '~/server/utils/public-image-proxy'
export default defineEventHandler((event) => servePublicImage(event, 'avatar'))
