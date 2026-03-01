import { useState, useCallback, useRef } from 'react';

export function useFileHandler(onFileLoaded) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.name.endsWith('.md')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileLoaded(e.target.result, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e) => {
      handleFile(e.target.files[0]);
    },
    [handleFile]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    isDragging,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onInputChange,
    openFilePicker,
  };
}
