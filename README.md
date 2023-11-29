# Youtube Playlist Importer

This code uses the [youtube-deno](https://github.com/akshgpt7/youtube-deno) library.

Please read and follow the instructions in the following 2 sections of their documentation:

- ["Configuring your App"](https://github.com/akshgpt7/youtube-deno#configuring-your-app)

- ["Objects that require user interactions (user consent by OAuth 2.0 authorization"](https://github.com/akshgpt7/youtube-deno#objects-that-require-user-interactions-user-consent-by-oauth-20-authorization)

## IMPORTANT NOTE

The text file with the youtube urls must be in the same folder as the `yt-import-playlist` executable

The simplest way to run this is:

```
yt-playlist-import
```

From there it will prompt you for any required information.

You can also provide everything via cli flags, run this for more information:

```
yt-playlist-import --help
```

## Environment File

You can also provide some of the required items in an `.env` file

```
YoutubeClientId=your_client_id
YoutubeApiKey=your_api_key
AccessToken=your_access_token
```

## Development

Requires [deno](https://docs.deno.com/runtime/manual/getting_started/installation)

```
deno task run -n example_imported2 -f example.txt
```
