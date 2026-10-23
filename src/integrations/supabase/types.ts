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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_rules: {
        Row: {
          active: boolean
          blocks_completion: boolean
          document_type: string
          due_days_after_enrollment: number | null
          id: string
          required_by_default: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          blocks_completion?: boolean
          document_type: string
          due_days_after_enrollment?: number | null
          id?: string
          required_by_default?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          blocks_completion?: boolean
          document_type?: string
          due_days_after_enrollment?: number | null
          id?: string
          required_by_default?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          created_at: string
          document_type: string
          due_at: string | null
          enrollment_id: string
          file_name: string | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          notes: string | null
          required: boolean
          status: string
          storage_path: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          document_type: string
          due_at?: string | null
          enrollment_id: string
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          required?: boolean
          status?: string
          storage_path?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          document_type?: string
          due_at?: string | null
          enrollment_id?: string
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          notes?: string | null
          required?: boolean
          status?: string
          storage_path?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_protocol_sequences: {
        Row: {
          academic_year: number
          last_number: number
        }
        Insert: {
          academic_year: number
          last_number?: number
        }
        Update: {
          academic_year?: number
          last_number?: number
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          academic_year: number
          cancellation_reason: string | null
          cancelled_at: string | null
          course_id: string
          created_at: string
          created_by: string
          enrolled_at: string | null
          id: string
          is_quota: boolean
          protocol: string
          quota_type: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          course_id: string
          created_at?: string
          created_by: string
          enrolled_at?: string | null
          id?: string
          is_quota?: boolean
          protocol: string
          quota_type?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          course_id?: string
          created_at?: string
          created_by?: string
          enrolled_at?: string | null
          id?: string
          is_quota?: boolean
          protocol?: string
          quota_type?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_documents: {
        Row: {
          created_at: string
          document_type: string
          enrollment_id: string
          error_message: string | null
          generated_at: string | null
          generated_by: string | null
          google_doc_id: string | null
          google_doc_url: string | null
          id: string
          pdf_storage_path: string | null
          status: string
          template_version: string
        }
        Insert: {
          created_at?: string
          document_type: string
          enrollment_id: string
          error_message?: string | null
          generated_at?: string | null
          generated_by?: string | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          pdf_storage_path?: string | null
          status?: string
          template_version: string
        }
        Update: {
          created_at?: string
          document_type?: string
          enrollment_id?: string
          error_message?: string | null
          generated_at?: string | null
          generated_by?: string | null
          google_doc_id?: string | null
          google_doc_url?: string | null
          id?: string
          pdf_storage_path?: string | null
          status?: string
          template_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          accredited_hospital: string | null
          allergy_details: string | null
          blood_type: string | null
          controlled_medication: boolean | null
          created_at: string
          emergency_name: string | null
          emergency_phone: string | null
          emergency_relationship: string | null
          enrollment_id: string
          family_hospital: string | null
          food_allergy: boolean | null
          food_allergy_details: string | null
          health_insurance: boolean | null
          health_notes: boolean | null
          health_notes_details: string | null
          id: string
          medication_allergy: boolean | null
          medication_details: string | null
          rh_factor: string | null
          updated_at: string
        }
        Insert: {
          accredited_hospital?: string | null
          allergy_details?: string | null
          blood_type?: string | null
          controlled_medication?: boolean | null
          created_at?: string
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          enrollment_id: string
          family_hospital?: string | null
          food_allergy?: boolean | null
          food_allergy_details?: string | null
          health_insurance?: boolean | null
          health_notes?: boolean | null
          health_notes_details?: string | null
          id?: string
          medication_allergy?: boolean | null
          medication_details?: string | null
          rh_factor?: string | null
          updated_at?: string
        }
        Update: {
          accredited_hospital?: string | null
          allergy_details?: string | null
          blood_type?: string | null
          controlled_medication?: boolean | null
          created_at?: string
          emergency_name?: string | null
          emergency_phone?: string | null
          emergency_relationship?: string | null
          enrollment_id?: string
          family_hospital?: string | null
          food_allergy?: boolean | null
          food_allergy_details?: string | null
          health_insurance?: boolean | null
          health_notes?: boolean | null
          health_notes_details?: string | null
          id?: string
          medication_allergy?: boolean | null
          medication_details?: string | null
          rh_factor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      parents_guardians: {
        Row: {
          address: string | null
          cpf_digits: string | null
          created_at: string
          email: string | null
          enrollment_id: string
          full_name: string | null
          id: string
          is_legal_guardian: boolean
          marital_status: string | null
          phone: string | null
          profession: string | null
          relationship_type: string
          rg: string | null
          rg_issuer: string | null
          status: string
          updated_at: string
          work_phone: string | null
          workplace: string | null
        }
        Insert: {
          address?: string | null
          cpf_digits?: string | null
          created_at?: string
          email?: string | null
          enrollment_id: string
          full_name?: string | null
          id?: string
          is_legal_guardian?: boolean
          marital_status?: string | null
          phone?: string | null
          profession?: string | null
          relationship_type: string
          rg?: string | null
          rg_issuer?: string | null
          status?: string
          updated_at?: string
          work_phone?: string | null
          workplace?: string | null
        }
        Update: {
          address?: string | null
          cpf_digits?: string | null
          created_at?: string
          email?: string | null
          enrollment_id?: string
          full_name?: string | null
          id?: string
          is_legal_guardian?: boolean
          marital_status?: string | null
          phone?: string | null
          profession?: string | null
          relationship_type?: string
          rg?: string | null
          rg_issuer?: string | null
          status?: string
          updated_at?: string
          work_phone?: string | null
          workplace?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_guardians_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          birthplace: string | null
          bolsa_familia: boolean | null
          cep_digits: string | null
          city: string | null
          cpf_digits: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          marital_status: string | null
          neighborhood: string | null
          pcd: boolean
          pcd_type: string | null
          phone: string | null
          previous_school: string | null
          race_color: string | null
          rg: string | null
          rg_issuer: string | null
          school_transport: boolean
          sex: string | null
          shirt_size: string | null
          social_name: string | null
          state: string | null
          transport_type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birthplace?: string | null
          bolsa_familia?: boolean | null
          cep_digits?: string | null
          city?: string | null
          cpf_digits?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          marital_status?: string | null
          neighborhood?: string | null
          pcd?: boolean
          pcd_type?: string | null
          phone?: string | null
          previous_school?: string | null
          race_color?: string | null
          rg?: string | null
          rg_issuer?: string | null
          school_transport?: boolean
          sex?: string | null
          shirt_size?: string | null
          social_name?: string | null
          state?: string | null
          transport_type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birthplace?: string | null
          bolsa_familia?: boolean | null
          cep_digits?: string | null
          city?: string | null
          cpf_digits?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          marital_status?: string | null
          neighborhood?: string | null
          pcd?: boolean
          pcd_type?: string | null
          phone?: string | null
          previous_school?: string | null
          race_color?: string | null
          rg?: string | null
          rg_issuer?: string | null
          school_transport?: boolean
          sex?: string | null
          shirt_size?: string | null
          social_name?: string | null
          state?: string | null
          transport_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_enrollment_transaction: {
        Args: {
          p_academic_year: number
          p_course_id: string
          p_is_quota: boolean
          p_quota_type: string
          p_student: Json
        }
        Returns: Json
      }
      current_active_role: { Args: never; Returns: string }
      delete_enrollment_transaction: {
        Args: { p_enrollment_id: string }
        Returns: Json
      }
      is_valid_cpf: { Args: { p_cpf: string }; Returns: boolean }
      transition_enrollment_status: {
        Args: { p_enrollment_id: string; p_new_status: string }
        Returns: Json
      }
      update_enrollment_transaction: {
        Args: {
          p_academic_year: number
          p_course_id: string
          p_enrollment_id: string
          p_is_quota: boolean
          p_quota_type: string
          p_student: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
