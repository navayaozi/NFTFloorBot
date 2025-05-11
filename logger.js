const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, 'logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir);
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  log(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Console output
    const colorCode = {
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      DEBUG: '\x1b[36m'  // Cyan
    };
    
    console.log(`${colorCode[level] || ''}[${level}] ${timestamp}: ${message}\x1b[0m`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }

    // File output
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }
}

module.exports = new Logger();