-- Secure messaging + lawyer onboarding hardening.

-- One conversation per (client, lawyer).
create unique index if not exists conversations_client_lawyer_uniq on conversations (client_id, lawyer_id) where lawyer_id is not null;

-- A client may only open a conversation with a VERIFIED lawyer (previously any lawyer id was accepted).
drop policy if exists conv_client_insert on conversations;
create policy conv_client_insert on conversations for insert with check (
  client_id = auth.uid()
  and lawyer_id is not null
  and exists (select 1 from lawyers l where l.id = lawyer_id and l.verification = 'verified')
);

-- Recipients may mark messages addressed to them as read (never edit body/sender).
create policy msg_recipient_read on messages for update
  using (sender_id <> auth.uid() and exists (select 1 from conversations c where c.id = conversation_id and (c.client_id = auth.uid() or c.lawyer_id = auth.uid())))
  with check (sender_id <> auth.uid());

-- Message bodies are immutable and undeletable by users; guard the columns the policy above could otherwise touch.
create or replace function messages_only_read_at() returns trigger language plpgsql as $$
begin
  if new.body is distinct from old.body or new.sender_id is distinct from old.sender_id
     or new.conversation_id is distinct from old.conversation_id or new.attachment_document_id is distinct from old.attachment_document_id then
    raise exception 'messages are immutable except read_at';
  end if;
  return new;
end $$;
create trigger trg_messages_immutable before update on messages for each row execute function messages_only_read_at();

-- Lawyers may only message into conversations they belong to AND only once verified (suspension cuts access).
drop policy if exists msg_party_insert on messages;
create policy msg_party_insert on messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from conversations c
    where c.id = conversation_id
      and (c.client_id = auth.uid()
           or (c.lawyer_id = auth.uid() and exists (select 1 from lawyers l where l.id = auth.uid() and l.verification = 'verified')))));

create index if not exists messages_unread_idx on messages (conversation_id) where read_at is null;
