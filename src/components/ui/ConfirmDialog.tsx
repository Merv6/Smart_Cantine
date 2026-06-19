import React from 'react';
import { Button } from './index';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-slate-600 mb-6 font-medium">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={() => { onConfirm(); onClose(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white">Confirmer</Button>
        </div>
      </div>
    </div>
  );
}
