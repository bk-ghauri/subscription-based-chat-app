export class ConvMemberDto {
  id: string;
  displayName: string;
  avatar?: string | null;
  role: 'ADMIN' | 'MEMBER';
  statusMessage?: string | null;
}
