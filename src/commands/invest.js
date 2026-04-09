const yahooFinance = require('yahoo-finance2').default;

async function getMultipleQuotes(symbols) {
  const quotes = await yahooFinance.quote(symbols);

  return quotes.map(q => ({
    symbol: q.symbol,
    name: q.shortName,
    price: q.regularMarketPrice,
    change: q.regularMarketChange,
    changePercent: q.regularMarketChangePercent?.toFixed(2),
    dayHigh: q.regularMarketDayHigh,
    dayLow: q.regularMarketDayLow,
    volume: q.regularMarketVolume,
    marketCap: q.marketCap,
    peRatio: q.trailingPE
  }));
}

// Get multiple stocks at once
const stocks = await getMultipleQuotes(['AAPL', 'GOOGL', 'MSFT', 'AMZN']);
console.log(stocks);