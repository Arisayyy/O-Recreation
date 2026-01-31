export type IssueAttachment = {
  id: string;
  name: string;
  sizeLabel: string;
};

export type IssueThreadMessageModel = {
  id: string;
  fromInitial: string;
  fromName: string;
  fromAvatarId?: string;
  timeLabel: string;
  body: string;
  attachments?: IssueAttachment[];
};

export type IssueDetailModel = {
  id: string;
  title: string;
  fromInitial: string;
  fromName: string;
  timeLabel: string;
  attachments?: IssueAttachment[];
  thread: IssueThreadMessageModel[];
  replyToLabel: string;
  replySubject: string;
};

