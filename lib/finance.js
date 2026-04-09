// lib/finance.js
// Wrapper Yahoo Finance via yahoo-finance2 (ESM-only, chargé via import dynamique)

let _yf;
async function getYF() {
  if (!_yf) {
    const mod = await import('yahoo-finance2');
    _yf = mod.default;
  }
  return _yf;
}

async function getQuote(ticker) {
  const yf = await getYF();
  const quote = await yf.quote(ticker.toUpperCase());
  if (!quote || !quote.regularMarketPrice) {
    throw new Error(`Ticker introuvable : ${ticker}`);
  }
  return {
    symbol: quote.symbol,
    price: quote.regularMarketPrice,
    currency: quote.currency ?? 'USD',
    name: quote.longName ?? quote.shortName ?? quote.symbol,
    change: quote.regularMarketChangePercent ?? 0,
  };
}

async function searchTicker(query) {
  const yf = await getYF();
  const results = await yf.search(query);
  return (results.quotes ?? [])
    .filter((q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
    .slice(0, 5)
    .map((q) => ({ symbol: q.symbol, name: q.shortname ?? q.longname, exchange: q.exchange }));
}

module.exports = { getQuote, searchTicker };