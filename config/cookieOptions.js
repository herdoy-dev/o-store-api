const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 24 * 60 * 60 * 1000,
  domain: process.env.NODE_ENV === "production" ? ".netlify.app" : "localhost",
};

export default cookieOptions;
