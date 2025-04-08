
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Location, Session } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('nl-NL', { 
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

export function calculateDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return "Ongoing";
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
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

export function exportToCSV(sessions: Session[]): void {
  // Headers
  let csvContent = "Interviewer Code,Start Date/Time,End Date/Time,Duration,Start Location,End Location\n";
  
  // Data
  sessions.forEach(session => {
    const row = [
      session.interviewerCode,
      session.startTime ? formatDateTime(session.startTime) : "",
      session.endTime ? formatDateTime(session.endTime) : "Ongoing",
      session.endTime ? calculateDuration(session.startTime, session.endTime) : "Ongoing",
      session.startLocation ? `${session.startLocation.latitude}, ${session.startLocation.longitude}` : "N/A",
      session.endLocation ? `${session.endLocation.latitude}, ${session.endLocation.longitude}` : "N/A"
    ];
    
    csvContent += row.join(",") + "\n";
  });
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `sessions_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
