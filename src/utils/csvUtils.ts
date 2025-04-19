
import { Island } from "@/types";

export interface CsvInterviewer {
  code: string;
  first_name: string;
  last_name: string;
  island?: Island;
  phone?: string;
  email?: string;
}

export const parseInterviewersCsv = (csvText: string): CsvInterviewer[] => {
  const lines = csvText.split('\n');
  
  // Skip header row and filter out empty lines
  return lines
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [code, firstName, lastName, island, phone, email] = line
        .split(',')
        .map(field => field.trim());

      // Validate island value
      const validIsland = island && ['Bonaire', 'Saba', 'Sint Eustatius'].includes(island) 
        ? island as Island 
        : undefined;

      return {
        code,
        first_name: firstName,
        last_name: lastName,
        island: validIsland,
        phone: phone || undefined,
        email: email || undefined
      };
    });
};
