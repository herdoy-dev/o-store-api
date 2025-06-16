const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 24 * 60 * 60 * 1000,
  domain:
    process.env.NODE_ENV === "production"
      ? "hk-e-store.netlify.app"
      : undefined,
};

export default cookieOptions;
