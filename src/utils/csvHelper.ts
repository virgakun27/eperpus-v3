// Helper utility for generating CSV templates and parsing bulk upload files

export const CSV_TEMPLATE_HEADERS = [
  'NIS',
  'NISN',
  'Nama Lengkap',
  'Jenis Kelamin (L/P)',
  'Kelas',
  'Email',
  'No HP',
  'RFID Tag',
  'Username',
  'Password'
];

export const SAMPLE_TEMPLATE_ROWS = [
  [
    '2026010',
    '0081122334',
    'Andi Wijaya',
    'L',
    'X MIPA 1',
    'andi.w@sman1lumbung.sch.id',
    '081234567891',
    'RFID-SIS-2026010',
    '2026010',
    '123456'
  ],
  [
    '2026011',
    '0081122335',
    'Clarissa Putri',
    'P',
    'X MIPA 1',
    'clarissa@sman1lumbung.sch.id',
    '081234567892',
    'RFID-SIS-2026011',
    '2026011',
    '123456'
  ],
  [
    '2026012',
    '0081122336',
    'Deni Kurniawan',
    'L',
    'XI MIPA 1',
    'deni.k@sman1lumbung.sch.id',
    '081234567893',
    'RFID-SIS-2026012',
    'deni.k',
    '123456'
  ]
];

export const downloadCsvTemplate = () => {
  const csvContent = [
    CSV_TEMPLATE_HEADERS.join(','),
    ...SAMPLE_TEMPLATE_ROWS.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Import_Siswa_SMAN1Lumbung.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface ParsedCsvRow {
  rowIndex: number;
  nis: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  kelasName: string;
  email: string;
  phone: string;
  rfidCard: string;
  username: string;
  password: string;
  rawLine: string;
}

export const parseCsvContent = (text: string): ParsedCsvRow[] => {
  if (!text) return [];

  // Normalize line breaks
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const validLines = lines.filter(l => l.trim().length > 0);

  if (validLines.length <= 1) return []; // Only header or empty

  // Determine delimiter (, or ;)
  const headerLine = validLines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';

  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < validLines.length; i++) {
    const line = validLines[i].trim();
    if (!line) continue;

    // Simple robust CSV split handling quotes
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    if (cells.length === 0) continue;

    const nis = (cells[0] || '').trim();
    const nisn = (cells[1] || '').trim();
    const name = (cells[2] || '').trim();
    const genderRaw = (cells[3] || 'L').trim().toUpperCase();
    const gender: 'L' | 'P' = genderRaw === 'P' || genderRaw === 'PEREMPUAN' ? 'P' : 'L';
    const kelasName = (cells[4] || 'X MIPA 1').trim();
    const email = (cells[5] || '').trim();
    const phone = (cells[6] || '').trim();
    const rfidCard = (cells[7] || '').trim();
    const username = (cells[8] || nis).trim();
    const password = (cells[9] || '123456').trim();

    rows.push({
      rowIndex: i + 1, // Baris ke-N di file
      nis,
      nisn,
      name,
      gender,
      kelasName,
      email,
      phone,
      rfidCard,
      username,
      password,
      rawLine: line
    });
  }

  return rows;
};
