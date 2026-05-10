export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "admin";
export type ExamType = "TYT" | "AYT";
export type ActivityType = "Konu Anlatımı" | "Test Çözümü" | "Deneme";
export type ImageType = "deneme_sonucu" | "konu_analizi" | "soru_raporu";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          exam_type: ExamType;
          subject: string;
          topic: string;
          activity_type: ActivityType;
          resource_name: string;
          duration_minutes: number;
          total_questions: number | null;
          solved_questions: number | null;
          correct_answers: number | null;
          wrong_answers: number | null;
          empty_answers: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          exam_type: ExamType;
          subject: string;
          topic: string;
          activity_type: ActivityType;
          resource_name: string;
          duration_minutes: number;
          total_questions?: number | null;
          solved_questions?: number | null;
          correct_answers?: number | null;
          wrong_answers?: number | null;
          empty_answers?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          student_id?: string;
          date?: string;
          exam_type?: ExamType;
          subject?: string;
          topic?: string;
          activity_type?: ActivityType;
          resource_name?: string;
          duration_minutes?: number;
          total_questions?: number | null;
          solved_questions?: number | null;
          correct_answers?: number | null;
          wrong_answers?: number | null;
          empty_answers?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "study_sessions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      mock_exams: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          exam_type: ExamType;
          exam_name: string;
          source: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          exam_type: ExamType;
          exam_name: string;
          source?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          student_id?: string;
          date?: string;
          exam_type?: ExamType;
          exam_name?: string;
          source?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mock_exams_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      mock_exam_subject_results: {
        Row: {
          id: string;
          mock_exam_id: string;
          subject: string;
          total_questions: number;
          correct_answers: number;
          wrong_answers: number;
          empty_answers: number;
          net_score: number;
        };
        Insert: {
          id?: string;
          mock_exam_id: string;
          subject: string;
          total_questions: number;
          correct_answers: number;
          wrong_answers: number;
          empty_answers: number;
        };
        Update: {
          mock_exam_id?: string;
          subject?: string;
          total_questions?: number;
          correct_answers?: number;
          wrong_answers?: number;
          empty_answers?: number;
        };
        Relationships: [
          {
            foreignKeyName: "mock_exam_subject_results_mock_exam_id_fkey";
            columns: ["mock_exam_id"];
            isOneToOne: false;
            referencedRelation: "mock_exams";
            referencedColumns: ["id"];
          }
        ];
      };
      topic_question_results: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          exam_type: string;
          subject: string;
          topic: string;
          source: string | null;
          question_count: number;
          correct_count: number;
          wrong_count: number;
          empty_count: number;
          image_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          date: string;
          exam_type: string;
          subject: string;
          topic: string;
          source?: string | null;
          question_count: number;
          correct_count: number;
          wrong_count: number;
          empty_count: number;
          image_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          student_id?: string;
          date?: string;
          exam_type?: string;
          subject?: string;
          topic?: string;
          source?: string | null;
          question_count?: number;
          correct_count?: number;
          wrong_count?: number;
          empty_count?: number;
          image_url?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "topic_question_results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      uploaded_images: {
        Row: {
          id: string;
          student_id: string;
          uploaded_by: string;
          image_url: string;
          image_type: ImageType;
          extracted_text: string | null;
          ai_analysis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          uploaded_by: string;
          image_url: string;
          image_type: ImageType;
          extracted_text?: string | null;
          ai_analysis?: Json | null;
          created_at?: string;
        };
        Update: {
          student_id?: string;
          uploaded_by?: string;
          image_url?: string;
          image_type?: ImageType;
          extracted_text?: string | null;
          ai_analysis?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "uploaded_images_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "uploaded_images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: { user_id?: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type StudySession = Database["public"]["Tables"]["study_sessions"]["Row"];
export type MockExam = Database["public"]["Tables"]["mock_exams"]["Row"];
export type MockExamSubjectResult =
  Database["public"]["Tables"]["mock_exam_subject_results"]["Row"];
export type TopicQuestionResult =
  Database["public"]["Tables"]["topic_question_results"]["Row"];
export type UploadedImage = Database["public"]["Tables"]["uploaded_images"]["Row"];
