import { Request } from "express"
import type { Track } from '../types/viz'

export type GetToken = (req: Request, refresh?: boolean) => Promise<{ access_token: string, refresh_token: string }>
export type GetQueue = (req: Request) => Promise<Partial<Track>[]>
export type GetCurrentlyPlaying = (req: Request) => Promise<Track>
