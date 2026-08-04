import { mediaConfiguration, S3PrivateMediaStore } from "@nextstep/media";

export const MEDIA_CONFIGURATION = Symbol("MEDIA_CONFIGURATION");
export const PRIVATE_MEDIA_STORE = Symbol("PRIVATE_MEDIA_STORE");

export const mediaConfigurationProvider = {
  provide: MEDIA_CONFIGURATION,
  useFactory: () => mediaConfiguration(),
};

export const privateMediaStoreProvider = {
  provide: PRIVATE_MEDIA_STORE,
  inject: [MEDIA_CONFIGURATION],
  useFactory: (configuration: ReturnType<typeof mediaConfiguration>) =>
    new S3PrivateMediaStore(configuration),
};
