import { parseArgs } from 'std/cli/parse_args.ts';

interface Args {
  h?: boolean;
  help?: boolean;
  name?: string;
  n?: string;
  file?: string;
  f?: string;
  apiKey?: string;
  k?: string;
  clientId?: string;
  c?: string;
  t?: string;
  token?: string;
  p?: string;
  playlistId?: string;
}
export const args: Args = parseArgs(Deno.args);

if (args.h || args.help) {
  console.log(`
Youtube Playlist Importer
-------------------------
If you omit any of the REQUIRED flags you will be prompted to enter them manually

usage: 
yt-playlist-import [-n PlaylistName] [-f MyFileName.txt] [-k apiKey] [-c clientId] [-t access_token]

flags:
  -f, --file       : REQUIRED name of file to import. Must be a UTF-8 encoded text file with urls separated by newlines or commas or spaces
                     File must be in the same directory as this script (or in a subdirectory). This script only has permission to access files in the same directory as it.

  -k, --apiKey     : REQUIRED YouTube API key

  -c, --clientId   : REQUIRED YouTube OAuth2 client id

  -t, --token      : REQUIRED YouTube OAuth2 access token, if missing you will need to click on the OAuth link and grab the access token from the url after you authenticate

  -n, --name       : optionally set the name of the playlist, if missing it will use the name of the file (replacing hyphens or underscores with spaces)

  -p, --playlistId : optionally set the playlist id, if missing it will create a new playlist
  
  -h, --help       : show this help message

You can optionally set client id, api key, and access token in an .env file:

YoutubeClientId=your_client_id
YoutubeApiKey=your_api_key
AccessToken=your_access_token

`);
  Deno.exit(0);
}