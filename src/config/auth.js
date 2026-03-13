const accessTokenSecret =
  process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;

const accessTokenExpiry =
  process.env.ACCESS_TOKEN_EXPIRY || process.env.JWT_EXPIRE || "15m";

const refreshTokenExpiry =
  process.env.REFRESH_TOKEN_EXPIRY || process.env.JWT_EXPIRE || "7d";

export {
  accessTokenSecret,
  refreshTokenSecret,
  accessTokenExpiry,
  refreshTokenExpiry
};
