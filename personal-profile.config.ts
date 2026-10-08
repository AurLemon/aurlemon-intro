export interface StudyConfig {
	/** 入学年份；null 表示不启用。每年 9 月 1 日入学、升年级。 */
	enrollmentYear: number | null
	/** 从入学开始计算的学制年数；结束后自动隐藏。 */
	durationYears: number
	/** 入学时的年级，默认 1；专升本可填 3。 */
	firstYear?: number
}

export interface PersonalProfileConfig {
	birthday: string
	timeZone: string
	education: {
		undergraduate: StudyConfig
		master: StudyConfig
	}
}

/** DIY 个人资料：这里只填事实和参数，显示文案统一由 i18n 处理。 */
export const personalProfileConfig: PersonalProfileConfig = {
	birthday: '2006-05-18',
	timeZone: 'Asia/Shanghai',
	education: {
		// 2026 年专升本入学，两年制，从大三开始。
		undergraduate: {
			enrollmentYear: 2026,
			durationYears: 2,
			firstYear: 3,
		},
		// 录取后填写实际入学年份，例如 2028；未确定时保持 null。
		master: {
			enrollmentYear: null,
			durationYears: 3,
		},
	},
}
