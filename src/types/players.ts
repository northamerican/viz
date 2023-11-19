import { Request } from "express"
import type { Track } from './viz'

export type GetToken = (req: Request, refresh?: boolean) => Promise<{ access_token: string, refresh_token: string }>
export type GetQueue = () => Promise<Partial<Track>[]>
export type GetCurrentlyPlaying = () => Promise<Track>
