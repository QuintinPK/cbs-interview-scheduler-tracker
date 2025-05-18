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

// Optimized location retrieval with caching and timeouts
let cachedLocation: { location: Location, timestamp: number } | null = null;
const LOCATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCurrentLocation = async (
  options: { highAccuracy?: boolean, timeout?: number } = {}
): Promise<Location | undefined> => {
  const now = Date.now();
  
  // Return cached location if available and recent
  if (cachedLocation && (now - cachedLocation.timestamp < LOCATION_CACHE_DURATION)) {
    return cachedLocation.location;
  }
  
  // Use low accuracy by default for speed, with short timeout
  const defaultOptions = {
    highAccuracy: false,
    timeout: 3000 // 3 seconds timeout
  };
  
  const { highAccuracy, timeout } = { ...defaultOptions, ...options };
  
  try {
    // Fast but low accuracy location first
    if (!navigator.geolocation) {
      return undefined;
    }
    
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: highAccuracy, 
          timeout: timeout,
          maximumAge: highAccuracy ? 0 : 60000 // Use cached position for non-high-accuracy
        }
      );
    });
    
    const location: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    
    // Cache this location
    cachedLocation = { location, timestamp: now };
    
    // If we initially requested low accuracy for speed, get higher accuracy in background
    if (!highAccuracy) {
      // Fetch better location in background without blocking UI
      setTimeout(() => {
        getCurrentLocation({ highAccuracy: true, timeout: 10000 })
          .then(betterLocation => {
            if (betterLocation) {
              cachedLocation = { location: betterLocation, timestamp: Date.now() };
            }
          })
          .catch(err => console.error("Background location error:", err));
      }, 0);
    }
    
    // Get address in background if needed
    if (!location.address) {
      getAddressFromCoordinates(location.latitude, location.longitude)
        .then(address => {
          if (address && cachedLocation) {
            cachedLocation.location.address = address;
          }
        })
        .catch(err => console.error("Error getting address:", err));
    }
    
    return location;
  } catch (error) {
    console.error("Error getting location:", error);
    return undefined;
  }
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string | undefined> => {
  try {
    // Check if browser has the Geocoder API
    if (!window.navigator || !('geolocation' in navigator)) {
      return undefined;
    }
    
    // Try to use the browser's built-in reverse geocoding if available
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { location: { lat: latitude, lng: longitude } },
          (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });
      
      if (response && response.length > 0) {
        return response[0].formatted_address;
      }
    }
    
    // Fallback to simple coordinate representation if geocoding not available
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    // Return simple coordinate string as fallback
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  }
};

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

// Validate data before syncing
export function validateSyncData(type: string, data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (type) {
    case 'SESSION_START':
      if (!data.interviewer_id) errors.push('Missing interviewer_id');
      if (!data.project_id) errors.push('Missing project_id');
      break;
      
    case 'SESSION_END':
      if (!data.end_time) errors.push('Missing end_time');
      break;
      
    case 'INTERVIEW_START':
      if (!data.session_id) errors.push('Missing session_id');
      break;
      
    case 'INTERVIEW_END':
      if (!data.end_time) errors.push('Missing end_time');
      break;
      
    case 'INTERVIEW_RESULT':
      if (!data.result) errors.push('Missing result');
      if (data.result !== 'response' && data.result !== 'non-response') {
        errors.push('Result must be either "response" or "non-response"');
      }
      break;
  }
  
  return { 
    valid: errors.length === 0,
    errors 
  };
}

// Function to generate a unique sync operation ID
export function generateSyncId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
