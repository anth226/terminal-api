const isDev = process.env.IS_DEV;

export const setup = async () => {
  try {
    await redis.set(
      "AWS_POSTGRES_DB_DATABASE",
      process.env.AWS_POSTGRES_DB_1_NAME
    );
    await redis.set("AWS_POSTGRES_DB_HOST", process.env.AWS_POSTGRES_DB_1_HOST);
    await redis.set("AWS_POSTGRES_DB_PORT", process.env.AWS_POSTGRES_DB_1_PORT);
    await redis.set("AWS_POSTGRES_DB_USER", process.env.AWS_POSTGRES_DB_1_USER);
    await redis.set(
      "AWS_POSTGRES_DB_PASSWORD",
      process.env.AWS_POSTGRES_DB_1_PASSWORD
    );
  } catch (error) {}
};

if (isDev) {
  setup();
}
