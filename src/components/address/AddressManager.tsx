import React, { useState } from 'react';
import { useAddress } from '../../contexts/AddressContext';
import AddressCard from '../checkout/AddressCard';
import AddAddressModal from '../checkout/AddAddressModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import type { UserAddress, AddressFormData } from '../../types/address';
import { Plus, MapPin, Loader2 } from 'lucide-react';

interface AddressManagerProps {
  mode?: 'profile' | 'checkout';
  showAddButton?: boolean;
  compact?: boolean;
  onAddressSelect?: (addressId: string) => void;
}

const AddressManager: React.FC<AddressManagerProps> = ({
  mode = 'profile',
  showAddButton = true,
  compact = false,
  onAddressSelect
}) => {
  const {
    addresses,
    loading,
    error,
    selectedAddressId,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    selectAddress,
    getDefaultAddress,
    clearError
  } = useAddress();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<UserAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const handleSaveAddress = async (addressData: AddressFormData) => {
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, addressData);
      } else {
        await addAddress(addressData);
      }
      setIsAddModalOpen(false);
      setEditingAddress(null);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setAddressToDelete(address);
      setDeleteModalOpen(true);
    }
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteAddress(addressToDelete.id);
      setDeleteModalOpen(false);
      setAddressToDelete(null);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteAddress = () => {
    setDeleteModalOpen(false);
    setAddressToDelete(null);
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    selectAddress(addressId);
    if (onAddressSelect) {
      onAddressSelect(addressId);
    }
  };

  const defaultAddress = getDefaultAddress();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={clearError}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Compact mode for profile page
  if (compact && mode === 'profile') {
    return (
      <div className="space-y-4">
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`p-4 rounded-xl border ${
                  address.is_default
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {address.is_default && (
                  <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full mb-2">
                    Default
                  </span>
                )}
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{address.full_name}</p>
                  <p className="text-sm text-gray-600">{address.phone_number}</p>
                  <p className="text-sm text-gray-700">{address.address_line_1}</p>
                  {address.address_line_2 && (
                    <p className="text-sm text-gray-600">{address.address_line_2}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  {address.landmark && (
                    <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>
                  )}
                </div>
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => handleEditAddress(address)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  {!address.is_default && (
                    <>
                      <span className="text-sm text-gray-300">•</span>
                      <button
                        onClick={() => handleSetDefaultAddress(address.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Set as Default
                      </button>
                    </>
                  )}
                  {addresses.length > 1 && (
                    <>
                      <span className="text-sm text-gray-300">•</span>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Please add delivery address</p>
            {showAddButton && (
              <button
                onClick={handleAddAddress}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </button>
            )}
          </div>
        )}

        {showAddButton && addresses.length > 0 && (
          <div className="flex space-x-3">
            <button
              onClick={handleAddAddress}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </button>
          </div>
        )}

        {/* Add/Edit Address Modal - Added for compact mode */}
        <AddAddressModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingAddress(null);
          }}
          onSave={handleSaveAddress}
          editingAddress={editingAddress}
        />

        {/* Delete Confirmation Modal - Added for compact mode */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={cancelDeleteAddress}
          onConfirm={confirmDeleteAddress}
          address={addressToDelete}
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // Full mode for checkout page
  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No saved addresses found</p>
          {showAddButton && (
            <button
              onClick={handleAddAddress}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              isSelected={selectedAddressId === address.id || (mode === 'checkout' && defaultAddress?.id === address.id)}
              onSelect={handleAddressSelect}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              onSetDefault={handleSetDefaultAddress}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <AddAddressModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editingAddress={editingAddress}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={cancelDeleteAddress}
        onConfirm={confirmDeleteAddress}
        address={addressToDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AddressManager;
