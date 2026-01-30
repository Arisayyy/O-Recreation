import { MOCK_ITEMS } from "./mock";
import { IssuesInboxListItem } from "./issues-inbox-list-item";
import type { IssuesInboxItemModel } from "./types";

export function IssuesInboxList({
  items = MOCK_ITEMS,
}: {
  items?: IssuesInboxItemModel[];
}) {
  return (
    <div className="flex w-full flex-col gap-4 font-orchid-ui leading-6">
      {items.map((item) => (
        <IssuesInboxListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

