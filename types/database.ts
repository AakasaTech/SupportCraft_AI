export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgPlan      = "free" | "pro" | "business";
export type UserRole     = "owner" | "admin" | "agent" | "viewer";
export type TicketStatus = "new" | "open" | "in_progress" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketSource   = "email" | "portal" | "chat" | "api" | "phone" | "manual";
export type ArticleStatus  = "draft" | "published";

export interface Database {
  public: {
    CompositeTypes: {
      [_ in never]: never;
    };
    Tables: {
      organizations: {
        Row: {
          id:             string;
          name:           string;
          slug:           string;
          plan:           OrgPlan;
          website:        string | null;
          timezone:       string;
          country:        string | null;
          support_email:  string | null;
          logo_url:       string | null;
          ticket_prefix:  string;
          ticket_counter:  number;
          freepass_plan:   string | null;
          freepass_until:  string | null;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id?:              string;
          name:             string;
          slug:             string;
          plan?:            OrgPlan;
          website?:         string | null;
          timezone?:        string;
          country?:         string | null;
          support_email?:   string | null;
          logo_url?:        string | null;
          ticket_prefix?:   string;
          ticket_counter?:  number;
          freepass_plan?:   string | null;
          freepass_until?:  string | null;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: {
          id?:              string;
          name?:            string;
          slug?:            string;
          plan?:            OrgPlan;
          website?:         string | null;
          timezone?:        string;
          country?:         string | null;
          support_email?:   string | null;
          logo_url?:        string | null;
          ticket_prefix?:   string;
          freepass_plan?:   string | null;
          freepass_until?:  string | null;
          updated_at?:      string;
        };
      };
      profiles: {
        Row: {
          id:         string;
          org_id:     string;
          role:       UserRole;
          full_name:  string;
          avatar_url: string | null;
          email:      string;
          timezone:   string;
          language:   string;
          phone:      string | null;
          job_title:  string | null;
          is_active:  boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id:          string;
          org_id:      string;
          role?:       UserRole;
          full_name:   string;
          avatar_url?: string | null;
          email:       string;
          timezone?:   string;
          language?:   string;
          phone?:      string | null;
          job_title?:  string | null;
          is_active?:  boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          org_id?:     string;
          role?:       UserRole;
          full_name?:  string;
          avatar_url?: string | null;
          email?:      string;
          timezone?:   string;
          language?:   string;
          phone?:      string | null;
          job_title?:  string | null;
          is_active?:  boolean;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id:          string;
          org_id:      string;
          email:       string;
          role:        UserRole;
          token:       string;
          invited_by:  string;
          expires_at:  string;
          accepted_at: string | null;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          org_id:       string;
          email:        string;
          role?:        UserRole;
          token?:       string;
          invited_by:   string;
          expires_at?:  string;
          accepted_at?: string | null;
          created_at?:  string;
        };
        Update: {
          accepted_at?: string | null;
        };
      };
      customers: {
        Row: {
          id:           string;
          org_id:       string;
          name:         string;
          email:        string;
          phone:        string | null;
          company:      string | null;
          notes:        string | null;
          auth_user_id: string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:           string;
          org_id:        string;
          name:          string;
          email:         string;
          phone?:        string | null;
          company?:      string | null;
          notes?:        string | null;
          auth_user_id?: string | null;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          name?:         string;
          email?:        string;
          phone?:        string | null;
          company?:      string | null;
          notes?:        string | null;
          auth_user_id?: string | null;
          updated_at?:   string;
        };
      };
      tickets: {
        Row: {
          id:                string;
          org_id:            string;
          ticket_number:     string | null;
          customer_id:       string | null;
          assignee_id:       string | null;
          title:             string;
          description:       string;
          status:            TicketStatus;
          priority:          TicketPriority;
          category:          string | null;
          department:        string | null;
          source:            TicketSource;
          tags:              string[];
          due_date:          string | null;
          first_response_at: string | null;
          resolved_at:       string | null;
          closed_at:         string | null;
          is_spam:           boolean;
          created_at:        string;
          updated_at:        string;
        };
        Insert: {
          id?:                string;
          org_id:             string;
          ticket_number?:     string | null;
          customer_id?:       string | null;
          assignee_id?:       string | null;
          title:              string;
          description:        string;
          status?:            TicketStatus;
          priority?:          TicketPriority;
          category?:          string | null;
          department?:        string | null;
          source?:            TicketSource;
          tags?:              string[];
          due_date?:          string | null;
          first_response_at?: string | null;
          resolved_at?:       string | null;
          closed_at?:         string | null;
          is_spam?:           boolean;
          created_at?:        string;
          updated_at?:        string;
        };
        Update: {
          ticket_number?:     string | null;
          customer_id?:       string | null;
          assignee_id?:       string | null;
          title?:             string;
          description?:       string;
          status?:            TicketStatus;
          priority?:          TicketPriority;
          category?:          string | null;
          department?:        string | null;
          source?:            TicketSource;
          tags?:              string[];
          due_date?:          string | null;
          first_response_at?: string | null;
          resolved_at?:       string | null;
          closed_at?:         string | null;
          is_spam?:           boolean;
          updated_at?:        string;
        };
      };
      ticket_messages: {
        Row: {
          id:          string;
          ticket_id:   string;
          author_id:   string | null;
          content:     string;
          is_ai:       boolean;
          is_customer: boolean;
          is_internal: boolean;
          edited_at:   string | null;
          metadata:    Json;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          ticket_id:    string;
          author_id?:   string | null;
          content:      string;
          is_ai?:       boolean;
          is_customer?: boolean;
          is_internal?: boolean;
          edited_at?:   string | null;
          metadata?:    Json;
          created_at?:  string;
        };
        Update: {
          content?:   string;
          edited_at?: string | null;
        };
      };
      departments: {
        Row: {
          id:          string;
          org_id:      string;
          name:        string;
          description: string | null;
          color:       string;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          org_id:       string;
          name:         string;
          description?: string | null;
          color?:       string;
          created_at?:  string;
        };
        Update: {
          name?:        string;
          description?: string | null;
          color?:       string;
        };
      };
      ticket_templates: {
        Row: {
          id:          string;
          org_id:      string;
          name:        string;
          subject:     string;
          body:        string;
          category:    string | null;
          department:  string | null;
          priority:    string;
          tags:        string[];
          created_by:  string | null;
          created_at:  string;
          updated_at:  string;
        };
        Insert: {
          id?:          string;
          org_id:       string;
          name:         string;
          subject:      string;
          body:         string;
          category?:    string | null;
          department?:  string | null;
          priority?:    string;
          tags?:        string[];
          created_by?:  string | null;
          created_at?:  string;
          updated_at?:  string;
        };
        Update: {
          name?:        string;
          subject?:     string;
          body?:        string;
          category?:    string | null;
          department?:  string | null;
          priority?:    string;
          tags?:        string[];
          updated_at?:  string;
        };
      };
      saved_views: {
        Row: {
          id:         string;
          org_id:     string;
          user_id:    string | null;
          name:       string;
          filters:    Json;
          is_shared:  boolean;
          created_at: string;
        };
        Insert: {
          id?:         string;
          org_id:      string;
          user_id?:    string | null;
          name:        string;
          filters?:    Json;
          is_shared?:  boolean;
          created_at?: string;
        };
        Update: {
          name?:      string;
          filters?:   Json;
          is_shared?: boolean;
        };
      };
      ticket_relations: {
        Row: {
          id:            string;
          ticket_id:     string;
          related_id:    string;
          relation_type: string;
          created_by:    string | null;
          created_at:    string;
        };
        Insert: {
          id?:            string;
          ticket_id:      string;
          related_id:     string;
          relation_type:  string;
          created_by?:    string | null;
          created_at?:    string;
        };
        Update: never;
      };
      ticket_attachments: {
        Row: {
          id:           string;
          ticket_id:    string;
          message_id:   string | null;
          org_id:       string;
          file_name:    string;
          file_size:    number;
          mime_type:    string;
          storage_path: string;
          uploaded_by:  string | null;
          created_at:   string;
        };
        Insert: {
          id?:          string;
          ticket_id:    string;
          message_id?:  string | null;
          org_id:       string;
          file_name:    string;
          file_size:    number;
          mime_type:    string;
          storage_path: string;
          uploaded_by?: string | null;
          created_at?:  string;
        };
        Update: never;
      };
      knowledge_articles: {
        Row: {
          id:         string;
          org_id:     string;
          title:      string;
          content:    string;
          status:     ArticleStatus;
          category:   string | null;
          tags:       string[];
          author_id:  string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?:         string;
          org_id:      string;
          title:       string;
          content:     string;
          status?:     ArticleStatus;
          category?:   string | null;
          tags?:       string[];
          author_id:   string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?:      string;
          content?:    string;
          status?:     ArticleStatus;
          category?:   string | null;
          tags?:       string[];
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id:                     string;
          org_id:                 string;
          paypal_subscription_id: string | null;
          plan:                   OrgPlan;
          status:                 string;
          current_period_end:     string | null;
          created_at:             string;
          updated_at:             string;
        };
        Insert: {
          id?:                     string;
          org_id:                  string;
          paypal_subscription_id?: string | null;
          plan?:                   OrgPlan;
          status?:                 string;
          current_period_end?:     string | null;
          created_at?:             string;
          updated_at?:             string;
        };
        Update: {
          paypal_subscription_id?: string | null;
          plan?:                   OrgPlan;
          status?:                 string;
          current_period_end?:     string | null;
          updated_at?:             string;
        };
      };
      ai_usage_logs: {
        Row: {
          id:          string;
          org_id:      string;
          feature:     string;
          provider:    string;
          tokens_used: number;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          org_id:       string;
          feature:      string;
          provider:     string;
          tokens_used?: number;
          created_at?:  string;
        };
        Update: never;
      };
      audit_logs: {
        Row: {
          id:          string;
          org_id:      string | null;
          user_id:     string | null;
          event:       string;
          metadata:    Json;
          ip_address:  string | null;
          user_agent:  string | null;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          org_id?:      string | null;
          user_id?:     string | null;
          event:        string;
          metadata?:    Json;
          ip_address?:  string | null;
          user_agent?:  string | null;
          created_at?:  string;
        };
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      org_plan:         OrgPlan;
      user_role:        UserRole;
      ticket_status:    TicketStatus;
      ticket_priority:  TicketPriority;
      article_status:   ArticleStatus;
    };
  };
}

// ─── Convenience types ────────────────────────────────────────────────────────

export type Organization    = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile         = Database["public"]["Tables"]["profiles"]["Row"];
export type Invitation      = Database["public"]["Tables"]["invitations"]["Row"];
export type Customer        = Database["public"]["Tables"]["customers"]["Row"];
export type Ticket          = Database["public"]["Tables"]["tickets"]["Row"];
export type TicketMessage   = Database["public"]["Tables"]["ticket_messages"]["Row"];
export type Department      = Database["public"]["Tables"]["departments"]["Row"];
export type TicketTemplate  = Database["public"]["Tables"]["ticket_templates"]["Row"];
export type SavedView       = Database["public"]["Tables"]["saved_views"]["Row"];
export type TicketRelation  = Database["public"]["Tables"]["ticket_relations"]["Row"];
export type TicketAttachment = Database["public"]["Tables"]["ticket_attachments"]["Row"];
export type KnowledgeArticle = Database["public"]["Tables"]["knowledge_articles"]["Row"];
export type Subscription    = Database["public"]["Tables"]["subscriptions"]["Row"];
export type AIUsageLog      = Database["public"]["Tables"]["ai_usage_logs"]["Row"];
export type AuditLog        = Database["public"]["Tables"]["audit_logs"]["Row"];

// ─── Composite types ──────────────────────────────────────────────────────────

export type TicketWithRelations = Ticket & {
  customer: Customer | null;
  assignee: Profile | null;
  messages: TicketMessage[];
};

export type TicketRow = Ticket & {
  customer: Pick<Customer, "id" | "name" | "email" | "company"> | null;
  assignee: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export type TicketMessageWithAuthor = TicketMessage & {
  author: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
};
