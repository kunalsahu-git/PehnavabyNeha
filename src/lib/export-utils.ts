import { Parser } from 'json2csv';

/**
 * Converts JSON data to CSV and triggers a browser download.
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param fields Optional specific fields to include
 */
export function exportToCSV(data: any[], filename: string, fields?: string[]) {
  try {
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('CSV Export Error:', err);
  }
}
