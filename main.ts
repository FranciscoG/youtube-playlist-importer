import { parseArgs } from 'std/cli/parse_args.ts';
import { load } from 'std/dotenv/mod.ts';
import { ImportPlaylist } from './yt.ts';
import { logger } from './logger.js';

const env = await load();

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
}
const args: Args = parseArgs(Deno.args);

if (args.h || args.help) {
	console.log(`
Youtube Playlist Importer
-------------------------
If you omit any of the REQUIRED flags you will be prompted to enter them manually

usage: yt-playlist-import [-n PlaylistName] [-f MyFileName.txt] [-k apiKey] [-c clientId] [-t access_token]
  -n, --name     : REQUIRED name of playlist to create
  -f, --file     : REQUIRED name of file to import, must be a UTF-8 encoded text file with urls separated by newlines or commas or spaces
  -k, --apiKey   : REQUIRED YouTube API key
  -c, --clientId : REQUIRED YouTube OAuth2 client id
  -t, --token    : YouTube OAuth2 access token, if missing you will need to click on the OAuth link and grab the access token from the url after you authenticate

You can optionally set client id, api key, and access token in an .env file:
  YoutubeClientId=your_client_id
  YoutubeApiKey=your_api_key
  AccessToken=your_access_token

  -h, --help     : show this help message
`);
	Deno.exit(0);
}

let playlistName: string | null = args.name || args.n || null;
let fileName: string | null = args.file || args.f || null;
let apiKey: string | null = env['YoutubeApiKey'] || args.apiKey || args.k ||
	null;
let clientId: string | null = env['YoutubeClientId'] || args.clientId ||
	args.c || null;
const accessToken: string | null = env['AccessToken'] || args.token || args.t ||
	null;

/***************************************************
 * Prompt user for any missing required arguments
 */
if (!playlistName) {
	playlistName = prompt('Enter playlist name: ');
}

if (!fileName) {
	fileName = prompt('Enter file name: ');
}

if (!apiKey) {
	apiKey = prompt('Enter YouTube API key: ');
}

if (!clientId) {
	clientId = prompt('Enter YouTube OAuth2 client id: ');
}

/***************************************************
 * Error handling is any required arguments are missing
 */

let errString = `Missing required argument(s): \n`;
if (!playlistName) {
	errString += `- playlist name (--name|-n)\n`;
}

if (!fileName) {
	errString += `- file name (--file|-f)\n`;
}

if (!apiKey) {
	errString += `- api key (--apiKey|-k)\n`;
}

if (!clientId) {
	errString += `- client id (--clientId|-c)\n`;
}

if (!playlistName || !fileName || !apiKey || !clientId) {
	logger.error(errString);
	Deno.exit(1);
}

logger.log(`Importing ${fileName} into ${playlistName}`);

// process txt file into array of strings
const file = await Deno.readTextFile(fileName);
const videoList = file
	.trim()
	.split(/[\n,\s]/)
	.map((line) => line.trim())
	.filter((line) => line !== '' && ImportPlaylist.isGoodYoutubeUrl(line));

if (videoList.length === 0) {
	logger.error(`No videos urls found in ${fileName}`);
	Deno.exit(1);
}

const playlist = new ImportPlaylist(
	playlistName,
	videoList,
	apiKey,
	clientId,
	accessToken,
);

await playlist.createPlaylist();

// songs will be inserted one at a time in succession. larger lists will take longer
await playlist.insertVideosIntoPlaylist();

logger.log('Done!');
logger.log(`Click on the following link to view your playlist:`);
logger.log(`https://www.youtube.com/playlist?list=${playlist.playlistId}`);
