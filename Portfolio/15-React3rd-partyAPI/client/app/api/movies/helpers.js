import movies from "../../data/sw";
import MovieStat from "../../../models/movieStat";
import { safeConnect } from "../../../lib/db";

async function fetchExternalFilmMap() {
  try {
    const response = await fetch("https://swapi.dev/api/films/?format=json", {
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`SWAPI responded with ${response.status}`);
    const payload = await response.json();
    const map = {};
    payload.results.forEach((film) => {
      map[String(film.episode_id)] = {
        director: film.director,
        producer: film.producer,
        release_date: film.release_date,
        opening_crawl: film.opening_crawl,
        title: film.title,
      };
    });
    return { map, source: "swapi.dev" };
  } catch (error) {
    console.warn("Could not fetch SWAPI films. Falling back to local data.", error.message);
    return { map: {}, source: null };
  }
}

function applyExternalInfo(movie, externalMap) {
  const extra = externalMap[movie.episode];
  if (!extra) return movie;
  return { ...movie, extra };
}

async function attachStats(movieList) {
  const conn = await safeConnect();
  if (!conn) {
    return {
      list: movieList.map((movie) => ({
        ...movie,
        stats: { likes: 0, dislikes: 0 },
      })),
      dbConnected: false,
    };
  }

  const episodes = movieList.map((movie) => movie.episode);
  const stats = await MovieStat.find({ episode: { $in: episodes } });
  const statMap = stats.reduce((acc, stat) => {
    acc[stat.episode] = stat;
    return acc;
  }, {});

  const withStats = [];
  for (const movie of movieList) {
    let entry = statMap[movie.episode];
    if (!entry) {
      entry = await MovieStat.findOneAndUpdate(
        { episode: movie.episode },
        { $setOnInsert: { likes: 0, dislikes: 0 } },
        { upsert: true, new: true }
      );
    }
    withStats.push({
      ...movie,
      stats: {
        likes: entry.likes ?? 0,
        dislikes: entry.dislikes ?? 0,
      },
    });
  }

  return { list: withStats, dbConnected: true };
}

export async function getMoviesWithStats() {
  const { map, source } = await fetchExternalFilmMap();
  const enriched = movies.map((movie) => applyExternalInfo(movie, map));
  const { list, dbConnected } = await attachStats(enriched);
  return { movies: list, dbConnected, externalSource: source };
}

export async function getMovieWithStats(episode) {
  const { map, source } = await fetchExternalFilmMap();
  const movie = movies.find((entry) => entry.episode === episode);
  if (!movie) {
    return { movie: null, dbConnected: false, externalSource: source };
  }
  const enriched = applyExternalInfo(movie, map);
  const { list, dbConnected } = await attachStats([enriched]);
  return { movie: list[0] || null, dbConnected, externalSource: source };
}
