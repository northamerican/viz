
declare module "VizPlayer" {
  import { Track } from 'Viz'
  import { Request } from 'express'
  export type GetToken = (req: Request, refresh?: boolean) => Promise<{ access_token: string, refresh_token: string }>
  export type GetQueue = () => Promise<Partial<Track>[]>
  export type GetCurrentlyPlaying = () => Promise<Track>
}