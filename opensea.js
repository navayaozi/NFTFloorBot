const axios = require('axios');

class OpenSeaAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.opensea.io/v2';
    this.headers = apiKey ? { 'X-API-KEY': apiKey } : {};
  }

  async getCollectionStats(collection) {
    try {
      const response = await axios.get(
        `${this.baseURL}/collections/${collection}/stats`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching stats for ${collection}:`, error.message);
      return null;
    }
  }

  async getFloorPrice(collection) {
    try {
      const stats = await this.getCollectionStats(collection);
      if (!stats || !stats.total) {
        return null;
      }
      
      return {
        collection: collection,
        floorPrice: stats.total.floor_price,
        currency: 'ETH',
        volume24h: stats.total.one_day_volume,
        change24h: stats.total.one_day_change
      };
    } catch (error) {
      console.error(`Error getting floor price for ${collection}:`, error.message);
      return null;
    }
  }

  formatPriceData(data) {
    if (!data) return 'Collection not found or API error';
    
    const floorPrice = data.floorPrice ? `${data.floorPrice.toFixed(3)} ${data.currency}` : 'N/A';
    const volume = data.volume24h ? `${data.volume24h.toFixed(2)} ETH` : 'N/A';
    const change = data.change24h ? `${(data.change24h * 100).toFixed(2)}%` : 'N/A';
    
    return `**${data.collection}**\n` +
           `Floor Price: ${floorPrice}\n` +
           `24h Volume: ${volume}\n` +
           `24h Change: ${change}`;
  }
}

module.exports = OpenSeaAPI;