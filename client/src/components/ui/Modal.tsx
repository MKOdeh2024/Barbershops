// src/components/ui/Modal.tsx
import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Optional size control
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md' // Default size
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key press to close modal
  useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
              onClose();
          }
      };
      if (isOpen) {
          window.addEventListener('keydown', handleEscape);
      }
      return () => {
          window.removeEventListener('keydown', handleEscape);
      };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  // Determine modal width based on size prop
  let sizeClasses = '';
  switch(size) {
      case 'sm': sizeClasses = 'max-w-sm'; break;
      case 'lg': sizeClasses = 'max-w-lg'; break;
      case 'xl': sizeClasses = 'max-w-xl'; break;
      case 'md':
      default: sizeClasses = 'max-w-md'; break;
  }

  // Use createPortal to render the modal into the body element
  // This ensures it's on top of other content and avoids CSS stacking context issues.
  // Ensure you have a <div id="modal-root"></div> in your public/index.html or _document.tsx body
  // For Next.js, checking for 'document' ensures client-side rendering for portal
  if (typeof document === 'undefined') return null; // Don't render server-side
  const modalRoot = document.getElementById('modal-root') || document.body; // Fallback to body

  return createPortal(
    // Overlay background
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={onClose} // Close modal when clicking overlay
      aria-modal="true"
      role="dialog"
    >
      {/* Modal Content Container */}
      <div
        className={`relative m-4 bg-white rounded-lg shadow-xl ${sizeClasses} w-full`}
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside content
      >
        {/* Modal Header (Optional) */}
        {(title || typeof onClose === 'function') && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            <button
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {children}
        </div>

        {/* Modal Footer (Optional - Can be added via children) */}
        {/* <div className="flex items-center justify-end p-4 border-t border-gray-200 rounded-b">
            <button>Footer Button</button>
        </div> */}
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;