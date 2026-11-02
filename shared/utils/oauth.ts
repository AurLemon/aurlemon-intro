// Token and profile stages can each take 61.4 seconds when using direct retries.
// Leave time for account persistence and response recovery as well.
export const OAUTH_PROCESS_TIMEOUT_MS = 180_000

export type OAuthFlowProvider = 'github' | 'linuxdo'
