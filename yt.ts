import {
	authenticator,
	authParams,
	YouTube,
} from 'https://deno.land/x/youtube@v0.3.0/mod.ts';
import { logger } from './logger.js';

/**
 * https://developers.google.com/youtube/v3/docs/playlists#resource
 * This object is used for both the Request and the Response from creating a playlist
 * Only including what I need, full list in the link above
 */
interface PlaylistResouce {
	kind: 'youtube#playlist';
	id?: string;
	snippet?: {
		title: string;
		description: string;
	};
	status?: {
		privacyStatus: 'private' | 'public' | 'unlisted';
	};
	error?: {
		code: number;
		message: string;
		status: string;
	};
}

/**
 * https://developers.google.com/youtube/v3/docs/playlistItems#resource
 */
interface PlaylistItemResource {
	kind: 'youtube#playlistItem';
	snippet: {
		playlistId: string;
		resourceId: {
			kind: string;
			videoId: string;
		};
	};
}

interface PlaylistParams {
	part: string; // comma separated list of parts to include in the response
	// https://developers.google.com/youtube/v3/docs/playlists/list#parameters
	// "contentDetails,id,localizations,player,snippet,status"
}

interface PlaylistItemParams {
	part: string; // comma separated list of parts to include in the response
	// https://developers.google.com/youtube/v3/docs/playlists/list#parameters
	// "contentDetails,id,snippet,status"
}

export class ImportPlaylist {
	i = 0;
	playlistId = '';
	yt: YouTube;
	playlistName: string;
	list: string[];
	total: number;
	errors = 0;
	errorThreshold = 5;
	videosSkipped: string[] = [];
	clientId: string;

	constructor(
		playlistName: string,
		list: string[],
		apiKey: string,
		clientId: string,
		accesstoken?: string | null,
	) {
		this.clientId = clientId;
		if (!accesstoken) {
			logger.log(
				'You are missing the access token, you will need to authenticate with Google',
			);
			this.beginOAuthFlow();
			Deno.exit(0);
		}
		this.list = list;
		this.playlistName = playlistName;
		this.yt = new YouTube(apiKey, accesstoken);
		this.total = list.length;
	}

	beginOAuthFlow() {
		const auth = new authenticator();
		const creds: authParams = {
			client_id: this.clientId,
			redirect_uri: 'https://localhost:8080',
			scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
		};
		const auth_url: string = auth.authenticate(creds);
		logger.log(
			'Please click on the following url:',
		);
		logger.log(auth_url);
		logger.log('');
		logger.log(
			'After you\'ve authenticated, copy the access token from the url and run this command again with the -t flag (or AccessToken in your .env file)',
		);
	}

	getVideoIdFromUrl(url: string): string | undefined {
		// https://www.youtube.com/watch?v=j6IFiUbQLl4 -> j6IFiUbQLl4
		return url.split('/watch?v=').at(-1);
	}

	/**
	 * YouTube API Reference:
	 * https://developers.google.com/youtube/v3/docs/playlists/insert
	 */
	async createPlaylist() {
		try {
			logger.log(`Creating playlist: ${this.playlistName}...`);
			logger.log(
				`If you already have a playlist with the same name it will just create a new one with a duplicate name`,
			);

			const param1: PlaylistParams = { part: 'id,snippet,status' };
			const playlistResource: PlaylistResouce = {
				kind: 'youtube#playlist',
				snippet: {
					title: this.playlistName,
					description: 'imported using youtube-import-playlist',
				},
				status: {
					privacyStatus: 'public',
				},
			};

			playlistResource.toString = function () {
				return JSON.stringify(this);
			};

			const insertResult: PlaylistResouce = await this.yt.playlists_insert(
				param1,
				playlistResource,
			);

			if (insertResult.error && insertResult.error.code === 401) {
				this.handle401(); // this will exit the program
			}

			if (insertResult.id) {
				this.playlistId = insertResult.id;
				logger.log(
					`Successfully created playlist ${this.playlistName} with id ${this.playlistId}`,
				);
			} else {
				logger.error(
					'Error creating playlist, see error for full details',
				);
				logger.error(insertResult);
				Deno.exit(1);
			}
		} catch (error) {
			logger.error('Error creating playlist, see error for full details');
			logger.error(error);
			Deno.exit(1);
		}
	}

	handle401() {
		logger.error(
			'Access token incorrect or expired, please re-authenticate with Google',
		);
		this.beginOAuthFlow();
		Deno.exit(0);
	}

	/**
	 * YouTube API Reference:
	 * https://developers.google.com/youtube/v3/docs/playlistItems/insert
	 */
	async insertVideosIntoPlaylist() {
		if (!this.playlistId) {
			logger.error('PlaylistId not set');
			Deno.exit(1);
		}

		if (this.i < this.total) {
			const fullVideoUrl = this.list[this.i];
			const videoId = this.getVideoIdFromUrl(fullVideoUrl);
			if (!videoId) {
				logger.warn(
					`Could not get videoId from ${fullVideoUrl}, skipping...`,
				);
				this.videosSkipped.push(fullVideoUrl);
				this.i += 1;
				await this.insertVideosIntoPlaylist();
				return;
			}

			try {
				logger.log(
					`Adding video ${this.i + 1} of ${this.total}: ${fullVideoUrl}`,
				);

				const param1: PlaylistItemParams = { part: 'id,snippet' };
				const resource: PlaylistItemResource = {
					kind: 'youtube#playlistItem',
					snippet: {
						playlistId: this.playlistId,
						resourceId: {
							kind: 'youtube#video',
							videoId,
						},
					},
				};

				resource.toString = function () {
					return JSON.stringify(this);
				};

				const result = await this.yt.playlistItems_insert(param1, resource);
				if (result.error && result.error.code === 401) {
					this.handle401(); // this will exit the program
				}
			} catch (error) {
				logger.error(
					`Error adding ${fullVideoUrl} to playlist: ${error.message}`,
				);
				logger.log('Continuing to the next video');
				this.videosSkipped.push(fullVideoUrl);
				this.errors += 1;
				if (this.errors >= this.errorThreshold) {
					logger.error(`Too many errors, exiting...`);
					Deno.exit(1);
				}
			} finally {
				this.i += 1;
				await this.insertVideosIntoPlaylist();
			}
		} else {
			logger.log('');
			logger.log(`Finished adding videos to playlist`);
			if (this.videosSkipped.length > 0) {
				logger.warn(
					`The following ${this.videosSkipped.length} videos were skipped:`,
				);
				for (const video of this.videosSkipped) {
					logger.warn(` - ${video}`);
				}
			}
		}
	}

	static isGoodYoutubeUrl(url: string): boolean {
		const regex = /https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/;
		return regex.test(url);
	}
}
