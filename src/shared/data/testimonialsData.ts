export type Testimonial = {
	id: number;
	name: string;
	/** 96px-wide avatar (the only size shipped). */
	avatar96: string;
	rating: number;
	text: string;
	destination: string;
	/** At most one of these three is set — it becomes the author link. */
	profileUrl?: string;
	reelUrl?: string;
	postUrl?: string;
	/** Reel thumbnail. Present only on cards that link a reel; drives the media preview. */
	thumbnail?: string;
	thumbnail480?: string;
};

export const testimonialsData: Testimonial[] = [
	{
		id: 1,
		name: 'Branko',
		avatar96: '/root/testimonials/branko-slika-96w.webp',
		rating: 5,
		text: 'Absolutely outstanding stay with BGApartman. The apartment was modern, spotless, and incredibly comfortable. Everything was perfectly organized and exactly as shown. I couldn’t have asked for a better experience.',
		destination: 'Serbia',
		profileUrl: 'https://www.tiktok.com/@branko.jovanovic'
	},
	{
		id: 2,
		name: 'Sara',
		avatar96: '/root/testimonials/sara-slika-96w.webp',
		rating: 5,
		text: 'BGApartman truly impressed me. The apartment was beautifully designed, very clean, and felt premium in every detail. The entire stay was smooth and enjoyable. I would gladly book again.',
		destination: 'Serbia',
		reelUrl: 'https://www.instagram.com/p/DK9uDSHC8ss/',
		thumbnail: '/root/testimonials/sara-thumbnail-480w.webp',
		thumbnail480: '/root/testimonials/sara-thumbnail-480w.webp'
	},
	{
		id: 3,
		name: 'Luka',
		avatar96: '/root/testimonials/luka-slika-96w.webp',
		rating: 5,
		text: 'Exceptional service and high-quality apartments from BGApartman. Everything was handled professionally, and the apartment matched the photos perfectly. A great choice for a comfortable and worry-free stay.',
		destination: 'Serbia',
		profileUrl: 'https://www.tiktok.com/@luka_sara'
	},
	{
		id: 4,
		name: 'Violeta',
		avatar96: '/root/testimonials/violeta-slika-96w.webp',
		rating: 5,
		text: 'BGApartman exceeded my expectations. The apartment was cozy, elegant, and very well maintained. I felt relaxed and taken care of throughout my stay. Highly recommended.',
		destination: 'Serbia',
		postUrl: 'https://www.instagram.com/p/DLSvEMVMXBJ/?img_index=1'
	},
	{
		id: 5,
		name: 'Djoza',
		avatar96: '/root/testimonials/djoza-slika-96w.webp',
		rating: 5,
		text: 'An excellent experience with BGApartman from start to finish. The apartment was stylish, comfortable, and perfectly prepared. Everything went smoothly, making this a stay I’ll definitely remember.',
		destination: 'Serbia',
		reelUrl: 'https://www.instagram.com/reel/DURCeE1DZTY/',
		thumbnail: '/root/testimonials/djoza-thumbnail-480w.webp',
		thumbnail480: '/root/testimonials/djoza-thumbnail-480w.webp'
	}
];
