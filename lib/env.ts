export function getEnvVariable(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const env = {
  ODDS_API_KEY: process.env.NEXT_PUBLIC_ODDS_API_KEY as string,
} 