import bcrypt from "bcryptjs";

async function hash(password) {
  const rounds = process.env.NODE_ENV === "production" ? 14 : 1;
  const hashedPassword = await bcrypt.hash(password, rounds);
  return hashedPassword;
}

async function compare(providedPassword, storedPassword) {
  const isMatch = await bcrypt.compare(providedPassword, storedPassword);
  return isMatch;
}

const password = {
  hash,
  compare,
};

export default password;
