import { Request } from "express"

declare module 'VizPlayer' {
  export type RequestConfig = ({ accessToken }: { accessToken: string }) => object
  export type GetToken = (req: Request) => object
  export type GetQueue = (accessToken: string) => Promise<Partial<Track>[]>
  export type GetCurrentlyPlaying = (accessToken: string) => Promise<Track>
}