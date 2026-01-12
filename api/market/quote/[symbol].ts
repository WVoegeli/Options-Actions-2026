import type { VercelRequest, VercelResponse } from '@vercel/node';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { symbol } = req.query;
    const quote = await yahooFinance.quote((symbol as string).toUpperCase());

    res.status(200).json({
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
}
