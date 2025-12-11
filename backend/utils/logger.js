export const log = {
  info: (emoji, message, ...args) => {
    console.log(`${emoji} ${message}`, ...args);
  },
  error: (emoji, message, ...args) => {
    console.error(`${emoji} ${message}`, ...args);
  },
  warn: (emoji, message, ...args) => {
    console.warn(`${emoji} ${message}`, ...args);
  }
};

