import axios from 'axios';
import type { GenerationRequest, GenerationResponse, MarketMoment, TipRequest } from '@wave-ai/shared';

const API_BASE = '/api';

export const api = {
  async generate(request: GenerationRequest): Promise<MarketMoment> {
    const response = await axios.post<GenerationResponse>(`${API_BASE}/generate`, request);
    if (!response.data.success || !response.data.moment) {
      throw new Error(response.data.error || 'Generation failed');
    }
    return response.data.moment;
  },

  async getMoments(): Promise<MarketMoment[]> {
    const response = await axios.get<MarketMoment[]>(`${API_BASE}/moments`);
    return response.data;
  },

  async getMoment(momentId: string): Promise<MarketMoment> {
    const response = await axios.get<MarketMoment>(`${API_BASE}/moments/${momentId}`);
    return response.data;
  },

  async mintNFT(momentId: string): Promise<any> {
    const response = await axios.post(`${API_BASE}/moments/${momentId}/mint`);
    return response.data;
  },

  async tip(request: TipRequest): Promise<any> {
    const response = await axios.post(`${API_BASE}/tip`, request);
    return response.data;
  },
};


