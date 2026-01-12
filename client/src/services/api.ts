import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Account API
export const accountApi = {
  getAll: () => api.get('/accounts'),
  getById: (id: number) => api.get(`/accounts/${id}`),
  getHistory: (id: number, limit = 30) => api.get(`/accounts/${id}/history?limit=${limit}`),
};

// Positions API
export const positionsApi = {
  getAll: (accountId = 1, status?: string) =>
    api.get(`/positions?account_id=${accountId}${status ? `&status=${status}` : ''}`),
  getOpen: (accountId = 1) => api.get(`/positions?account_id=${accountId}&status=open`),
  getById: (id: number) => api.get(`/positions/${id}`),
  create: (data: {
    account_id?: number;
    symbol: string;
    underlying: string;
    option_type: 'call' | 'put' | 'stock';
    strike?: number;
    expiration?: string;
    quantity: number;
    price: number;
    strategy_tag?: string;
    notes?: string;
  }) => api.post('/positions', data),
  updatePrice: (id: number, currentPrice: number) =>
    api.patch(`/positions/${id}/price`, { current_price: currentPrice }),
  close: (id: number, closePrice: number, status = 'closed', notes?: string) =>
    api.post(`/positions/${id}/close`, { close_price: closePrice, status, notes }),
};

// Trades API
export const tradesApi = {
  getByPosition: (positionId: number) => api.get(`/trades/position/${positionId}`),
  create: (data: {
    position_id: number;
    action: 'open' | 'close' | 'roll' | 'adjust';
    quantity: number;
    price: number;
    commission?: number;
    notes?: string;
  }) => api.post('/trades', data),
};

// Journal API
export const journalApi = {
  getAll: () => api.get('/journal'),
  getByPosition: (positionId: number) => api.get(`/journal/position/${positionId}`),
  create: (data: {
    position_id: number;
    trade_id?: number;
    thesis?: string;
    analysis?: string;
    grade?: 'A' | 'B' | 'C' | 'D' | 'F';
    emotion?: string;
    lessons_learned?: string;
  }) => api.post('/journal', data),
  update: (id: number, data: {
    thesis?: string;
    analysis?: string;
    grade?: string;
    emotion?: string;
    lessons_learned?: string;
  }) => api.put(`/journal/${id}`, data),
};

// Analytics API
export const analyticsApi = {
  get: (accountId = 1) => api.get(`/analytics?account_id=${accountId}`),
};

// Market Data API
export const marketApi = {
  getQuote: (symbol: string) => api.get(`/market/quote/${symbol}`),
  getQuotes: (symbols: string[]) => api.post('/market/quotes', { symbols }),
  getOptions: (symbol: string, date?: string) =>
    api.get(`/market/options/${symbol}${date ? `?date=${date}` : ''}`),
  getHistory: (symbol: string, period = '1mo') =>
    api.get(`/market/history/${symbol}?period=${period}`),
  search: (query: string) => api.get(`/market/search?q=${query}`),
};

export default api;
