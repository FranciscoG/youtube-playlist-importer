import { load } from 'std/dotenv/mod.ts';
import { ImportPlaylist } from './yt.ts';
import { logger } from './logger.js';
import { args } from './cli.ts';
const env = await load();

let playlistName: string | null = args.name || args.n || null;
let fileName: string | null = args.file || args.f || null;
let apiKey: string | null = env['YoutubeApiKey'] || args.apiKey || args.k || null;
let clientId: string | null = env['YoutubeClientId'] || args.clientId || args.c || null;
const accessToken: string | null = env['AccessToken'] || args.token || args.t || null;
const playlistId: string | null = args.p || args.playlistId || null;

/***************************************************
 * Prompt user for any missing required arguments
 */
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
if (!fileName) {
  errString += `- file name (--file|-f)\n`;
}

if (!apiKey) {
  errString += `- api key (--apiKey|-k)\n`;
}

if (!clientId) {
  errString += `- client id (--clientId|-c)\n`;
}

if (!fileName || !apiKey || !clientId) {
  logger.error(errString);
  Deno.exit(1);
}

if (!playlistName) {
  // @ts-ignore we know fileName is not null because we checked it above and exited if it was
  playlistName = fileName.split('/').pop()?.split('.').shift().replace(/[_-]/g, ' ');
}

logger.log(`Importing ${fileName} into ${playlistName}`);

// process txt file into array of strings
let file: string;
try {
  file = await Deno.readTextFile(fileName);
} catch (e) {
  logger.error(`Error reading file ${fileName}: ${e.message}`);
  Deno.exit(1);
}

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
  playlistName!,
  videoList,
  apiKey,
  clientId,
  accessToken,
);

if (!playlistId) {
  await playlist.createPlaylist();
} else {
  playlist.playlistId = playlistId;
}

// songs will be inserted one at a time in succession. larger lists will take longer
await playlist.insertVideosIntoPlaylist();

logger.log('Done!');
logger.log(`Click on the following link to view your playlist:`);
logger.log(`https://www.youtube.com/playlist?list=${playlist.playlistId}`);
