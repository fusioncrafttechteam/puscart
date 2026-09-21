import React from 'react';
import { Trash2, X, MapPin } from 'lucide-react';
import type { UserAddress } from '../../types/address';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  address: UserAddress | null;
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  address,
  isLoading = false,
}) => {
  if (!isOpen || !address) return null;

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-md w-full shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-red-50/50 to-orange-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Delete Address
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Address Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{address.full_name}</p>
                <p className="text-sm text-gray-600 mt-1">{address.phone_number}</p>
                <p className="text-sm text-gray-700 mt-1">{address.address_line_1}</p>
                {address.address_line_2 && (
                  <p className="text-sm text-gray-600">{address.address_line_2}</p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  {address.city}, {address.state} {address.pincode}
                </p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    address.address_type === 'home' 
                      ? 'bg-blue-100 text-blue-700'
                      : address.address_type === 'work'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {address.address_type === 'home' && '🏠 Home'}
                    {address.address_type === 'work' && '🏢 Work'}
                    {address.address_type === 'other' && '📍 Other'}
                  </span>
                  {address.is_default && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      ⭐ Default
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6 p-4 bg-red-50/50 rounded-xl border border-red-200/50">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Are you sure you want to delete this address?
                </p>
                <p className="text-sm text-red-600 mt-1">
                  This will permanently remove the address from your account. You'll need to add it again if you want to use it in the future.
                </p>
                {address.is_default && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    ⚠️ This is your default address. You'll need to set another address as default after deletion.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Address
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
