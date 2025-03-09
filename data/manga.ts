import { Manga, Category } from '../types';

// Données placeholder pour les mangas
export const MANGA_DATA: Manga[] = [
  {
    id: '1',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    coverImage: 'https://cdn.myanimelist.net/images/manga/2/253146.jpg',
    rating: 4.8,
    genres: ['Shonen', 'Aventure', 'Action'],
    releaseYear: 1999,
  },
  {
    id: '2',
    title: 'Kimetsu no Yaiba',
    author: 'Koyoharu Gotouge',
    coverImage: 'https://cdn.myanimelist.net/images/manga/3/179023.jpg',
    rating: 4.7,
    genres: ['Shonen', 'Action', 'Surnaturel'],
    releaseYear: 2016,
  },
  {
    id: '3',
    title: 'Shingeki no Kyojin',
    author: 'Hajime Isayama',
    coverImage: 'https://cdn.myanimelist.net/images/manga/2/37846.jpg',
    rating: 4.9,
    genres: ['Shonen', 'Action', 'Drame'],
    releaseYear: 2009,
  },
  {
    id: '4',
    title: 'Jujutsu Kaisen',
    author: 'Gege Akutami',
    coverImage: 'https://cdn.myanimelist.net/images/manga/3/210341.jpg',
    rating: 4.6,
    genres: ['Shonen', 'Action', 'Surnaturel'],
    releaseYear: 2018,
  },
  {
    id: '5',
    title: 'Boku no Hero Academia',
    author: 'Kohei Horikoshi',
    coverImage: 'https://cdn.myanimelist.net/images/manga/1/209370.jpg',
    rating: 4.5,
    genres: ['Shonen', 'Action', 'Super-héros'],
    releaseYear: 2014,
  },
  {
    id: '6',
    title: 'Chainsaw Man',
    author: 'Tatsuki Fujimoto',
    coverImage: 'https://cdn.myanimelist.net/images/manga/3/216464.jpg',
    rating: 4.7,
    genres: ['Shonen', 'Action', 'Horreur'],
    releaseYear: 2018,
  },
  {
    id: '7',
    title: 'Berserk',
    author: 'Kentaro Miura',
    coverImage: 'https://cdn.myanimelist.net/images/manga/1/157897.jpg',
    rating: 4.9,
    genres: ['Seinen', 'Action', 'Dark Fantasy'],
    releaseYear: 1989,
  },
  {
    id: '8',
    title: 'Vagabond',
    author: 'Takehiko Inoue',
    coverImage: 'https://cdn.myanimelist.net/images/manga/1/259070.jpg',
    rating: 4.8,
    genres: ['Seinen', 'Action', 'Historique'],
    releaseYear: 1998,
  },
  {
    id: '9',
    title: 'Vinland Saga',
    author: 'Makoto Yukimura',
    coverImage: 'https://cdn.myanimelist.net/images/manga/2/188925.jpg',
    rating: 4.7,
    genres: ['Seinen', 'Action', 'Historique'],
    releaseYear: 2005,
  },
  {
    id: '10',
    title: 'Tokyo Ghoul',
    author: 'Sui Ishida',
    coverImage: 'https://cdn.myanimelist.net/images/manga/3/114037.jpg',
    rating: 4.5,
    genres: ['Seinen', 'Action', 'Horreur'],
    releaseYear: 2011,
  },
];

// Catégories de mangas
export const CATEGORIES: Category[] = [
  {
    id: 'popular',
    title: 'Populaires',
    mangas: [...MANGA_DATA].sort((a, b) => b.rating - a.rating),
  },
  {
    id: 'new',
    title: 'Nouveautés',
    mangas: [...MANGA_DATA].sort((a, b) => b.releaseYear - a.releaseYear),
  },
  {
    id: 'shonen',
    title: 'Shonen',
    mangas: MANGA_DATA.filter(manga => manga.genres.includes('Shonen')),
  },
  {
    id: 'seinen',
    title: 'Seinen',
    mangas: MANGA_DATA.filter(manga => manga.genres.includes('Seinen')),
  },
  {
    id: 'action',
    title: 'Action',
    mangas: MANGA_DATA.filter(manga => manga.genres.includes('Action')),
  },
]; 