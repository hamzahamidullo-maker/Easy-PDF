
import { jsPDF } from 'jspdf';
import { FileItem, ConversionOptions } from '../types';

export const convertToPdf = async (
  files: FileItem[], 
  options: ConversionOptions,
  onProgress: (overallProgress: number) => void
): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: 'mm',
    format: options.pageSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    
    // Progress calculation
    const currentProgress = Math.round(((i) / files.length) * 100);
    onProgress(currentProgress);

    if (i > 0) {
      doc.addPage();
    }

    try {
      if (item.type === 'image') {
        const imgData = await fileToDataURL(item.file);
        const imgProperties = await getImageProperties(imgData);
        
        // Calculate dimensions to fit within page margins
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        
        let width = imgProperties.width;
        let height = imgProperties.height;

        const ratio = width / height;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / ratio;
        }

        if (height > maxHeight) {
          height = maxHeight;
          width = height * ratio;
        }

        // Center the image
        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;

        doc.addImage(imgData, 'JPEG', x, y, width, height);
      } else if (item.type === 'text') {
        const text = await item.file.text();
        const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2));
        
        let cursorY = margin;
        for (const line of splitText) {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(line, margin, cursorY);
          cursorY += 7; // Line height approx
        }
      }
    } catch (error) {
      console.error(`Error processing file ${item.file.name}:`, error);
    }
  }

  onProgress(100);
  return doc.output('blob');
};

const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getImageProperties = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.src = dataUrl;
  });
};
