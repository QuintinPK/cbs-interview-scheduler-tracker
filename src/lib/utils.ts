
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Location } from "@/types";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatInTimeZone(date, 'America/Puerto_Rico', 'dd-MM-yyyy');
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return dateString || '';
  }
}

export function formatTime(date: Date | string) {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(d, 'America/Puerto_Rico', 'HH:mm');
  } catch (error) {
    console.error("Error formatting time:", error, date);
    return '';
  }
}

export function formatDateOnly(date: Date | string) {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(d, 'America/Puerto_Rico', 'dd-MM-yyyy');
  } catch (error) {
    console.error("Error formatting date only:", error, date);
    return '';
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, 'America/Puerto_Rico', 'dd-MM-yyyy HH:mm');
  } catch (error) {
    console.error("Error formatting date time:", error, dateString);
    return dateString || '';
  }
}

export function calculateDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return "Ongoing";

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
}

export async function getCurrentLocation(): Promise<Location | undefined> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          resolve(undefined);
        }
      );
    } else {
      resolve(undefined);
    }
  });
}

interface ExportSession {
  InterviewerCode: string;
  StartTime: string;
  EndTime: string;
  Duration: string;
  StartLocation: string;
  EndLocation: string;
  Status: string;
}

export function exportToCSV(data: ExportSession[]): void {
  // Headers
  let csvContent = "Interviewer Code,Start Date/Time,End Date/Time,Duration,Start Location,End Location\n";
  
  // Data
  data.forEach(row => {
    const csvRow = [
      row.InterviewerCode,
      row.StartTime,
      row.EndTime,
      row.Duration,
      row.StartLocation,
      row.EndLocation
    ];
    
    csvContent += csvRow.join(",") + "\n";
  });
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `sessions_export_${formatDateOnly(new Date())}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper function to convert UTC to AST (UTC-4)
export function toASTTime(date: Date | string): Date {
  if (!date) return new Date();
  
  const d = typeof date === 'string' ? parseISO(date) : date;
  // We're using America/Puerto_Rico timezone, which is AST (UTC-4)
  // The date-fns-tz package will handle this conversion internally
  return d;
}
