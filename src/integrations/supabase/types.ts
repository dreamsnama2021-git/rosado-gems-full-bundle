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
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          name: string
          phone: string | null
          pincode: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          name: string
          phone?: string | null
          pincode: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          name?: string
          phone?: string | null
          pincode?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          description_html: string | null
          hero_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_html?: string | null
          hero_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_html?: string | null
          hero_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          approved: boolean
          author_email: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved?: boolean
          author_email?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved?: boolean
          author_email?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string
          body: string
          category_id: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          body: string
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          body?: string
          category_id?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          description_html: string | null
          hero_image: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_html?: string | null
          hero_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_html?: string | null
          hero_image?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      currency_rate_proposals: {
        Row: {
          applied_at: string | null
          created_at: string
          currencies: Json
          id: string
          note: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_by_email: string | null
          status: string
          submitted_by: string | null
          submitted_by_email: string | null
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          currencies?: Json
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_email?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email?: string | null
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          currencies?: Json
          id?: string
          note?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_by_email?: string | null
          status?: string
          submitted_by?: string | null
          submitted_by_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_messages: {
        Row: {
          author_email: string | null
          author_id: string | null
          author_name: string
          body: string
          created_at: string
          direction: string
          id: string
          order_id: string
          status_snapshot: string | null
          subject: string
          template_key: string | null
          visible_to_customer: boolean
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string
          body: string
          created_at?: string
          direction?: string
          id?: string
          order_id: string
          status_snapshot?: string | null
          subject?: string
          template_key?: string | null
          visible_to_customer?: boolean
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string
          body?: string
          created_at?: string
          direction?: string
          id?: string
          order_id?: string
          status_snapshot?: string | null
          subject?: string
          template_key?: string | null
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          created_by_email: string | null
          currency: string
          gateway: string
          gateway_refund_id: string | null
          id: string
          is_manual: boolean
          order_id: string
          raw: Json
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          currency?: string
          gateway: string
          gateway_refund_id?: string | null
          id?: string
          is_manual?: boolean
          order_id: string
          raw?: Json
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          currency?: string
          gateway?: string
          gateway_refund_id?: string | null
          id?: string
          is_manual?: boolean
          order_id?: string
          raw?: Json
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          awb_code: string | null
          cod_fee: number
          contact_email: string
          contact_name: string
          contact_phone: string | null
          courier_name: string | null
          created_at: string
          currency: string
          currency_rate: number
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          items: Json
          notes: string | null
          paid_at: string | null
          payment_gateway: string | null
          payment_method: string
          payment_status: string
          refunded_total: number
          shipping: number
          shipping_address: Json
          shiprocket_order_id: string | null
          shiprocket_shipment_id: string | null
          status: string
          subtotal: number
          tax: number
          tax_detail: Json
          total: number
          total_base: number | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          awb_code?: string | null
          cod_fee?: number
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          currency_rate?: number
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          items: Json
          notes?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          payment_status?: string
          refunded_total?: number
          shipping?: number
          shipping_address: Json
          shiprocket_order_id?: string | null
          shiprocket_shipment_id?: string | null
          status?: string
          subtotal: number
          tax?: number
          tax_detail?: Json
          total: number
          total_base?: number | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          awb_code?: string | null
          cod_fee?: number
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          currency_rate?: number
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          items?: Json
          notes?: string | null
          paid_at?: string | null
          payment_gateway?: string | null
          payment_method?: string
          payment_status?: string
          refunded_total?: number
          shipping?: number
          shipping_address?: Json
          shiprocket_order_id?: string | null
          shiprocket_shipment_id?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_detail?: Json
          total?: number
          total_base?: number | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          body: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean
          sections: Json
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          sections?: Json
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          sections?: Json
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          cashfree_app_id: string | null
          cashfree_enabled: boolean
          cashfree_mode: string
          cashfree_secret_key: string | null
          cashfree_webhook_secret: string | null
          created_at: string
          currency: string
          default_gateway: string
          id: string
          payoneer_api_key: string | null
          payoneer_division: string | null
          payoneer_enabled: boolean
          payoneer_merchant_code: string | null
          payoneer_mode: string
          payoneer_webhook_secret: string | null
          paypal_client_id: string | null
          paypal_client_secret: string | null
          paypal_enabled: boolean
          paypal_mode: string
          paypal_webhook_id: string | null
          razorpay_enabled: boolean
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          razorpay_mode: string
          razorpay_webhook_secret: string | null
          stripe_enabled: boolean
          stripe_mode: string
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_webhook_secret: string | null
          updated_at: string
        }
        Insert: {
          cashfree_app_id?: string | null
          cashfree_enabled?: boolean
          cashfree_mode?: string
          cashfree_secret_key?: string | null
          cashfree_webhook_secret?: string | null
          created_at?: string
          currency?: string
          default_gateway?: string
          id?: string
          payoneer_api_key?: string | null
          payoneer_division?: string | null
          payoneer_enabled?: boolean
          payoneer_merchant_code?: string | null
          payoneer_mode?: string
          payoneer_webhook_secret?: string | null
          paypal_client_id?: string | null
          paypal_client_secret?: string | null
          paypal_enabled?: boolean
          paypal_mode?: string
          paypal_webhook_id?: string | null
          razorpay_enabled?: boolean
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          razorpay_mode?: string
          razorpay_webhook_secret?: string | null
          stripe_enabled?: boolean
          stripe_mode?: string
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string
        }
        Update: {
          cashfree_app_id?: string | null
          cashfree_enabled?: boolean
          cashfree_mode?: string
          cashfree_secret_key?: string | null
          cashfree_webhook_secret?: string | null
          created_at?: string
          currency?: string
          default_gateway?: string
          id?: string
          payoneer_api_key?: string | null
          payoneer_division?: string | null
          payoneer_enabled?: boolean
          payoneer_merchant_code?: string | null
          payoneer_mode?: string
          payoneer_webhook_secret?: string | null
          paypal_client_id?: string | null
          paypal_client_secret?: string | null
          paypal_enabled?: boolean
          paypal_mode?: string
          paypal_webhook_id?: string | null
          razorpay_enabled?: boolean
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          razorpay_mode?: string
          razorpay_webhook_secret?: string | null
          stripe_enabled?: boolean
          stripe_mode?: string
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string | null
          event_type: string | null
          gateway: string
          headers: Json
          id: string
          last_recheck_at: string | null
          note: string | null
          order_id: string | null
          payload: Json
          processed_at: string | null
          raw_body: string
          received_at: string
          recheck_count: number
          signature: string | null
          signature_valid: boolean
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          event_type?: string | null
          gateway: string
          headers?: Json
          id?: string
          last_recheck_at?: string | null
          note?: string | null
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          raw_body?: string
          received_at?: string
          recheck_count?: number
          signature?: string | null
          signature_valid?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string | null
          event_type?: string | null
          gateway?: string
          headers?: Json
          id?: string
          last_recheck_at?: string | null
          note?: string | null
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          raw_body?: string
          received_at?: string
          recheck_count?: number
          signature?: string | null
          signature_valid?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_hex: string | null
          compare_at_price: number | null
          component: string | null
          created_at: string
          gemstone_color: string | null
          id: string
          image: string | null
          length: string | null
          metal: string | null
          plating: string | null
          price: number | null
          product_id: string
          size: string | null
          sku: string | null
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          compare_at_price?: number | null
          component?: string | null
          created_at?: string
          gemstone_color?: string | null
          id?: string
          image?: string | null
          length?: string | null
          metal?: string | null
          plating?: string | null
          price?: number | null
          product_id: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          compare_at_price?: number | null
          component?: string | null
          created_at?: string
          gemstone_color?: string | null
          id?: string
          image?: string | null
          length?: string | null
          metal?: string | null
          plating?: string | null
          price?: number | null
          product_id?: string
          size?: string | null
          sku?: string | null
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          carat: number | null
          category_id: string | null
          clarity: string | null
          compare_at_price: number | null
          created_at: string
          cut: string | null
          description: string | null
          gemstone: string | null
          id: string
          images: Json
          is_bestseller: boolean
          is_new: boolean
          is_trending: boolean
          meta_description: string | null
          meta_title: string | null
          metal: string | null
          name: string
          price: number
          price_overrides: Json
          sku: string | null
          slug: string
          sort_order: number
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          carat?: number | null
          category_id?: string | null
          clarity?: string | null
          compare_at_price?: number | null
          created_at?: string
          cut?: string | null
          description?: string | null
          gemstone?: string | null
          id?: string
          images?: Json
          is_bestseller?: boolean
          is_new?: boolean
          is_trending?: boolean
          meta_description?: string | null
          meta_title?: string | null
          metal?: string | null
          name: string
          price: number
          price_overrides?: Json
          sku?: string | null
          slug: string
          sort_order?: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          carat?: number | null
          category_id?: string | null
          clarity?: string | null
          compare_at_price?: number | null
          created_at?: string
          cut?: string | null
          description?: string | null
          gemstone?: string | null
          id?: string
          images?: Json
          is_bestseller?: boolean
          is_new?: boolean
          is_trending?: boolean
          meta_description?: string | null
          meta_title?: string | null
          metal?: string | null
          name?: string
          price?: number
          price_overrides?: Json
          sku?: string | null
          slug?: string
          sort_order?: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          ai_chat_enabled: boolean
          ai_chat_model: string | null
          ai_chat_persona: string | null
          blog_comments_enabled: boolean
          blog_comments_moderation: boolean
          blog_share_enabled: boolean
          body_scripts: string
          cod_enabled: boolean
          cod_fee: number
          cod_max_order: number
          cod_min_order: number
          created_at: string
          currencies: Json
          currency_symbol: string
          default_country: string
          default_currency: string
          email_templates: Json
          facebook_url: string | null
          footer_menu: Json
          free_shipping_threshold: number
          head_scripts: string
          header_menu: Json
          homepage: Json
          id: string
          instagram_url: string | null
          maintenance_enabled: boolean
          maintenance_eta: string
          maintenance_image: string
          maintenance_message: string
          maintenance_title: string
          mega_menu: Json
          ring_size_guide_enabled: boolean
          ring_size_guide_image: string
          ring_size_guide_note: string
          share_email: boolean
          share_facebook: boolean
          share_instagram: boolean
          share_twitter: boolean
          shipping_enabled: boolean
          shipping_flat_rate: number
          shiprocket_channel_id: string
          shiprocket_email: string
          shiprocket_enabled: boolean
          shiprocket_password: string
          shiprocket_pickup_location: string
          shiprocket_pickup_pincode: string
          social_share_enabled: boolean
          tax_enabled: boolean
          tax_inclusive: boolean
          tax_label: string
          tax_origin_state: string
          tax_rate: number
          twitter_url: string | null
          updated_at: string
          whatsapp_enabled: boolean
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          ai_chat_enabled?: boolean
          ai_chat_model?: string | null
          ai_chat_persona?: string | null
          blog_comments_enabled?: boolean
          blog_comments_moderation?: boolean
          blog_share_enabled?: boolean
          body_scripts?: string
          cod_enabled?: boolean
          cod_fee?: number
          cod_max_order?: number
          cod_min_order?: number
          created_at?: string
          currencies?: Json
          currency_symbol?: string
          default_country?: string
          default_currency?: string
          email_templates?: Json
          facebook_url?: string | null
          footer_menu?: Json
          free_shipping_threshold?: number
          head_scripts?: string
          header_menu?: Json
          homepage?: Json
          id?: string
          instagram_url?: string | null
          maintenance_enabled?: boolean
          maintenance_eta?: string
          maintenance_image?: string
          maintenance_message?: string
          maintenance_title?: string
          mega_menu?: Json
          ring_size_guide_enabled?: boolean
          ring_size_guide_image?: string
          ring_size_guide_note?: string
          share_email?: boolean
          share_facebook?: boolean
          share_instagram?: boolean
          share_twitter?: boolean
          shipping_enabled?: boolean
          shipping_flat_rate?: number
          shiprocket_channel_id?: string
          shiprocket_email?: string
          shiprocket_enabled?: boolean
          shiprocket_password?: string
          shiprocket_pickup_location?: string
          shiprocket_pickup_pincode?: string
          social_share_enabled?: boolean
          tax_enabled?: boolean
          tax_inclusive?: boolean
          tax_label?: string
          tax_origin_state?: string
          tax_rate?: number
          twitter_url?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          ai_chat_enabled?: boolean
          ai_chat_model?: string | null
          ai_chat_persona?: string | null
          blog_comments_enabled?: boolean
          blog_comments_moderation?: boolean
          blog_share_enabled?: boolean
          body_scripts?: string
          cod_enabled?: boolean
          cod_fee?: number
          cod_max_order?: number
          cod_min_order?: number
          created_at?: string
          currencies?: Json
          currency_symbol?: string
          default_country?: string
          default_currency?: string
          email_templates?: Json
          facebook_url?: string | null
          footer_menu?: Json
          free_shipping_threshold?: number
          head_scripts?: string
          header_menu?: Json
          homepage?: Json
          id?: string
          instagram_url?: string | null
          maintenance_enabled?: boolean
          maintenance_eta?: string
          maintenance_image?: string
          maintenance_message?: string
          maintenance_title?: string
          mega_menu?: Json
          ring_size_guide_enabled?: boolean
          ring_size_guide_image?: string
          ring_size_guide_note?: string
          share_email?: boolean
          share_facebook?: boolean
          share_instagram?: boolean
          share_twitter?: boolean
          shipping_enabled?: boolean
          shipping_flat_rate?: number
          shiprocket_channel_id?: string
          shiprocket_email?: string
          shiprocket_enabled?: boolean
          shiprocket_password?: string
          shiprocket_pickup_location?: string
          shiprocket_pickup_pincode?: string
          social_share_enabled?: boolean
          tax_enabled?: boolean
          tax_inclusive?: boolean
          tax_label?: string
          tax_origin_state?: string
          tax_rate?: number
          twitter_url?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
