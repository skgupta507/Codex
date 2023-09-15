import nxt from '$lib/images/nxt-carousel.png';
import pre from '$lib/images/pre-carousel.png';
import filterIcon from '$lib/images/filter-icon.png';
import downArrow from '$lib/images/down.svg';
import{MagnifyingGlass,AdjustmentsVertical, Eye, User, Tv} from 'svelte-hero-icons'
import logo from '$lib/images/logo.png';
export { nxt, pre, filterIcon, downArrow, logo };
export const apiUrl = 'https://api.consumet.org';
export const proxyUrl = 'https://proxy.jasanpreetn9.workers.dev/?';

const { randomBytes } = await import('node:crypto');

export const serializeNonPOJOs = (obj) => {
	return structuredClone(obj);
};

export const userNavigation = [
	{
		title: 'Profile',
		href: '/user/profile',
		icon: AdjustmentsVertical
	},
	{
		title: 'Account',
		href: '/user/account',
		icon: User
	},
	{
		title: 'Continue Watching',
		href: '/user/continue-watching',
		icon: Eye
	},
	{
		title: 'Watch Lists',
		href: '/user/watch-list',
		icon: Tv
	}
];

export const formatDetails = (media, enime) => {
	// Filter and format relations
	const relations = media.relations?.edges
		.filter((relation) => relation.node && relation.node.relationType)
		.map((relation) => {
			// Ensure relation.node is not null and has a relationType property
			return {
				relationType: relation.node.relationType
					.replace
					// ... (replace logic)
					()
				// ... (other properties you want to include)
			};
		});

	// Format studios
	const studios = media.studios.edges.map((studio) => studio.node.name).join(', ');

	// Format airing date
	if (media.nextAiringEpisode) {
		const airingDate = new Date(media.nextAiringEpisode.airingAt * 1000);
		media.nextAiringEpisode.airingAt = airingDate.toDateString();
	}

	// Format date fields
	const formatDate = (date) => {
		const formattedDate = new Date(date.year, date.month - 1, date.day);
		return formattedDate.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	media.startDate = formatDate(media.startDate);
	media.endDate = formatDate(media.endDate);

	// Remove HTML tags and trim description
	media.description = media.description
		.split('*')[0]
		.trim()
		.replace(/<br\s*\/?>/gi, '');

	// Extract and format recommendations
	const recommendations = media.recommendations.edges.map(
		(recommendation) => recommendation.node.mediaRecommendation
	);

	// Sort episodes
	if (enime) {
		media.episodes = enime?.episodes;
		media.episodes?.sort((a, b) => a.number - b.number);
	}

	// Update the media object with the formatted data
	media.relations = relations;
	media.studios = studios;
	media.genres = media.genres.join(', ');
	media.recommendations = recommendations;

	return media;
};
