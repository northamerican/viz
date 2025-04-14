<img alt="viz" width="300" src="https://i.imgur.com/EGZl7PI.png"> 

# viz - music video box
Live music video streams for spotify and youtube playlists.

## Build
- Run `yarn`

## Usage
- Run `yarn server`
- Navigate to url
- Stream via AirPlay using Safari

## Development
- Run `yarn server --local`

## Production
- See https://github.com/northamerican/viz/issues/46

## Demo
- In active development. Coming soon 8)

## Config
Configure auth access for 3rd party services at:
- console.cloud.google.com -> youtube data api v3
- developer.spotify.com/dashboard
- Copy `.env.example` to `.env` with api keys
- Sign into youtube.com, with an account that will not be used regularly in case of ban.

## Tech stack
- [node](https://nodejs.org/en)
- [express](https://expressjs.com/)
- [typescript](https://www.typescriptlang.org/)
- [vite](https://vitejs.dev/)
- [vue](https://vuejs.org/)
- [tsx](https://github.com/privatenumber/tsx)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://github.com/eugeneware/ffmpeg-static)
- [lowdb](https://github.com/typicode/lowdb)
- [telefunc](https://github.com/brillout/telefunc)
