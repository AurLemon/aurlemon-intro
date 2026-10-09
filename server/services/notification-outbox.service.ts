import { OutboxStatus, UserRole, UserStatus } from '~/generated/prisma/client'
import type { Prisma } from '~/generated/prisma/client'
import nodemailer from 'nodemailer'
import prisma from '~/lib/prisma'
import { DOMAIN_EVENT_NAMES } from '~/server/utils/domain-events'
import { renderEmailTemplate } from '~/server/utils/email-templates'

const DOMAIN_RETRY_DELAYS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000]
const EMAIL_RETRY_DELAYS = DOMAIN_RETRY_DELAYS
// One initial delivery attempt plus five delayed retries.
const MAX_ATTEMPTS = 6
const CLAIM_LEASE_MS = 5 * 60 * 1000

interface CommentCreatedPayload {
	commentId: string
	parentId: string | null
	authorUserId: string
}

interface FriendLinkSubmittedPayload {
	applicationId: string
	applicantUserId: string
}

interface FriendLinkApprovedPayload {
	applicationId: string
	approvedByUserId: string
}

const truncate = (value: string, length = 500): string =>
	value.length > length ? `${value.slice(0, length)}…` : value

const siteUrl = (): string =>
	(process.env.NUXT_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const localizedPath = (locale: string, path: string): string =>
	`${siteUrl()}${locale === 'zh-CN' ? '' : `/${locale}`}${path}`

const enqueueEmail = async (
	tx: Prisma.TransactionClient,
	payload: {
		recipientEmail: string
		templateKey: string
		locale: string
		variables: Record<string, string>
		dedupeKey: string
	},
) => {
	await tx.emailOutbox.upsert({
		where: { dedupeKey: payload.dedupeKey },
		create: {
			recipientEmail: payload.recipientEmail,
			templateKey: payload.templateKey,
			locale: payload.locale,
			variablesJson: JSON.stringify(payload.variables),
			dedupeKey: payload.dedupeKey,
		},
		update: {},
	})
}

const projectCommentCreated = async (
	tx: Prisma.TransactionClient,
	eventId: string,
	payload: CommentCreatedPayload,
) => {
	const comment = await tx.messageComment.findUnique({
		where: { id: payload.commentId },
		include: {
			author: true,
			parent: {
				include: {
					author: {
						include: {
							emails: true,
							notificationPreference: true,
						},
					},
				},
			},
		},
	})
	if (!comment) return
	const actorName = comment.author?.displayName ?? comment.githubLogin
	const recipients = new Set<string>()
	const replyUser = comment.parent?.author

	if (replyUser && replyUser.notificationPreference?.replyEmailEnabled) {
		const email = replyUser.emails.find(
			(item) => item.isPrimary && Boolean(item.verifiedAt),
		)
		if (email) {
			const url = localizedPath(
				replyUser.preferredLocale,
				`/?social=messages&comment=${encodeURIComponent(comment.id)}`,
			)
			recipients.add(replyUser.id)
			await enqueueEmail(tx, {
				recipientEmail: email.email,
				templateKey: 'comment.reply',
				locale: replyUser.preferredLocale,
				variables: {
					displayName: replyUser.displayName,
					actorName,
					content: truncate(comment.content),
					url,
				},
				dedupeKey: `${eventId}:reply:${replyUser.id}`,
			})
		}
	}

	const admins = await tx.user.findMany({
		where: {
			role: UserRole.ADMIN,
			status: UserStatus.ACTIVE,
			notificationPreference: { adminCommentEmailEnabled: true },
		},
		include: { emails: true },
	})
	for (const admin of admins) {
		if (recipients.has(admin.id)) continue
		const email = admin.emails.find(
			(item) => item.isPrimary && Boolean(item.verifiedAt),
		)
		if (!email) continue
		const url = localizedPath(
			admin.preferredLocale,
			`/?social=messages&comment=${encodeURIComponent(comment.id)}`,
		)
		await enqueueEmail(tx, {
			recipientEmail: email.email,
			templateKey: 'admin.comment',
			locale: admin.preferredLocale,
			variables: {
				displayName: admin.displayName,
				actorName,
				content: truncate(comment.content),
				url,
			},
			dedupeKey: `${eventId}:admin-comment:${admin.id}`,
		})
	}
}

const projectFriendLinkSubmitted = async (
	tx: Prisma.TransactionClient,
	eventId: string,
	payload: FriendLinkSubmittedPayload,
) => {
	const application = await tx.friendLinkApplication.findUnique({
		where: { id: payload.applicationId },
		include: { applicant: true },
	})
	if (!application) return
	const admins = await tx.user.findMany({
		where: {
			role: UserRole.ADMIN,
			status: UserStatus.ACTIVE,
			notificationPreference: { adminFriendLinkEmailEnabled: true },
		},
		include: { emails: true },
	})
	for (const admin of admins) {
		const email = admin.emails.find(
			(item) => item.isPrimary && Boolean(item.verifiedAt),
		)
		if (!email) continue
		await enqueueEmail(tx, {
			recipientEmail: email.email,
			templateKey: 'admin.friend-link',
			locale: admin.preferredLocale,
			variables: {
				displayName: admin.displayName,
				actorName:
					application.applicant?.displayName ??
					application.applicantGithubLogin,
				siteName: application.name,
				url: localizedPath(
					admin.preferredLocale,
					`/friends?social=friend-links&application=${encodeURIComponent(application.id)}`,
				),
			},
			dedupeKey: `${eventId}:admin-friend-link:${admin.id}`,
		})
	}
}

const projectFriendLinkApproved = async (
	tx: Prisma.TransactionClient,
	eventId: string,
	payload: FriendLinkApprovedPayload,
) => {
	const application = await tx.friendLinkApplication.findUnique({
		where: { id: payload.applicationId },
		include: {
			applicant: { include: { emails: true } },
			approvedBy: true,
		},
	})
	const applicant = application?.applicant
	if (!application || !applicant) return

	const email = applicant.emails.find(
		(item) => item.isPrimary && Boolean(item.verifiedAt),
	)
	if (!email) return

	await enqueueEmail(tx, {
		recipientEmail: email.email,
		templateKey: 'friend-link.approved',
		locale: applicant.preferredLocale,
		variables: {
			displayName: applicant.displayName,
			actorName:
				application.approvedBy?.displayName ??
				application.approvedByGithubLogin ??
				'',
			siteName: application.name,
			url: localizedPath(applicant.preferredLocale, '/friends'),
		},
		dedupeKey: `${eventId}:friend-link-approved:${applicant.id}`,
	})
}

export const processDomainEvents = async (): Promise<void> => {
	const events = await prisma.domainEventOutbox.findMany({
		where: {
			status: OutboxStatus.PENDING,
			nextAttemptAt: { lte: new Date() },
		},
		orderBy: { createdAt: 'asc' },
		take: 20,
	})

	for (const event of events) {
		const claimed = await prisma.domainEventOutbox.updateMany({
			where: { id: event.id, status: OutboxStatus.PENDING },
			data: {
				status: OutboxStatus.PROCESSING,
				nextAttemptAt: new Date(Date.now() + CLAIM_LEASE_MS),
			},
		})
		if (claimed.count !== 1) continue

		try {
			await prisma.$transaction(async (tx) => {
				const payload = JSON.parse(event.payloadJson) as unknown
				if (event.eventType === DOMAIN_EVENT_NAMES.COMMENT_CREATED) {
					await projectCommentCreated(
						tx,
						event.id,
						payload as CommentCreatedPayload,
					)
				} else if (
					event.eventType ===
					DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_SUBMITTED
				) {
					await projectFriendLinkSubmitted(
						tx,
						event.id,
						payload as FriendLinkSubmittedPayload,
					)
				} else if (
					event.eventType ===
					DOMAIN_EVENT_NAMES.FRIEND_LINK_APPLICATION_APPROVED
				) {
					await projectFriendLinkApproved(
						tx,
						event.id,
						payload as FriendLinkApprovedPayload,
					)
				}
				await tx.domainEventOutbox.update({
					where: { id: event.id },
					data: {
						status: OutboxStatus.PROCESSED,
						processedAt: new Date(),
						lastError: null,
					},
				})
			})
		} catch (error) {
			const attempts = event.attempts + 1
			await prisma.domainEventOutbox.update({
				where: { id: event.id },
				data: {
					attempts,
					status:
						attempts >= MAX_ATTEMPTS
							? OutboxStatus.FAILED
							: OutboxStatus.PENDING,
					nextAttemptAt: new Date(
						Date.now() + (DOMAIN_RETRY_DELAYS[attempts - 1] ?? 43_200_000),
					),
					lastError: truncate(
						error instanceof Error ? error.message : String(error),
						1000,
					),
				},
			})
		}
	}
}

let transporter: nodemailer.Transporter | null = null
let missingSmtpLogged = false

const getTransporter = (): nodemailer.Transporter | null => {
	if (transporter) return transporter
	const host = process.env.SMTP_HOST
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	const from = process.env.MAIL_FROM_ADDRESS
	if (!host || !user || !pass || !from) {
		if (!missingSmtpLogged) {
			console.warn('SMTP_NOT_CONFIGURED: email delivery worker is disabled')
			missingSmtpLogged = true
		}
		return null
	}
	transporter = nodemailer.createTransport({
		host,
		port: Number(process.env.SMTP_PORT ?? 465),
		secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
		pool: true,
		auth: { user, pass },
	})
	return transporter
}

export const processEmailOutbox = async (): Promise<void> => {
	const mailer = getTransporter()
	if (!mailer) return
	const messages = await prisma.emailOutbox.findMany({
		where: {
			status: OutboxStatus.PENDING,
			nextAttemptAt: { lte: new Date() },
		},
		orderBy: { createdAt: 'asc' },
		take: 10,
	})
	for (const message of messages) {
		const claimed = await prisma.emailOutbox.updateMany({
			where: { id: message.id, status: OutboxStatus.PENDING },
			data: {
				status: OutboxStatus.PROCESSING,
				nextAttemptAt: new Date(Date.now() + CLAIM_LEASE_MS),
			},
		})
		if (claimed.count !== 1) continue
		try {
			const variables = JSON.parse(message.variablesJson) as Record<
				string,
				string
			>
			const rendered = renderEmailTemplate(
				message.templateKey,
				message.locale,
				variables,
			)
			await mailer.sendMail({
				from: {
					name: process.env.MAIL_FROM_NAME ?? 'AurLemon Intro',
					address: process.env.MAIL_FROM_ADDRESS!,
				},
				to: message.recipientEmail,
				replyTo: process.env.MAIL_REPLY_TO || undefined,
				subject: rendered.subject,
				text: rendered.text,
				html: rendered.html,
			})
			await prisma.emailOutbox.update({
				where: { id: message.id },
				data: {
					status: OutboxStatus.PROCESSED,
					sentAt: new Date(),
					lastError: null,
				},
			})
		} catch (error) {
			const attempts = message.attempts + 1
			await prisma.emailOutbox.update({
				where: { id: message.id },
				data: {
					attempts,
					status:
						attempts >= MAX_ATTEMPTS
							? OutboxStatus.FAILED
							: OutboxStatus.PENDING,
					nextAttemptAt: new Date(
						Date.now() + (EMAIL_RETRY_DELAYS[attempts - 1] ?? 43_200_000),
					),
					lastError: truncate(
						error instanceof Error ? error.message : String(error),
						1000,
					),
				},
			})
		}
	}
}

export const resetInterruptedOutboxWork = async (): Promise<void> => {
	await Promise.all([
		prisma.domainEventOutbox.updateMany({
			where: {
				status: OutboxStatus.PROCESSING,
				nextAttemptAt: { lte: new Date() },
			},
			data: { status: OutboxStatus.PENDING },
		}),
		prisma.emailOutbox.updateMany({
			where: {
				status: OutboxStatus.PROCESSING,
				nextAttemptAt: { lte: new Date() },
			},
			data: { status: OutboxStatus.PENDING },
		}),
	])
}

export const closeEmailTransport = async (): Promise<void> => {
	if (transporter) transporter.close()
	transporter = null
}
