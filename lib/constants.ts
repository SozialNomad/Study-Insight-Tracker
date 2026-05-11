import type { ActivityType, ExamType, ImageType } from "@/lib/types/database";

export const EXAM_TYPES: ExamType[] = ["TYT", "AYT"];

export const SUBJECTS = [
  "Matematik",
  "Edebiyat",
  "Türkçe",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "Din Kültürü"
] as const;

export const ACTIVITY_TYPES: ActivityType[] = [
  "Konu Anlatımı",
  "Test Çözümü",
  "Deneme"
];

export const RESOURCE_SUGGESTIONS = [
  "Bilgi Sarmalı",
  "Benim Hocam",
  "345",
  "Apotemi",
  "Paraf",
  "Karekök"
];

export const IMAGE_TYPES: { value: ImageType; label: string }[] = [
  { value: "deneme_sonucu", label: "Deneme konu analizi" }
];
