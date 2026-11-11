// A photo name this app made: a random id and an image extension, with no
// folders, so a name read from a backup can't point anywhere else.
const PHOTO_NAME = /^[\w-]{1,64}\.(jpg|png|webp)$/;

export const isPhotoFile = (name?: unknown): name is string =>
  typeof name === "string" && PHOTO_NAME.test(name);
