import { Router } from 'express';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const router = Router();

// Get quote for a symbol
router.get('/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const quote = await yahooFinance.quote(symbol);

    res.json({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      previousClose: quote.regularMarketPreviousClose,
      marketCap: quote.marketCap,
    });
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// Get multiple quotes
router.post('/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ error: 'symbols array required' });
    }

    const quotes = await Promise.all(
      symbols.map(async (symbol: string) => {
        try {
          const quote = await yahooFinance.quote(symbol.toUpperCase());
          return {
            symbol: quote.symbol,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
          };
        } catch {
          return { symbol, error: 'Failed to fetch' };
        }
      })
    );

    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Get options chain for a symbol
router.get('/options/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const date = req.query.date as string | undefined;

    const options = await yahooFinance.options(symbol, { date });

    // Format the response
    res.json({
      underlying: symbol,
      underlyingPrice: options.quote?.regularMarketPrice,
      expirationDates: options.expirationDates,
      calls: options.options?.[0]?.calls?.map(formatOption) || [],
      puts: options.options?.[0]?.puts?.map(formatOption) || [],
    });
  } catch (error) {
    console.error('Options chain error:', error);
    res.status(500).json({ error: 'Failed to fetch options chain' });
  }
});

// Get historical data
router.get('/history/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const period = (req.query.period as string) || '1mo';

    const result = await yahooFinance.chart(symbol, {
      period1: getStartDate(period),
      interval: '1d',
    });

    const history = result.quotes.map(q => ({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume,
    }));

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Search for symbols
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const results = await yahooFinance.search(query);

    res.json(
      results.quotes
        .filter(q => q.quoteType === 'EQUITY')
        .slice(0, 10)
        .map(q => ({
          symbol: q.symbol,
          name: q.shortname || q.longname,
          exchange: q.exchange,
        }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to search' });
  }
});

// Helper functions
function formatOption(opt: any) {
  return {
    contractSymbol: opt.contractSymbol,
    strike: opt.strike,
    expiration: opt.expiration,
    type: opt.contractSymbol?.includes('C') ? 'call' : 'put',
    bid: opt.bid,
    ask: opt.ask,
    last: opt.lastPrice,
    volume: opt.volume,
    openInterest: opt.openInterest,
    impliedVolatility: opt.impliedVolatility,
    inTheMoney: opt.inTheMoney,
  };
}

function getStartDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case '1w':
      return new Date(now.setDate(now.getDate() - 7));
    case '1mo':
      return new Date(now.setMonth(now.getMonth() - 1));
    case '3mo':
      return new Date(now.setMonth(now.getMonth() - 3));
    case '6mo':
      return new Date(now.setMonth(now.getMonth() - 6));
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setMonth(now.getMonth() - 1));
  }
}

export default router;
