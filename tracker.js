const fs = require('fs');
const path = require('path');

class CollectionTracker {
  constructor() {
    this.dataFile = path.join(__dirname, 'tracked_collections.json');
    this.trackedCollections = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = fs.readFileSync(this.dataFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading tracked collections:', error);
    }
    return {};
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.trackedCollections, null, 2));
    } catch (error) {
      console.error('Error saving tracked collections:', error);
    }
  }

  addCollection(channelId, collection, threshold = null) {
    if (!this.trackedCollections[channelId]) {
      this.trackedCollections[channelId] = {};
    }
    
    this.trackedCollections[channelId][collection] = {
      lastPrice: null,
      threshold: threshold,
      addedAt: new Date().toISOString()
    };
    
    this.saveData();
    return true;
  }

  removeCollection(channelId, collection) {
    if (this.trackedCollections[channelId] && this.trackedCollections[channelId][collection]) {
      delete this.trackedCollections[channelId][collection];
      
      if (Object.keys(this.trackedCollections[channelId]).length === 0) {
        delete this.trackedCollections[channelId];
      }
      
      this.saveData();
      return true;
    }
    return false;
  }

  getTrackedCollections(channelId) {
    return this.trackedCollections[channelId] || {};
  }

  updatePrice(channelId, collection, newPrice) {
    if (this.trackedCollections[channelId] && this.trackedCollections[channelId][collection]) {
      const oldPrice = this.trackedCollections[channelId][collection].lastPrice;
      this.trackedCollections[channelId][collection].lastPrice = newPrice;
      this.saveData();
      return oldPrice;
    }
    return null;
  }

  getAllTracked() {
    return this.trackedCollections;
  }

  shouldNotify(channelId, collection, newPrice, oldPrice) {
    const tracked = this.trackedCollections[channelId]?.[collection];
    if (!tracked || !oldPrice) return false;

    const threshold = tracked.threshold;
    if (!threshold) return false;

    const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    return Math.abs(changePercent) >= threshold;
  }
}

module.exports = CollectionTracker;