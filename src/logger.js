const ERROR_COLOR = "color: red";
const WARN_COLOR = "color: yellow";

export const logger = {
  log: (message) => {
    console.log(`[INFO]: ${message}`);
  },
  error: (message) => {
    console.log(`%c[ERROR]: ${message}`, ERROR_COLOR);
  },
  warn: (message) => {
    console.log(`%c[WARN]: ${message}`, WARN_COLOR);
  },
};
