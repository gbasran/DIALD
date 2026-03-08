export interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  start: Date;
  end: Date | null;
  url: string;
  categories: string[];
  location: string;
}

/**
 * Parse an iCal date string into a Date object.
 * Handles 8-digit date-only (YYYYMMDD) and full datetime with Z suffix (YYYYMMDDTHHmmssZ).
 */
function parseICalDate(dateStr: string): Date {
  // Remove any TZID prefix (e.g., "TZID=America/Edmonton:20260415T235900")
  const colonIndex = dateStr.indexOf(':');
  const raw = colonIndex !== -1 ? dateStr.substring(colonIndex + 1) : dateStr;
  const cleaned = raw.trim();

  // Date-only: YYYYMMDD
  if (cleaned.length === 8) {
    const year = parseInt(cleaned.substring(0, 4), 10);
    const month = parseInt(cleaned.substring(4, 6), 10) - 1;
    const day = parseInt(cleaned.substring(6, 8), 10);
    return new Date(Date.UTC(year, month, day));
  }

  // Full datetime: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const year = parseInt(cleaned.substring(0, 4), 10);
  const month = parseInt(cleaned.substring(4, 6), 10) - 1;
  const day = parseInt(cleaned.substring(6, 8), 10);
  const hour = parseInt(cleaned.substring(9, 11), 10);
  const minute = parseInt(cleaned.substring(11, 13), 10);
  const second = parseInt(cleaned.substring(13, 15), 10);

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Unfold RFC 5545 continuation lines.
 * Lines longer than 75 chars are split with CRLF followed by a space or tab.
 */
function unfoldLines(icsText: string): string[] {
  // Normalize line endings to LF
  const normalized = icsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Unfold continuation lines (space or tab after newline)
  const unfolded = normalized.replace(/\n[ \t]/g, '');
  return unfolded.split('\n');
}

/**
 * Extract the value portion after the first colon in an iCal property line.
 * Handles properties with parameters (e.g., "DTSTART;VALUE=DATE:20260415").
 */
function getPropertyValue(line: string): string {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return '';
  return line.substring(colonIndex + 1);
}

/**
 * Unescape iCal text values per RFC 5545.
 */
function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\\\/g, '\\')
    .replace(/\\;/g, ';');
}

/**
 * Parse iCal text into an array of CalendarEvent objects.
 * Extracts VEVENT blocks with SUMMARY, DESCRIPTION, DTSTART, DTEND, UID, URL, CATEGORIES, LOCATION.
 */
export function parseICalEvents(icsText: string): CalendarEvent[] {
  const lines = unfoldLines(icsText);
  const events: CalendarEvent[] = [];

  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {
        uid: '',
        summary: '',
        description: '',
        end: null,
        url: '',
        categories: [],
        location: '',
      };
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inEvent && current.summary && current.start) {
        events.push(current as CalendarEvent);
      }
      inEvent = false;
      current = {};
      continue;
    }

    if (!inEvent) continue;

    // Match property name (before colon or semicolon)
    const propName = trimmed.split(/[;:]/)[0].toUpperCase();

    switch (propName) {
      case 'SUMMARY':
        current.summary = unescapeICalText(getPropertyValue(trimmed));
        break;
      case 'DESCRIPTION':
        current.description = unescapeICalText(getPropertyValue(trimmed));
        break;
      case 'DTSTART':
        current.start = parseICalDate(trimmed.substring(propName.length));
        break;
      case 'DTEND':
        current.end = parseICalDate(trimmed.substring(propName.length));
        break;
      case 'UID':
        current.uid = getPropertyValue(trimmed);
        break;
      case 'URL':
        current.url = getPropertyValue(trimmed);
        break;
      case 'CATEGORIES':
        current.categories = getPropertyValue(trimmed)
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        break;
      case 'LOCATION':
        current.location = unescapeICalText(getPropertyValue(trimmed));
        break;
    }
  }

  return events;
}
