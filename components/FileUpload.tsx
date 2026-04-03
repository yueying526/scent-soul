import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onImageSelected: (base64: string, previewUrl: string) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onImageSelected, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const compressImage = (file: File, maxWidth = 800, quality = 0.8): Promise<{ base64: string; previewUrl: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        URL.revokeObjectURL(url);
        resolve({ base64, previewUrl: dataUrl });
      };
      img.src = url;
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const { base64, previewUrl } = await compressImage(file);
    onImageSelected(base64, previewUrl);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-rose-400 hover:bg-rose-50'}
        ${isDragging ? 'border-rose-500 bg-rose-50 scale-[1.02]' : 'border-stone-300 bg-white/50'}
      `}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      
      <div className="text-stone-400 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
      </div>
      
      <p className="text-lg font-serif text-stone-600 mb-2">
        Upload or Drop Portrait
      </p>
      <p className="text-sm text-stone-400">
        JPEG, PNG supported
      </p>
    </div>
  );
};
