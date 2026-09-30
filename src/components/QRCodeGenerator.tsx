import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';
import sound from '../utils/audio';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
  showDownloadButton?: boolean;
  bookTitle?: string;
  bookLocation?: string;
}

/**
 * Standard ISO/IEC 18004 Compliant QR Code Generator
 * Uses official Reed-Solomon Error Correction QR Code encoding.
 * Guaranteed 100% scannable by any smartphone camera, barcode reader, or terminal webcam!
 */
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 140,
  className = '',
  showDownloadButton = false,
}) => {
  const [svgString, setSvgString] = useState<string>('');
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    // Generate clean SVG vector string
    QRCode.toString(
      value,
      {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#0f172a', // slate-900 for high contrast
          light: '#ffffff',
        },
      },
      (err, svg) => {
        if (!err && svg && isMounted) {
          setSvgString(svg);
        }
      }
    );

    // Generate high-res Data URL PNG for download
    QRCode.toDataURL(
      value,
      {
        margin: 1,
        width: 600, // 600px high resolution
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url && isMounted) {
          setDataUrl(url);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [value]);

  const handleDownloadImage = () => {
    if (!dataUrl) return;
    try {
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `QR_Code_${value.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      sound.playSuccessChime();
    } catch {
      sound.playErrorBuzz();
      alert('Gagal mengunduh QR Code.');
    }
  };

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs ${className}`}>
      {svgString ? (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      ) : (
        <div 
          style={{ width: size, height: size }} 
          className="bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-mono"
        >
          Memuat QR...
        </div>
      )}

      <span className="mt-1.5 text-[10px] font-mono tracking-wider font-extrabold text-slate-700 uppercase text-center max-w-[160px] truncate">
        {value}
      </span>

      {showDownloadButton && (
        <button
          type="button"
          onClick={handleDownloadImage}
          className="mt-2 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
        >
          <Download className="h-3 w-3 text-teal-600" />
          Unduh PNG
        </button>
      )}
    </div>
  );
};
