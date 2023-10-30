import * as cheerio from 'cheerio';
import { redis } from '$lib/server/redis';
import {
	formatDetails,
	anilistUrl,
	detailsQuery,
	watchListQuery
} from '$lib/providers/anilist/utils';
import { apiUrl, proxyUrl } from '$lib/utils';
export async function load({ params, fetch, locals, url }) {
	const fetchAnilistDetails = async () => {
		try {
			const cached = await redis.get(`anilist-details-${params.id}`);
			if (cached) {
				return JSON.parse(cached);
			}

			const anilistResp = await fetch(proxyUrl + anilistUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify({
					query: detailsQuery,
					variables: { id: params.id }
				})
			});

			const anilist = await anilistResp.json();
			const formattedAnilist = formatDetails(anilist.data.Media);

			redis.set(`anilist-details-${params.id}`, JSON.stringify(formattedAnilist), 'EX', 600);
			return formattedAnilist;
		} catch (error) {
			throw new Error(error);
		}
	};

	const fetchEpisodes = async () => {
		const idMal = url.searchParams.get('idMal');
		const page  = url.searchParams.get('page');
		const episodesResp = await fetch(`${apiUrl}/episodes/${idMal}?page=${page}`);
		const episodes = await episodesResp.json();
		return episodes;
	};

	const fetchAnimeList = async () => {
		try {
			const animeList = await locals.pb
				.collection('lists')
				.getFirstListItem(`animeId="${params.id}"`);
			return animeList;
		} catch (error) {
			return null;
		}
	};

	const fetchContinueWatching = async () => {
		try {
			const continueWatching = await locals.pb
				.collection('continue_watching')
				.getFirstListItem(`animeId="${params.id}"`);
			return continueWatching;
		} catch (error) {
			return null;
		}
	};

	const anime = {
		animeList: fetchAnimeList(),
		continueWatching: fetchContinueWatching(),
		details: fetchAnilistDetails(),
		streamed: {
			episodesList: fetchEpisodes()
		}
	};

	return anime;
}

export const actions = {
	addToList: async ({ request, locals }) => {
		const data = await request.formData();
		const animeId = data.get('animeId');
		const databaseId = data.get('databaseId');
		const listType = data.get('listType');
		try {
			if (databaseId !== '') {
				await locals.pb.collection('lists').update(databaseId, {
					listType
				});
			} else {
				const anilistResp = await fetch('https://graphql.anilist.co/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Accept: 'application/json'
					},
					body: JSON.stringify({
						query: watchListQuery,
						variables: { id: animeId }
					})
				});

				const anilist = await anilistResp.json();
				const media = anilist.data.Media;
				await locals.pb.collection('lists').create({
					user: locals.user.id,
					animeId: media.id,
					coverImage: media.coverImage,
					title: media.title,
					genres: media.genres,
					format: media.format,
					listType
				});
			}
		} catch (error) {
			throw new Error(error);
		}
	}
};
