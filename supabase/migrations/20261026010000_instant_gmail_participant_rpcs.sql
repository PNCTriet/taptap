-- =============================================================================
-- TAPTAP — Instant 1-Tap Gmail Participant Login & Passport Sync RPCs
-- =============================================================================

ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS device_token text;

ALTER TABLE public.collected_stamps
  ADD COLUMN IF NOT EXISTS station_id uuid REFERENCES public.stations(id) ON DELETE CASCADE;

ALTER TABLE public.participant_badges
  ADD COLUMN IF NOT EXISTS awarded_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS voucher_code text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY lower(trim(p.email))
           ORDER BY p.updated_at DESC, p.created_at DESC
         ) AS rn
  FROM public.participants p
  WHERE p.email IS NOT NULL AND trim(p.email) <> ''
)
UPDATE public.participants target
SET email = NULL
FROM ranked r
WHERE target.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_email_lower
  ON public.participants (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';

CREATE OR REPLACE FUNCTION public.get_gmail_participant_passport(
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_participant public.participants%ROWTYPE;
BEGIN
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  SELECT *
  INTO v_participant
  FROM public.participants p
  WHERE lower(trim(p.email)) = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'participant', NULL,
      'stamps', '[]'::jsonb,
      'badges', '[]'::jsonb,
      'redemptions', '[]'::jsonb
    );
  END IF;

  RETURN jsonb_build_object(
    'participant', jsonb_build_object(
      'id', v_participant.id,
      'email', v_participant.email,
      'display_name', v_participant.display_name,
      'device_token', COALESCE(v_participant.device_token, v_participant.guest_token_hash)
    ),
    'stamps', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cs.id,
          'participant_id', cs.participant_id,
          'stamp_id', cs.stamp_id,
          'station_id', COALESCE(cs.station_id, st.station_id),
          'nfc_tag_id', cs.nfc_tag_id,
          'collected_at', cs.collected_at
        )
        ORDER BY cs.collected_at ASC
      )
      FROM public.collected_stamps cs
      LEFT JOIN public.stamps st ON st.id = cs.stamp_id
      WHERE cs.participant_id = v_participant.id
    ), '[]'::jsonb),
    'badges', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', pb.id,
          'participant_id', pb.participant_id,
          'badge_id', pb.badge_id,
          'awarded_at', COALESCE(pb.awarded_at, pb.unlocked_at)
        )
        ORDER BY COALESCE(pb.awarded_at, pb.unlocked_at) ASC
      )
      FROM public.participant_badges pb
      WHERE pb.participant_id = v_participant.id
    ), '[]'::jsonb),
    'redemptions', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'participant_id', r.participant_id,
          'reward_id', r.reward_id,
          'voucher_code', COALESCE(r.voucher_code, r.redemption_code),
          'redemption_code', COALESCE(r.redemption_code, r.voucher_code),
          'status', r.status,
          'created_at', r.created_at,
          'redeemed_at', r.redeemed_at,
          'expires_at', r.expires_at
        )
        ORDER BY r.created_at DESC
      )
      FROM public.redemptions r
      WHERE r.participant_id = v_participant.id
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_gmail_participant(
  p_email text,
  p_display_name text DEFAULT NULL,
  p_device_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_name text := nullif(trim(coalesce(p_display_name, '')), '');
  v_token text := nullif(trim(coalesce(p_device_token, '')), '');
  v_participant public.participants%ROWTYPE;
BEGIN
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF v_name IS NULL THEN
    v_name := split_part(v_email, '@', 1);
  END IF;

  IF v_token IS NULL THEN
    v_token := 'gmail:' || v_email;
  END IF;

  SELECT *
  INTO v_participant
  FROM public.participants p
  WHERE lower(trim(p.email)) = v_email
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.participants p
    SET display_name = COALESCE(v_name, p.display_name),
        email = v_email,
        device_token = COALESCE(v_token, p.device_token),
        updated_at = now()
    WHERE p.id = v_participant.id
    RETURNING * INTO v_participant;
  ELSE
    SELECT *
    INTO v_participant
    FROM public.participants p
    WHERE p.device_token = v_token OR p.guest_token_hash = v_token
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.participants p
      SET email = v_email,
          display_name = COALESCE(v_name, p.display_name),
          device_token = v_token,
          updated_at = now()
      WHERE p.id = v_participant.id
      RETURNING * INTO v_participant;
    ELSE
      INSERT INTO public.participants (device_token, guest_token_hash, email, display_name)
      VALUES (v_token, v_token, v_email, v_name)
      RETURNING * INTO v_participant;
    END IF;
  END IF;

  RETURN public.get_gmail_participant_passport(v_email);
END;
$$;

CREATE OR REPLACE FUNCTION public.collect_gmail_participant_stamp(
  p_email text,
  p_stamp_id uuid,
  p_station_id uuid,
  p_nfc_tag_id uuid DEFAULT NULL,
  p_award_badge_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_participant public.participants%ROWTYPE;
  v_stamp public.collected_stamps%ROWTYPE;
BEGIN
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  SELECT *
  INTO v_participant
  FROM public.participants p
  WHERE lower(trim(p.email)) = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.participants (device_token, guest_token_hash, email, display_name)
    VALUES ('gmail:' || v_email, 'gmail:' || v_email, v_email, split_part(v_email, '@', 1))
    RETURNING * INTO v_participant;
  END IF;

  INSERT INTO public.collected_stamps (
    participant_id,
    stamp_id,
    station_id,
    nfc_tag_id
  )
  VALUES (
    v_participant.id,
    p_stamp_id,
    p_station_id,
    p_nfc_tag_id
  )
  ON CONFLICT (participant_id, stamp_id) DO UPDATE
    SET station_id = EXCLUDED.station_id
  RETURNING * INTO v_stamp;

  IF p_award_badge_id IS NOT NULL THEN
    INSERT INTO public.participant_badges (participant_id, badge_id)
    VALUES (v_participant.id, p_award_badge_id)
    ON CONFLICT (participant_id, badge_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'id', v_stamp.id,
    'participant_id', v_stamp.participant_id,
    'stamp_id', v_stamp.stamp_id,
    'station_id', v_stamp.station_id,
    'nfc_tag_id', v_stamp.nfc_tag_id,
    'collected_at', v_stamp.collected_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_gmail_participant_reward(
  p_email text,
  p_reward_id uuid,
  p_voucher_code text,
  p_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_participant public.participants%ROWTYPE;
  v_redemption public.redemptions%ROWTYPE;
BEGIN
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  SELECT *
  INTO v_participant
  FROM public.participants p
  WHERE lower(trim(p.email)) = v_email
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.participants (device_token, guest_token_hash, email, display_name)
    VALUES ('gmail:' || v_email, 'gmail:' || v_email, v_email, split_part(v_email, '@', 1))
    RETURNING * INTO v_participant;
  END IF;

  SELECT *
  INTO v_redemption
  FROM public.redemptions r
  WHERE r.participant_id = v_participant.id
    AND r.reward_id = p_reward_id
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.redemptions (
      participant_id,
      reward_id,
      redemption_code,
      voucher_code,
      status,
      expires_at
    )
    VALUES (
      v_participant.id,
      p_reward_id,
      p_voucher_code,
      p_voucher_code,
      'issued',
      p_expires_at
    )
    RETURNING * INTO v_redemption;
  END IF;

  RETURN jsonb_build_object(
    'id', v_redemption.id,
    'participant_id', v_redemption.participant_id,
    'reward_id', v_redemption.reward_id,
    'voucher_code', COALESCE(v_redemption.voucher_code, v_redemption.redemption_code),
    'redemption_code', COALESCE(v_redemption.redemption_code, v_redemption.voucher_code),
    'status', v_redemption.status,
    'created_at', v_redemption.created_at,
    'redeemed_at', v_redemption.redeemed_at,
    'expires_at', v_redemption.expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_gmail_participant_progress(
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_participant public.participants%ROWTYPE;
BEGIN
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  SELECT *
  INTO v_participant
  FROM public.participants p
  WHERE lower(trim(p.email)) = v_email
  LIMIT 1;

  IF FOUND THEN
    DELETE FROM public.collected_stamps WHERE participant_id = v_participant.id;
    DELETE FROM public.participant_badges WHERE participant_id = v_participant.id;
    DELETE FROM public.redemptions WHERE participant_id = v_participant.id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_gmail_participant_passport(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_gmail_participant(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.collect_gmail_participant_stamp(text, uuid, uuid, uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_gmail_participant_reward(text, uuid, text, timestamptz) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_gmail_participant_progress(text) TO anon, authenticated, service_role;
