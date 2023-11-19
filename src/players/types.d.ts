import { Request } from "express"

export type AuthState = {
  token: string
  refreshToken: string
}

export type GetToken = (req: Request) => Promise<{ access_token: string, refresh_token: string }>
export type GetQueue = (req: Request) => Promise<Partial<Track>[]>
export type GetCurrentlyPlaying = (req: Request) => Promise<Track>
