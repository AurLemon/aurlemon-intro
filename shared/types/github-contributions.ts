export interface GithubContributionDay {
	date: string
	weekday: number
	contributionCount: number
	contributionLevel:
		| 'NONE'
		| 'FIRST_QUARTILE'
		| 'SECOND_QUARTILE'
		| 'THIRD_QUARTILE'
		| 'FOURTH_QUARTILE'
}

export interface GithubContributionWeek {
	firstDay: string
	contributionDays: GithubContributionDay[]
}

export interface GithubContributionCalendar {
	username: string
	totalContributions: number
	colors: string[]
	weeks: GithubContributionWeek[]
	from: string
	to: string
	isPlaceholder?: boolean
}
