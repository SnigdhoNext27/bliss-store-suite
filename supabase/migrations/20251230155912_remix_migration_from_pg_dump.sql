CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user',
    'super_admin',
    'officer'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);


--
-- Name: award_loyalty_points(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.award_loyalty_points() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  points_to_award INTEGER;
  user_points RECORD;
  new_tier TEXT;
BEGIN
  -- Only award points when order status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.user_id IS NOT NULL THEN
    -- Calculate points: 1 point per 100 BDT spent
    points_to_award := FLOOR(NEW.total / 100);
    
    -- Get or create loyalty record
    SELECT * INTO user_points FROM public.loyalty_points WHERE user_id = NEW.user_id;
    
    IF user_points IS NULL THEN
      INSERT INTO public.loyalty_points (user_id, points, lifetime_points, tier)
      VALUES (NEW.user_id, points_to_award, points_to_award, 'bronze');
    ELSE
      -- Determine new tier based on lifetime points
      new_tier := CASE
        WHEN user_points.lifetime_points + points_to_award >= 5000 THEN 'platinum'
        WHEN user_points.lifetime_points + points_to_award >= 2000 THEN 'gold'
        WHEN user_points.lifetime_points + points_to_award >= 500 THEN 'silver'
        ELSE 'bronze'
      END;
      
      UPDATE public.loyalty_points
      SET points = points + points_to_award,
          lifetime_points = lifetime_points + points_to_award,
          tier = new_tier,
          updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
    
    -- Record the transaction
    INSERT INTO public.loyalty_transactions (user_id, points, type, description, order_id)
    VALUES (NEW.user_id, points_to_award, 'earn', 'Points earned from order #' || NEW.order_number, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: create_order_with_items(text, numeric, numeric, numeric, jsonb, jsonb, uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_order_with_items(p_order_number text, p_subtotal numeric, p_delivery_fee numeric, p_total numeric, p_shipping_address jsonb, p_items jsonb, p_user_id uuid DEFAULT NULL::uuid, p_guest_phone text DEFAULT NULL::text, p_guest_email text DEFAULT NULL::text, p_notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_calculated_subtotal NUMERIC := 0;
  v_calculated_total NUMERIC;
BEGIN
  -- Validate items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Validate and calculate prices from database (server-side price validation)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Get actual price from products table if product_id exists
    IF v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != 'null' THEN
      SELECT price, sale_price, name INTO v_product
      FROM products 
      WHERE id = (v_item->>'product_id')::UUID AND is_active = true;
      
      IF v_product IS NULL THEN
        RAISE EXCEPTION 'Product not found or inactive: %', v_item->>'product_id';
      END IF;
      
      -- Use sale_price if available, otherwise regular price
      v_calculated_subtotal := v_calculated_subtotal + 
        (COALESCE(v_product.sale_price, v_product.price) * (v_item->>'quantity')::INTEGER);
    ELSE
      -- For legacy/sample products without ID, trust the provided price
      v_calculated_subtotal := v_calculated_subtotal + 
        ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER);
    END IF;
  END LOOP;

  -- Calculate total with delivery fee
  v_calculated_total := v_calculated_subtotal + p_delivery_fee;

  -- Validate delivery fee is reasonable (between 0 and 500)
  IF p_delivery_fee < 0 OR p_delivery_fee > 500 THEN
    RAISE EXCEPTION 'Invalid delivery fee';
  END IF;

  -- Create the order
  INSERT INTO orders (
    order_number,
    user_id,
    guest_phone,
    guest_email,
    subtotal,
    delivery_fee,
    total,
    shipping_address,
    notes,
    status
  ) VALUES (
    p_order_number,
    p_user_id,
    p_guest_phone,
    p_guest_email,
    v_calculated_subtotal,
    p_delivery_fee,
    v_calculated_total,
    p_shipping_address,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_image,
      size,
      color,
      quantity,
      price
    ) VALUES (
      v_order_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' != 'null' 
           THEN (v_item->>'product_id')::UUID 
           ELSE NULL END,
      v_item->>'product_name',
      v_item->>'product_image',
      v_item->>'size',
      v_item->>'color',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC
    );
  END LOOP;

  -- Return success with order details
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', p_order_number,
    'total', v_calculated_total
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;


--
-- Name: get_admin_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_count() RETURNS integer
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.user_roles 
  WHERE role IN ('super_admin', 'admin', 'officer', 'moderator')
$$;


--
-- Name: get_user_admin_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_admin_role(_user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = _user_id
  AND role IN ('super_admin', 'admin', 'officer', 'moderator')
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'officer' THEN 4
      ELSE 5
    END
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_admin_access(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_admin_access(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('super_admin', 'admin', 'officer', 'moderator')
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: touch_chat_conversation(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_chat_conversation() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.chat_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;


--
-- Name: update_notification_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_notification_counts() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.event_type = 'delivered' THEN
    UPDATE public.notifications SET delivered_count = delivered_count + 1 WHERE id = NEW.notification_id;
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE public.notifications SET opened_count = opened_count + 1 WHERE id = NEW.notification_id;
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE public.notifications SET clicked_count = clicked_count + 1 WHERE id = NEW.notification_id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: abandoned_carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abandoned_carts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    guest_id text,
    cart_data jsonb NOT NULL,
    total_value numeric DEFAULT 0 NOT NULL,
    reminder_sent boolean DEFAULT false,
    reminder_count integer DEFAULT 0,
    last_reminder_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    recovered boolean DEFAULT false
);


--
-- Name: addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    label text DEFAULT 'Home'::text,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    district text,
    postal_code text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    admin_email text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bundle_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bundle_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bundle_id uuid NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    has_sizes boolean DEFAULT true,
    display_order integer DEFAULT 0
);


--
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    customer_name text,
    customer_email text,
    status text DEFAULT 'open'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_conversations_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_type text NOT NULL,
    sender_id uuid,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_messages_sender_type_check CHECK ((sender_type = ANY (ARRAY['customer'::text, 'admin'::text])))
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    discount_type text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2) DEFAULT 0,
    max_uses integer,
    uses_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT coupons_discount_positive CHECK ((discount_value >= (0)::numeric)),
    CONSTRAINT coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text]))),
    CONSTRAINT coupons_min_order_nonnegative CHECK ((min_order_amount >= (0)::numeric))
);


--
-- Name: gift_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_cards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    initial_balance numeric DEFAULT 0 NOT NULL,
    current_balance numeric DEFAULT 0 NOT NULL,
    purchaser_id uuid,
    recipient_email text,
    recipient_name text,
    message text,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hero_slides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hero_slides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    subtitle text,
    tagline text,
    description text,
    image_url text NOT NULL,
    cta_text text DEFAULT 'Shop Now'::text,
    cta_link text DEFAULT '#products'::text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    lifetime_points integer DEFAULT 0 NOT NULL,
    tier text DEFAULT 'bronze'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: loyalty_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer NOT NULL,
    type text NOT NULL,
    description text,
    order_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    subscribed_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: notification_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_id uuid NOT NULL,
    user_id uuid,
    event_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT notification_analytics_event_type_check CHECK ((event_type = ANY (ARRAY['delivered'::text, 'opened'::text, 'clicked'::text])))
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    push_enabled boolean DEFAULT true,
    email_enabled boolean DEFAULT true,
    order_updates boolean DEFAULT true,
    promotions boolean DEFAULT true,
    new_products boolean DEFAULT true,
    restock_alerts boolean DEFAULT true,
    abandoned_cart boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_triggers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    trigger_type text NOT NULL,
    is_active boolean DEFAULT true,
    delay_minutes integer DEFAULT 60,
    title_template text NOT NULL,
    message_template text NOT NULL,
    send_email boolean DEFAULT true,
    send_push boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    image_url text,
    link text,
    is_global boolean DEFAULT true,
    user_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    scheduled_at timestamp with time zone,
    is_sent boolean DEFAULT true,
    delivered_count integer DEFAULT 0,
    opened_count integer DEFAULT 0,
    clicked_count integer DEFAULT 0,
    target_segment text DEFAULT 'all'::text,
    target_criteria jsonb DEFAULT '{}'::jsonb,
    send_email boolean DEFAULT false,
    variant_id text,
    parent_id uuid,
    is_ab_test boolean DEFAULT false,
    ab_test_name text
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    product_name text NOT NULL,
    product_image text,
    size text,
    color text,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    user_id uuid,
    guest_email text,
    guest_phone text,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    delivery_fee numeric(10,2) DEFAULT 0 NOT NULL,
    discount numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    shipping_address jsonb NOT NULL,
    notes text,
    tracking_number text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gift_wrap boolean DEFAULT false,
    gift_message text,
    gift_card_code text
);


--
-- Name: product_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_answers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    user_id uuid,
    answer text NOT NULL,
    is_official boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_bundles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_bundles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    discount_percentage numeric DEFAULT 10 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    question text NOT NULL,
    is_answered boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    short_description text,
    price numeric(10,2) NOT NULL,
    sale_price numeric(10,2),
    sku text,
    stock integer DEFAULT 0 NOT NULL,
    sizes text[] DEFAULT '{}'::text[],
    colors text[] DEFAULT '{}'::text[],
    images text[] DEFAULT '{}'::text[],
    category_id uuid,
    is_featured boolean DEFAULT false,
    is_new boolean DEFAULT true,
    is_active boolean DEFAULT true,
    rating numeric(2,1) DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    video_url text,
    CONSTRAINT products_name_length CHECK ((length(name) <= 200)),
    CONSTRAINT products_price_positive CHECK ((price >= (0)::numeric)),
    CONSTRAINT products_stock_nonnegative CHECK ((stock >= 0))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gender text,
    date_of_birth date,
    referral_code text,
    CONSTRAINT profiles_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    endpoint text NOT NULL,
    p256dh_key text NOT NULL,
    auth_key text NOT NULL,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_email text NOT NULL,
    referred_id uuid,
    referral_code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reward_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: restock_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restock_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text,
    product_id uuid NOT NULL,
    notified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: review_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    image_url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    user_id uuid,
    rating integer NOT NULL,
    comment text,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: saved_payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    method_type text NOT NULL,
    last_four text,
    phone_number text,
    card_brand text,
    is_default boolean DEFAULT false,
    nickname text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT saved_payment_methods_method_type_check CHECK ((method_type = ANY (ARRAY['bkash'::text, 'nagad'::text, 'card'::text])))
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT site_settings_value_length CHECK ((length(value) <= 2000))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: abandoned_carts abandoned_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abandoned_carts
    ADD CONSTRAINT abandoned_carts_pkey PRIMARY KEY (id);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bundle_items bundle_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: gift_cards gift_cards_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_code_key UNIQUE (code);


--
-- Name: gift_cards gift_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_pkey PRIMARY KEY (id);


--
-- Name: hero_slides hero_slides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hero_slides
    ADD CONSTRAINT hero_slides_pkey PRIMARY KEY (id);


--
-- Name: loyalty_points loyalty_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_pkey PRIMARY KEY (id);


--
-- Name: loyalty_transactions loyalty_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_email_key UNIQUE (email);


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscribers
    ADD CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id);


--
-- Name: notification_analytics notification_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_analytics
    ADD CONSTRAINT notification_analytics_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notification_triggers notification_triggers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_triggers
    ADD CONSTRAINT notification_triggers_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_answers product_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_answers
    ADD CONSTRAINT product_answers_pkey PRIMARY KEY (id);


--
-- Name: product_bundles product_bundles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_bundles
    ADD CONSTRAINT product_bundles_pkey PRIMARY KEY (id);


--
-- Name: product_questions product_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_questions
    ADD CONSTRAINT product_questions_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: push_subscriptions push_subscriptions_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: restock_alerts restock_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restock_alerts
    ADD CONSTRAINT restock_alerts_pkey PRIMARY KEY (id);


--
-- Name: review_photos review_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_photos
    ADD CONSTRAINT review_photos_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: saved_payment_methods saved_payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_payment_methods
    ADD CONSTRAINT saved_payment_methods_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_key UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: wishlist wishlist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_pkey PRIMARY KEY (id);


--
-- Name: wishlist wishlist_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_product_id_key UNIQUE (user_id, product_id);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_admin_id ON public.admin_audit_logs USING btree (admin_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_logs_entity_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity_type ON public.admin_audit_logs USING btree (entity_type);


--
-- Name: idx_categories_display_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_display_order ON public.categories USING btree (display_order);


--
-- Name: idx_newsletter_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers USING btree (email);


--
-- Name: idx_notification_analytics_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_analytics_created ON public.notification_analytics USING btree (created_at DESC);


--
-- Name: idx_notification_analytics_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_analytics_event ON public.notification_analytics USING btree (event_type);


--
-- Name: idx_notification_analytics_notification; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_analytics_notification ON public.notification_analytics USING btree (notification_id);


--
-- Name: idx_notification_analytics_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_analytics_user ON public.notification_analytics USING btree (user_id);


--
-- Name: idx_notifications_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_scheduled ON public.notifications USING btree (scheduled_at) WHERE ((scheduled_at IS NOT NULL) AND (is_sent = false));


--
-- Name: idx_saved_payment_methods_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_saved_payment_methods_user_id ON public.saved_payment_methods USING btree (user_id);


--
-- Name: orders award_points_on_delivery; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER award_points_on_delivery AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_points();


--
-- Name: chat_messages chat_messages_touch_conversation; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER chat_messages_touch_conversation AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.touch_chat_conversation();


--
-- Name: abandoned_carts update_abandoned_carts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: loyalty_points update_loyalty_points_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON public.loyalty_points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_analytics update_notification_counts_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_counts_trigger AFTER INSERT ON public.notification_analytics FOR EACH ROW EXECUTE FUNCTION public.update_notification_counts();


--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_triggers update_notification_triggers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_triggers_updated_at BEFORE UPDATE ON public.notification_triggers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: saved_payment_methods update_saved_payment_methods_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_saved_payment_methods_updated_at BEFORE UPDATE ON public.saved_payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: abandoned_carts abandoned_carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abandoned_carts
    ADD CONSTRAINT abandoned_carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bundle_items bundle_items_bundle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) REFERENCES public.product_bundles(id) ON DELETE CASCADE;


--
-- Name: bundle_items bundle_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bundle_items
    ADD CONSTRAINT bundle_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- Name: gift_cards gift_cards_purchaser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT gift_cards_purchaser_id_fkey FOREIGN KEY (purchaser_id) REFERENCES auth.users(id);


--
-- Name: loyalty_transactions loyalty_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: notification_analytics notification_analytics_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_analytics
    ADD CONSTRAINT notification_analytics_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_preferences notification_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: product_answers product_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_answers
    ADD CONSTRAINT product_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.product_questions(id) ON DELETE CASCADE;


--
-- Name: product_answers product_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_answers
    ADD CONSTRAINT product_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: product_questions product_questions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_questions
    ADD CONSTRAINT product_questions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_questions product_questions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_questions
    ADD CONSTRAINT product_questions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES auth.users(id);


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id);


--
-- Name: restock_alerts restock_alerts_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restock_alerts
    ADD CONSTRAINT restock_alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: restock_alerts restock_alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restock_alerts
    ADD CONSTRAINT restock_alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: review_photos review_photos_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_photos
    ADD CONSTRAINT review_photos_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: wishlist wishlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: coupons Active coupons are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons FOR SELECT USING ((is_active = true));


--
-- Name: hero_slides Active hero slides are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active hero slides are viewable by everyone" ON public.hero_slides FOR SELECT USING (((is_active = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: products Active products are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active products are viewable by everyone" ON public.products FOR SELECT USING (((is_active = true) OR public.has_admin_access(auth.uid())));


--
-- Name: abandoned_carts Admins can manage abandoned carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage abandoned carts" ON public.abandoned_carts USING (public.has_admin_access(auth.uid()));


--
-- Name: restock_alerts Admins can manage all alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all alerts" ON public.restock_alerts USING (public.has_admin_access(auth.uid()));


--
-- Name: categories Admins can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage categories" ON public.categories USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: coupons Admins can manage coupons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage coupons" ON public.coupons USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: hero_slides Admins can manage hero slides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage hero slides" ON public.hero_slides USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: loyalty_points Admins can manage loyalty points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage loyalty points" ON public.loyalty_points USING (public.has_admin_access(auth.uid()));


--
-- Name: loyalty_transactions Admins can manage loyalty transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage loyalty transactions" ON public.loyalty_transactions USING (public.has_admin_access(auth.uid()));


--
-- Name: notifications Admins can manage notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage notifications" ON public.notifications USING (public.has_admin_access(auth.uid()));


--
-- Name: products Admins can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage products" ON public.products USING (public.has_admin_access(auth.uid()));


--
-- Name: reviews Admins can manage reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage reviews" ON public.reviews USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: site_settings Admins can manage site settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage site settings" ON public.site_settings USING (public.has_admin_access(auth.uid())) WITH CHECK (public.has_admin_access(auth.uid()));


--
-- Name: newsletter_subscribers Admins can manage subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers USING (public.has_admin_access(auth.uid()));


--
-- Name: notification_triggers Admins can manage triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage triggers" ON public.notification_triggers USING (public.has_admin_access(auth.uid()));


--
-- Name: chat_messages Admins can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (((sender_type = 'admin'::text) AND public.has_admin_access(auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.chat_conversations c
  WHERE (c.id = chat_messages.conversation_id)))));


--
-- Name: chat_conversations Admins can update conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update conversations" ON public.chat_conversations FOR UPDATE USING (public.has_admin_access(auth.uid()));


--
-- Name: orders Admins can update orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.has_admin_access(auth.uid()));


--
-- Name: notification_analytics Admins can view all analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all analytics" ON public.notification_analytics FOR SELECT USING (public.has_admin_access(auth.uid()));


--
-- Name: order_items Admins can view all order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT USING (public.has_admin_access(auth.uid()));


--
-- Name: orders Admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_admin_access(auth.uid()));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_audit_logs Admins can view audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: newsletter_subscribers Admins can view subscribers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view subscribers" ON public.newsletter_subscribers FOR SELECT USING (public.has_admin_access(auth.uid()));


--
-- Name: orders Anyone can create orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- Name: abandoned_carts Anyone can insert abandoned carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert abandoned carts" ON public.abandoned_carts FOR INSERT WITH CHECK (true);


--
-- Name: loyalty_transactions Anyone can insert loyalty transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert loyalty transactions" ON public.loyalty_transactions FOR INSERT WITH CHECK (true);


--
-- Name: newsletter_subscribers Anyone can subscribe to newsletter; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


--
-- Name: product_answers Anyone can view answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view answers" ON public.product_answers FOR SELECT USING (true);


--
-- Name: bundle_items Anyone can view bundle items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view bundle items" ON public.bundle_items FOR SELECT USING (true);


--
-- Name: product_bundles Anyone can view bundles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view bundles" ON public.product_bundles FOR SELECT USING (true);


--
-- Name: product_questions Anyone can view questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view questions" ON public.product_questions FOR SELECT USING (true);


--
-- Name: review_photos Anyone can view review photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view review photos" ON public.review_photos FOR SELECT USING (true);


--
-- Name: reviews Approved reviews are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews FOR SELECT USING (((is_approved = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: admin_audit_logs Audit logs created via function only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Audit logs created via function only" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: chat_conversations Authenticated customers can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated customers can create conversations" ON public.chat_conversations FOR INSERT TO authenticated WITH CHECK ((customer_id = auth.uid()));


--
-- Name: product_questions Authenticated users can ask questions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can ask questions" ON public.product_questions FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: reviews Authenticated users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: gift_cards Authenticated users can purchase gift cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can purchase gift cards" ON public.gift_cards FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: categories Categories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);


--
-- Name: chat_messages Customers can send messages in own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can send messages in own conversations" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (((sender_type = 'customer'::text) AND (sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.chat_conversations c
  WHERE ((c.id = chat_messages.conversation_id) AND (c.customer_id = auth.uid()))))));


--
-- Name: chat_conversations Customers can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view their own conversations" ON public.chat_conversations FOR SELECT USING (((customer_id = auth.uid()) OR public.has_admin_access(auth.uid())));


--
-- Name: notification_triggers Everyone can view active triggers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view active triggers" ON public.notification_triggers FOR SELECT USING ((is_active = true));


--
-- Name: order_items Order items created via secure function only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order items created via secure function only" ON public.order_items FOR INSERT WITH CHECK (false);


--
-- Name: site_settings Public settings are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public settings are viewable by everyone" ON public.site_settings FOR SELECT USING (((key = ANY (ARRAY['tagline'::text, 'slogan'::text, 'delivery_fee_dhaka'::text, 'delivery_fee_outside'::text, 'whatsapp_notification_phone'::text, 'business_phone'::text, 'business_email'::text, 'social_facebook'::text, 'social_instagram'::text, 'social_whatsapp'::text])) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: product_answers Users can add answers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add answers" ON public.product_answers FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: referrals Users can create referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK ((referrer_id = auth.uid()));


--
-- Name: addresses Users can delete own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: addresses Users can insert own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: loyalty_points Users can insert own loyalty points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own loyalty points" ON public.loyalty_points FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_preferences Users can insert own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: notification_analytics Users can log their own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can log their own analytics" ON public.notification_analytics FOR INSERT WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: restock_alerts Users can manage own alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own alerts" ON public.restock_alerts USING (((auth.uid() = user_id) OR (user_id IS NULL)));


--
-- Name: saved_payment_methods Users can manage own payment methods; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own payment methods" ON public.saved_payment_methods USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: push_subscriptions Users can manage own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own subscriptions" ON public.push_subscriptions USING ((auth.uid() = user_id));


--
-- Name: wishlist Users can manage own wishlist; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own wishlist" ON public.wishlist USING ((auth.uid() = user_id));


--
-- Name: notifications Users can mark own notifications as read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can mark own notifications as read" ON public.notifications FOR UPDATE USING (((user_id = auth.uid()) OR ((is_global = true) AND (auth.uid() IS NOT NULL))));


--
-- Name: addresses Users can update own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: notification_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));


--
-- Name: review_photos Users can upload photos to their reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload photos to their reviews" ON public.review_photos FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.reviews
  WHERE ((reviews.id = review_photos.review_id) AND (reviews.user_id = auth.uid())))));


--
-- Name: chat_messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.chat_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.chat_conversations
  WHERE ((chat_conversations.id = chat_messages.conversation_id) AND ((chat_conversations.customer_id = auth.uid()) OR public.has_admin_access(auth.uid()))))));


--
-- Name: abandoned_carts Users can view own abandoned carts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own abandoned carts" ON public.abandoned_carts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: addresses Users can view own addresses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loyalty_points Users can view own loyalty points; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own loyalty points" ON public.loyalty_points FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: loyalty_transactions Users can view own loyalty transactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own loyalty transactions" ON public.loyalty_transactions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: order_items Users can view own order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: orders Users can view own orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: gift_cards Users can view their gift cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their gift cards" ON public.gift_cards FOR SELECT USING (((purchaser_id = auth.uid()) OR (recipient_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (((user_id = auth.uid()) OR (is_global = true)));


--
-- Name: referrals Users can view their referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their referrals" ON public.referrals FOR SELECT USING (((referrer_id = auth.uid()) OR (referred_id = auth.uid())));


--
-- Name: abandoned_carts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

--
-- Name: addresses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bundle_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

--
-- Name: gift_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: hero_slides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_points; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

--
-- Name: loyalty_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_triggers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_triggers ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: product_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: product_bundles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

--
-- Name: product_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: restock_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restock_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: review_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlist; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;