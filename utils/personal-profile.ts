import {
	personalProfileConfig,
	type PersonalProfileConfig,
} from '../personal-profile.config'

export interface StudyYear {
	level: keyof PersonalProfileConfig['education']
	year: number
}

export interface PersonalProfileSnapshot {
	age: number
	studyYear: StudyYear | null
}

export const getPersonalProfileSnapshot = (
	timestamp: number,
	profile: PersonalProfileConfig = personalProfileConfig,
): PersonalProfileSnapshot => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: profile.timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(timestamp)
	const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
		parts.find((part) => part.type === type)!.value
	const year = Number(getPart('year'))
	const monthDay = `${getPart('month')}-${getPart('day')}`
	const age =
		year -
		Number(profile.birthday.slice(0, 4)) -
		Number(monthDay < profile.birthday.slice(5))
	const academicYear = year - Number(monthDay < '09-01')
	let studyYear: StudyYear | null = null

	// 两种身份都在学制内时，本科优先；本科结束后才显示研究生。
	for (const level of ['undergraduate', 'master'] as const) {
		const {
			enrollmentYear,
			durationYears,
			firstYear = 1,
		} = profile.education[level]
		if (
			enrollmentYear === null ||
			!Number.isInteger(enrollmentYear) ||
			!Number.isInteger(durationYears) ||
			durationYears <= 0 ||
			!Number.isInteger(firstYear) ||
			firstYear <= 0
		)
			continue

		const elapsedYears = academicYear - enrollmentYear
		if (elapsedYears >= 0 && elapsedYears < durationYears) {
			studyYear = { level, year: firstYear + elapsedYears }
			break
		}
	}

	return { age, studyYear }
}
