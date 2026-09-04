export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organizer_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organizer_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organizer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      event_reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_seats: {
        Row: {
          created_at: string
          event_id: string
          held_until: string | null
          id: string
          price_cents: number | null
          seat_id: string
          status: Database["public"]["Enums"]["seat_status"]
          ticket_type_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          held_until?: string | null
          id?: string
          price_cents?: number | null
          seat_id: string
          status?: Database["public"]["Enums"]["seat_status"]
          ticket_type_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          held_until?: string | null
          id?: string
          price_cents?: number | null
          seat_id?: string
          status?: Database["public"]["Enums"]["seat_status"]
          ticket_type_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_seats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "venue_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          capacity: number | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          doors_open_at: string | null
          ends_at: string
          gallery: Json
          id: string
          is_featured: boolean
          is_online: boolean
          min_age: number | null
          online_url: string | null
          organizer_id: string
          published_at: string | null
          refund_policy: string | null
          rejection_reason: string | null
          sales_end_at: string | null
          sales_start_at: string | null
          search_vector: unknown
          seating_type: Database["public"]["Enums"]["seating_type"]
          slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          subtitle: string | null
          tags: string[]
          terms: string | null
          timezone: string
          title: string
          updated_at: string
          venue_id: string | null
          view_count: number
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          capacity?: number | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          doors_open_at?: string | null
          ends_at: string
          gallery?: Json
          id?: string
          is_featured?: boolean
          is_online?: boolean
          min_age?: number | null
          online_url?: string | null
          organizer_id: string
          published_at?: string | null
          refund_policy?: string | null
          rejection_reason?: string | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          search_vector?: unknown
          seating_type?: Database["public"]["Enums"]["seating_type"]
          slug?: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          subtitle?: string | null
          tags?: string[]
          terms?: string | null
          timezone?: string
          title: string
          updated_at?: string
          venue_id?: string | null
          view_count?: number
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          capacity?: number | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          doors_open_at?: string | null
          ends_at?: string
          gallery?: Json
          id?: string
          is_featured?: boolean
          is_online?: boolean
          min_age?: number | null
          online_url?: string | null
          organizer_id?: string
          published_at?: string | null
          refund_policy?: string | null
          rejection_reason?: string | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          search_vector?: unknown
          seating_type?: Database["public"]["Enums"]["seating_type"]
          slug?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          subtitle?: string | null
          tags?: string[]
          terms?: string | null
          timezone?: string
          title?: string
          updated_at?: string
          venue_id?: string | null
          view_count?: number
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          event_seat_id: string | null
          id: string
          order_id: string
          quantity: number
          seat_label: string | null
          subtotal_cents: number
          ticket_type_id: string
          ticket_type_name: string
          unit_price_cents: number
        }
        Insert: {
          event_seat_id?: string | null
          id?: string
          order_id: string
          quantity: number
          seat_label?: string | null
          subtotal_cents: number
          ticket_type_id: string
          ticket_type_name: string
          unit_price_cents: number
        }
        Update: {
          event_seat_id?: string | null
          id?: string
          order_id?: string
          quantity?: number
          seat_label?: string | null
          subtotal_cents?: number
          ticket_type_id?: string
          ticket_type_name?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_event_seat_id_fkey"
            columns: ["event_seat_id"]
            isOneToOne: false
            referencedRelation: "event_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          application_fee_cents: number
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          cancelled_at: string | null
          connected_account_id: string | null
          created_at: string
          currency: string
          discount_cents: number
          event_id: string
          fee_cents: number
          id: string
          metadata: Json
          order_number: string
          organizer_id: string
          paid_at: string | null
          payment_intent_id: string | null
          payment_provider: Database["public"]["Enums"]["payment_provider"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          promo_code_id: string | null
          refunded_cents: number
          reservation_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_fee_cents?: number
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          cancelled_at?: string | null
          connected_account_id?: string | null
          created_at?: string
          currency?: string
          discount_cents?: number
          event_id: string
          fee_cents?: number
          id?: string
          metadata?: Json
          order_number: string
          organizer_id: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_provider?: Database["public"]["Enums"]["payment_provider"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promo_code_id?: string | null
          refunded_cents?: number
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_fee_cents?: number
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          cancelled_at?: string | null
          connected_account_id?: string | null
          created_at?: string
          currency?: string
          discount_cents?: number
          event_id?: string
          fee_cents?: number
          id?: string
          metadata?: Json
          order_number?: string
          organizer_id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_provider?: Database["public"]["Enums"]["payment_provider"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          promo_code_id?: string | null
          refunded_cents?: number
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_members: {
        Row: {
          created_at: string
          organizer_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organizer_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organizer_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_members_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizer_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          banner_url: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_suspended: boolean
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          social_links: Json
          support_email: string | null
          support_phone: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          social_links?: Json
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_suspended?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          social_links?: Json
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          charges_enabled: boolean
          connected_at: string | null
          country: string | null
          created_at: string
          default_currency: string
          details_submitted: boolean
          disconnected_at: string | null
          id: string
          livemode: boolean
          organizer_id: string
          payouts_enabled: boolean
          provider: Database["public"]["Enums"]["payment_provider"]
          requirements_due: Json
          stripe_account_id: string | null
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          connected_at?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string
          details_submitted?: boolean
          disconnected_at?: string | null
          id?: string
          livemode?: boolean
          organizer_id: string
          payouts_enabled?: boolean
          provider?: Database["public"]["Enums"]["payment_provider"]
          requirements_due?: Json
          stripe_account_id?: string | null
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          connected_at?: string | null
          country?: string | null
          created_at?: string
          default_currency?: string
          details_submitted?: boolean
          disconnected_at?: string | null
          id?: string
          livemode?: boolean
          organizer_id?: string
          payouts_enabled?: boolean
          provider?: Database["public"]["Enums"]["payment_provider"]
          requirements_due?: Json
          stripe_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          default_currency: string
          hold_duration_minutes: number
          id: boolean
          platform_fee_fixed_cents: number
          platform_fee_percent: number
          platform_name: string
          require_event_approval: boolean
          support_email: string
          updated_at: string
        }
        Insert: {
          default_currency?: string
          hold_duration_minutes?: number
          id?: boolean
          platform_fee_fixed_cents?: number
          platform_fee_percent?: number
          platform_name?: string
          require_event_approval?: boolean
          support_email?: string
          updated_at?: string
        }
        Update: {
          default_currency?: string
          hold_duration_minutes?: number
          id?: boolean
          platform_fee_fixed_cents?: number
          platform_fee_percent?: number
          platform_name?: string
          require_event_approval?: boolean
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_banned: boolean
          locale: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_banned?: boolean
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          ends_at: string | null
          event_id: string | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          min_order_cents: number
          organizer_id: string
          starts_at: string | null
          ticket_type_ids: string[]
          times_redeemed: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          ends_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order_cents?: number
          organizer_id: string
          starts_at?: string | null
          ticket_type_ids?: string[]
          times_redeemed?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          ends_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          min_order_cents?: number
          organizer_id?: string
          starts_at?: string | null
          ticket_type_ids?: string[]
          times_redeemed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          order_id: string
          processed_at: string | null
          provider_refund_id: string | null
          reason: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          order_id: string
          processed_at?: string | null
          provider_refund_id?: string | null
          reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          order_id?: string
          processed_at?: string | null
          provider_refund_id?: string | null
          reason?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_items: {
        Row: {
          event_seat_id: string | null
          id: string
          quantity: number
          reservation_id: string
          ticket_type_id: string
          unit_price_cents: number
        }
        Insert: {
          event_seat_id?: string | null
          id?: string
          quantity: number
          reservation_id: string
          ticket_type_id: string
          unit_price_cents: number
        }
        Update: {
          event_seat_id?: string | null
          id?: string
          quantity?: number
          reservation_id?: string
          ticket_type_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_event_seat_id_fkey"
            columns: ["event_seat_id"]
            isOneToOne: false
            referencedRelation: "event_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          released_at: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scans: {
        Row: {
          device_info: string | null
          event_id: string
          id: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at: string
          scanned_by: string | null
          scanned_code: string | null
          ticket_id: string | null
        }
        Insert: {
          device_info?: string | null
          event_id: string
          id?: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by?: string | null
          scanned_code?: string | null
          ticket_id?: string | null
        }
        Update: {
          device_info?: string | null
          event_id?: string
          id?: string
          result?: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanned_by?: string | null
          scanned_code?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_scans_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          badge_color: string
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_hidden: boolean
          max_per_order: number
          min_per_order: number
          name: string
          price_cents: number
          quantity_reserved: number
          quantity_sold: number
          quantity_total: number
          sales_end_at: string | null
          sales_start_at: string | null
          section_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge_color?: string
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_hidden?: boolean
          max_per_order?: number
          min_per_order?: number
          name: string
          price_cents: number
          quantity_reserved?: number
          quantity_sold?: number
          quantity_total: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          section_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge_color?: string
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_hidden?: boolean
          max_per_order?: number
          min_per_order?: number
          name?: string
          price_cents?: number
          quantity_reserved?: number
          quantity_sold?: number
          quantity_total?: number
          sales_end_at?: string | null
          sales_start_at?: string | null
          section_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_types_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "venue_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          event_id: string
          event_seat_id: string | null
          id: string
          issued_at: string
          order_id: string
          order_item_id: string
          owner_user_id: string | null
          qr_secret: string
          seat_label: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_code: string
          ticket_type_id: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          event_id: string
          event_seat_id?: string | null
          id?: string
          issued_at?: string
          order_id: string
          order_item_id: string
          owner_user_id?: string | null
          qr_secret?: string
          seat_label?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_code: string
          ticket_type_id: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          event_id?: string
          event_seat_id?: string | null
          id?: string
          issued_at?: string
          order_id?: string
          order_item_id?: string
          owner_user_id?: string | null
          qr_secret?: string
          seat_label?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_code?: string
          ticket_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_seat_id_fkey"
            columns: ["event_seat_id"]
            isOneToOne: false
            referencedRelation: "event_seats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_seats: {
        Row: {
          created_at: string
          id: string
          is_accessible: boolean
          pos_x: number
          pos_y: number
          row_label: string
          seat_number: string
          section_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_accessible?: boolean
          pos_x?: number
          pos_y?: number
          row_label: string
          seat_number: string
          section_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_accessible?: boolean
          pos_x?: number
          pos_y?: number
          row_label?: string
          seat_number?: string
          section_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_seats_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "venue_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_seats_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_sections: {
        Row: {
          capacity: number
          code: string
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
          venue_id: string
        }
        Insert: {
          capacity?: number
          code: string
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          venue_id: string
        }
        Update: {
          capacity?: number
          code?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_sections_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          capacity: number | null
          city: string
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          organizer_id: string | null
          postal_code: string | null
          seating_type: Database["public"]["Enums"]["seating_type"]
          slug: string
          state: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          capacity?: number | null
          city?: string
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          organizer_id?: string | null
          postal_code?: string | null
          seating_type?: Database["public"]["Enums"]["seating_type"]
          slug: string
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          capacity?: number | null
          city?: string
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          organizer_id?: string | null
          postal_code?: string | null
          seating_type?: Database["public"]["Enums"]["seating_type"]
          slug?: string
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          created_at: string
          email: string
          event_id: string
          id: string
          notified_at: string | null
          quantity: number
          ticket_type_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          id?: string
          notified_at?: string | null
          quantity?: number
          ticket_type_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          notified_at?: string | null
          quantity?: number
          ticket_type_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_platform_stats: { Args: never; Returns: Json }
      can_manage_event: { Args: { p_event_id: string }; Returns: boolean }
      can_view_event: { Args: { p_event_id: string }; Returns: boolean }
      cancel_order: { Args: { p_order_id: string }; Returns: Json }
      create_order_from_reservation: {
        Args: {
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone?: string
          p_promo_code?: string
          p_reservation_id: string
        }
        Returns: Json
      }
      create_reservation: {
        Args: { p_event_id: string; p_items?: Json; p_seat_ids?: string[] }
        Returns: Json
      }
      current_role_name: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      event_availability: {
        Args: { p_event_id: string }
        Returns: {
          available: number
          currency: string
          max_per_order: number
          min_per_order: number
          name: string
          on_sale: boolean
          price_cents: number
          quantity_total: number
          ticket_type_id: string
        }[]
      }
      event_stats: { Args: { p_event_id: string }; Returns: Json }
      events_map: {
        Args: {
          p_category_slug?: string
          p_city?: string
          p_from?: string
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_organizer_slug?: string
          p_radius_km?: number
          p_to?: string
        }
        Returns: {
          category_color: string
          category_name: string
          city: string
          country: string
          cover_image_url: string
          currency: string
          distance_km: number
          ends_at: string
          id: string
          is_featured: boolean
          is_sold_out: boolean
          latitude: number
          longitude: number
          min_price_cents: number
          organizer_name: string
          organizer_slug: string
          slug: string
          starts_at: string
          timezone: string
          title: string
          venue_address: string
          venue_name: string
        }[]
      }
      expire_reservations: { Args: { p_event_id?: string }; Returns: number }
      fail_order_payment: {
        Args: { p_order_id: string; p_reason: string; p_secret: string }
        Returns: Json
      }
      finalize_order_payment: {
        Args: {
          p_connected_account?: string
          p_order_id: string
          p_payment_intent_id: string
          p_secret: string
        }
        Returns: Json
      }
      generate_code: { Args: { p_length?: number }; Returns: string }
      increment_event_views: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_org_member: {
        Args: {
          p_min_role?: Database["public"]["Enums"]["org_member_role"]
          p_organizer_id: string
        }
        Returns: boolean
      }
      organizer_can_sell: { Args: { p_organizer_id: string }; Returns: boolean }
      organizer_sales_series: {
        Args: { p_days?: number; p_event_id?: string; p_organizer_id: string }
        Returns: {
          day: string
          gross_cents: number
          orders: number
          tickets: number
        }[]
      }
      organizer_stats: { Args: { p_organizer_id: string }; Returns: Json }
      owns_order: { Args: { p_order_id: string }; Returns: boolean }
      owns_reservation: { Args: { p_reservation_id: string }; Returns: boolean }
      record_refund: {
        Args: {
          p_amount_cents: number
          p_order_id: string
          p_reason: string
          p_refund_id: string
          p_secret: string
        }
        Returns: Json
      }
      release_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      release_reservation_internal: {
        Args: {
          p_reservation_id: string
          p_status: Database["public"]["Enums"]["reservation_status"]
        }
        Returns: undefined
      }
      scan_ticket: {
        Args: {
          p_device_info?: string
          p_event_id: string
          p_qr_secret: string
          p_ticket_code: string
        }
        Returns: Json
      }
      search_events: {
        Args: {
          p_category_slug?: string
          p_city?: string
          p_featured_only?: boolean
          p_free_only?: boolean
          p_from?: string
          p_limit?: number
          p_max_price?: number
          p_offset?: number
          p_organizer_slug?: string
          p_query?: string
          p_sort?: string
          p_to?: string
        }
        Returns: {
          category_color: string
          category_name: string
          category_slug: string
          city: string
          country: string
          cover_image_url: string
          currency: string
          ends_at: string
          id: string
          is_featured: boolean
          is_online: boolean
          is_sold_out: boolean
          max_price_cents: number
          min_price_cents: number
          organizer_name: string
          organizer_slug: string
          slug: string
          starts_at: string
          subtitle: string
          tickets_left: number
          timezone: string
          title: string
          total_count: number
          venue_name: string
        }[]
      }
      seat_label: { Args: { p_event_seat_id: string }; Returns: string }
      slugify: { Args: { p_input: string }; Returns: string }
      sync_payment_account: {
        Args: {
          p_charges_enabled: boolean
          p_details_submitted: boolean
          p_payouts_enabled: boolean
          p_requirements: Json
          p_secret: string
          p_stripe_account_id: string
        }
        Returns: Json
      }
      ticket_type_available: {
        Args: {
          p_ticket_type: Database["public"]["Tables"]["ticket_types"]["Row"]
        }
        Returns: number
      }
      undo_check_in: { Args: { p_ticket_id: string }; Returns: Json }
      validate_promo_code: {
        Args: { p_code: string; p_event_id: string; p_subtotal_cents: number }
        Returns: Json
      }
    }
    Enums: {
      discount_type: "percentage" | "fixed"
      event_status:
        | "draft"
        | "pending_review"
        | "published"
        | "paused"
        | "cancelled"
        | "completed"
      event_visibility: "public" | "unlisted" | "private"
      notification_type:
        | "order_confirmed"
        | "order_refunded"
        | "event_updated"
        | "event_cancelled"
        | "event_reminder"
        | "payout"
        | "system"
      order_status:
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      org_member_role: "owner" | "admin" | "staff" | "scanner"
      payment_provider: "stripe" | "sandbox"
      payment_status:
        | "requires_payment"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
      refund_status: "pending" | "succeeded" | "failed"
      reservation_status: "active" | "converted" | "expired" | "released"
      scan_result:
        | "valid"
        | "already_used"
        | "void"
        | "wrong_event"
        | "not_found"
      seat_status: "available" | "held" | "sold" | "blocked"
      seating_type: "general_admission" | "reserved_seating"
      ticket_status: "valid" | "used" | "void" | "refunded"
      user_role: "attendee" | "organizer" | "admin"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      discount_type: ["percentage", "fixed"],
      event_status: [
        "draft",
        "pending_review",
        "published",
        "paused",
        "cancelled",
        "completed",
      ],
      event_visibility: ["public", "unlisted", "private"],
      notification_type: [
        "order_confirmed",
        "order_refunded",
        "event_updated",
        "event_cancelled",
        "event_reminder",
        "payout",
        "system",
      ],
      order_status: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      org_member_role: ["owner", "admin", "staff", "scanner"],
      payment_provider: ["stripe", "sandbox"],
      payment_status: [
        "requires_payment",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      refund_status: ["pending", "succeeded", "failed"],
      reservation_status: ["active", "converted", "expired", "released"],
      scan_result: [
        "valid",
        "already_used",
        "void",
        "wrong_event",
        "not_found",
      ],
      seat_status: ["available", "held", "sold", "blocked"],
      seating_type: ["general_admission", "reserved_seating"],
      ticket_status: ["valid", "used", "void", "refunded"],
      user_role: ["attendee", "organizer", "admin"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
