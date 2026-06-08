export const config = () => ({
  tokenHoldersParsingEnabled:
    process.env.TOKEN_HOLDERS_PARSING_ENABLED === 'true',
  walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  txSenderEnabled: process.env.TX_SENDER_ENABLED === 'true',
  twitterApiKey: process.env.TWITTERAPI_API_KEY,
  artifactsAccessCode: process.env.ARTIFACTS_ACCESS_CODE,
  storagePath: process.env.STORAGE_PATH || process.cwd(),
  cacheEnabled: process.env.ARTIFACTS_CACHE === 'true',
  notSaveArtifactsToDisk: process.env.NOT_SAVE_ARTIFACTS_TO_DISK === 'true',
});

export const Commands = {
  SYNC_LABELS: 'sync:labels',
  DRAW_DAO_IMAGES: 'draw:dao-images',
};
