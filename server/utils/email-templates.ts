export type EmailTemplateKey =
	| 'email.verify'
	| 'comment.reply'
	| 'admin.comment'
	| 'admin.friend-link'
	| 'friend-link.approved'

interface RenderedEmail {
	subject: string
	text: string
	html: string
}

type LocaleCode = 'zh-CN' | 'en-US' | 'ja-JP'

const normalizeLocale = (value: string): LocaleCode => {
	if (value === 'en-US' || value === 'ja-JP') return value
	return 'zh-CN'
}

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')

const page = (
	locale: LocaleCode,
	title: string,
	body: string,
	action: string,
	url: string,
) =>
	`
<!doctype html>
<html lang="${locale}">
	<body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif">
		<div style="max-width:600px;margin:0 auto;padding:32px 20px">
			<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
				<h1 style="margin:0 0 18px;font-size:22px">${escapeHtml(title)}</h1>
				${body}
				<p style="margin:24px 0 0"><a href="${escapeHtml(url)}" style="display:inline-block;border-radius:999px;background:#0f172a;color:#fff;padding:10px 18px;text-decoration:none">${escapeHtml(action)}</a></p>
			</div>
			<p style="margin:16px 0 0;color:#64748b;font-size:12px">AurLemon Intro / aurlemon.top</p>
		</div>
	</body>
</html>`.trim()

const value = (variables: Record<string, string>, key: string): string =>
	variables[key] ?? ''

export const renderEmailTemplate = (
	templateKey: string,
	localeValue: string,
	variables: Record<string, string>,
): RenderedEmail => {
	const locale = normalizeLocale(localeValue)
	const displayName = value(variables, 'displayName')
	const actorName = value(variables, 'actorName')
	const content = value(variables, 'content')
	const url = value(variables, 'url') || value(variables, 'verifyUrl')

	if (templateKey === 'email.verify') {
		const copy = {
			'zh-CN': {
				subject: '验证你的 AurLemon Intro 邮箱',
				title: '验证邮箱',
				body: `${displayName}，请在 30 分钟内完成邮箱验证。`,
				action: '验证邮箱',
			},
			'en-US': {
				subject: 'Verify your AurLemon Intro email',
				title: 'Verify your email',
				body: `${displayName}, please verify this email address within 30 minutes.`,
				action: 'Verify email',
			},
			'ja-JP': {
				subject: 'AurLemon Intro のメールアドレスを確認',
				title: 'メールアドレスの確認',
				body: `${displayName}さん、30分以内にメールアドレスを確認してください。`,
				action: 'メールを確認',
			},
		}[locale]
		return {
			subject: copy.subject,
			text: `${copy.body}\n\n${url}`,
			html: page(
				locale,
				copy.title,
				`<p>${escapeHtml(copy.body)}</p>`,
				copy.action,
				url,
			),
		}
	}

	if (templateKey === 'comment.reply') {
		const copy = {
			'zh-CN': {
				subject: `${actorName} 回复了你的留言`,
				title: '你收到了新回复',
				intro: `${actorName} 回复了你：`,
				action: '查看回复',
			},
			'en-US': {
				subject: `${actorName} replied to your comment`,
				title: 'You received a new reply',
				intro: `${actorName} replied:`,
				action: 'View reply',
			},
			'ja-JP': {
				subject: `${actorName}さんがコメントに返信しました`,
				title: '新しい返信があります',
				intro: `${actorName}さんからの返信：`,
				action: '返信を見る',
			},
		}[locale]
		const body = `<p>${escapeHtml(copy.intro)}</p><blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #94a3b8;background:#f8fafc;white-space:pre-wrap">${escapeHtml(content)}</blockquote>`
		return {
			subject: copy.subject,
			text: `${copy.intro}\n\n${content}\n\n${url}`,
			html: page(locale, copy.title, body, copy.action, url),
		}
	}

	if (templateKey === 'admin.friend-link') {
		const siteName = value(variables, 'siteName')
		const copy = {
			'zh-CN': {
				subject: `收到新的友链申请：${siteName}`,
				title: '新的友链申请',
				body: `${actorName} 提交了 ${siteName} 的友链申请。`,
				action: '前往处理',
			},
			'en-US': {
				subject: `New friend-link application: ${siteName}`,
				title: 'New friend-link application',
				body: `${actorName} submitted an application for ${siteName}.`,
				action: 'Review application',
			},
			'ja-JP': {
				subject: `新しい相互リンク申請：${siteName}`,
				title: '新しい相互リンク申請',
				body: `${actorName}さんが ${siteName} の申請を送信しました。`,
				action: '申請を確認',
			},
		}[locale]
		return {
			subject: copy.subject,
			text: `${copy.body}\n\n${url}`,
			html: page(
				locale,
				copy.title,
				`<p>${escapeHtml(copy.body)}</p>`,
				copy.action,
				url,
			),
		}
	}

	if (templateKey === 'friend-link.approved') {
		const siteName = value(variables, 'siteName')
		const copy = {
			'zh-CN': {
				subject: `你的友链申请已通过：${siteName}`,
				title: '友链申请已通过',
				body: `${actorName} 已通过 ${siteName} 的友链申请。`,
				action: '查看友情链接',
			},
			'en-US': {
				subject: `Your friend-link application was approved: ${siteName}`,
				title: 'Friend-link application approved',
				body: `${actorName} approved your application for ${siteName}.`,
				action: 'View friend links',
			},
			'ja-JP': {
				subject: `相互リンク申請が承認されました：${siteName}`,
				title: '相互リンク申請が承認されました',
				body: `${actorName}さんが ${siteName} の申請を承認しました。`,
				action: 'リンク集を見る',
			},
		}[locale]
		return {
			subject: copy.subject,
			text: `${copy.body}\n\n${url}`,
			html: page(
				locale,
				copy.title,
				`<p>${escapeHtml(copy.body)}</p>`,
				copy.action,
				url,
			),
		}
	}

	if (templateKey !== 'admin.comment') {
		throw new Error(`EMAIL_TEMPLATE_UNKNOWN: ${templateKey}`)
	}

	const copy = {
		'zh-CN': {
			subject: `${actorName} 发表了新留言`,
			title: '站点有新留言',
			intro: `${actorName} 发表了：`,
			action: '查看留言',
		},
		'en-US': {
			subject: `${actorName} posted a new comment`,
			title: 'New site comment',
			intro: `${actorName} posted:`,
			action: 'View comment',
		},
		'ja-JP': {
			subject: `${actorName}さんが新しいコメントを投稿しました`,
			title: 'サイトに新しいコメントがあります',
			intro: `${actorName}さんの投稿：`,
			action: 'コメントを見る',
		},
	}[locale]
	const body = `<p>${escapeHtml(copy.intro)}</p><blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #94a3b8;background:#f8fafc;white-space:pre-wrap">${escapeHtml(content)}</blockquote>`
	return {
		subject: copy.subject,
		text: `${copy.intro}\n\n${content}\n\n${url}`,
		html: page(locale, copy.title, body, copy.action, url),
	}
}
