-- Tighten chat security (require authenticated customers) + avoid auth.users FK

-- Remove FK to auth.users to avoid coupling to auth schema
ALTER TABLE public.chat_conversations
DROP CONSTRAINT IF EXISTS chat_conversations_customer_id_fkey;

-- Replace overly-permissive conversation creation policy
DROP POLICY IF EXISTS "Anyone can create a conversation" ON public.chat_conversations;

CREATE POLICY "Authenticated customers can create conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Replace message insert policy to enforce sender identity
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.chat_messages;

CREATE POLICY "Customers can send messages in own conversations"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'customer'
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.customer_id = auth.uid()
  )
);

CREATE POLICY "Admins can send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'admin'
  AND has_admin_access(auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
  )
);

-- Automatically update conversation updated_at when a new message arrives
CREATE OR REPLACE FUNCTION public.touch_chat_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_touch_conversation ON public.chat_messages;
CREATE TRIGGER chat_messages_touch_conversation
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_chat_conversation();