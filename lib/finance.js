// lib/finance.js
// Wrapper Finnhub — REST simple, 60 req/min en gratuit

const axios = require('axios');

const BASE = 'https://finnhub.io/api/v1';
const TOKEN = process.env.FINNHUB_TOKEN;

const api = axios.create({
  baseURL: BASE,
  params: { token: TOKEN },
});

/**
 * Récupère le prix actuel d'un ticker.
 * @returns {{ symbol, price, currency, name, change }}
 */
async function getQuote(ticker) {
  ticker = ticker.toUpperCase();

  // Prix en temps réel
  const [quoteRes, profileRes] = await Promise.all([
    api.get('/quote', { params: { symbol: ticker } }),
    api.get('/stock/profile2', { params: { symbol: ticker } }),
  ]);

  const q = quoteRes.data;
  const p = profileRes.data;

  if (!q || q.c === 0) throw new Error(`Ticker introuvable : ${ticker}`);

  const prevClose = q.pc || q.c;
  const changePct = prevClose ? ((q.c - prevClose) / prevClose) * 100 : 0;

  return {
    symbol: ticker,
    price: q.c,                          // current price
    currency: p.currency ?? 'USD',
    name: p.name ?? ticker,
    change: changePct,
  };
}

/**
 * Recherche des tickers correspondant à une query.
 * @returns {Array<{ symbol, name, exchange }>}
 */
async function searchTicker(query) {
  const res = await api.get('/search', { params: { q: query } });
  return (res.data.result ?? [])
    .filter((r) => r.type === 'Common Stock' || r.type === 'ETP')
    .slice(0, 5)
    .map((r) => ({ symbol: r.symbol, name: r.description, exchange: r.primaryExchange }));
}

module.exports = { getQuote, searchTicker };