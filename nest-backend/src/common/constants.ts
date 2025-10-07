import { join } from 'path';

export const MEDIA_ATTACHMENTS_DIR = join(
  process.cwd(),
  'src',
  'uploaded-media',
  'message-attachments',
);

export const AVATARS_DIR = join(
  process.cwd(),
  'src',
  'uploaded-media',
  'avatars',
);
