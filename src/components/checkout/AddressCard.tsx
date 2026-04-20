import React from 'react';
import type { AddressCardProps } from '../../types/address';
import { MapPin, Home, Briefcase, Building2, Edit, Trash2, Star } from 'lucide-react';

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const getAddressIcon = () => {
    switch (address.address_type) {
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'work':
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getAddressTypeColor = () => {
    switch (address.address_type) {
      case 'home':
        return 'bg-green-100 text-green-800';
      case 'work':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`relative bg-white rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={() => onSelect(address.id)}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}

      {/* Default badge */}
      {address.is_default && (
        <div className="absolute top-2 left-2 flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          <Star className="w-3 h-3 fill-current" />
          <span>Default</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Header with name and type */}
        <div className={`${address.is_default ? 'pt-8' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate pr-2">{address.full_name}</h3>
              <p className="text-sm text-gray-600">{address.phone_number}</p>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getAddressTypeColor()} shrink-0`}>
              {getAddressIcon()}
              <span className="capitalize">{address.address_type}</span>
            </div>
          </div>
        </div>

        {/* Address details */}
        <div className="space-y-1">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-700">
              <p>{address.address_line_1}</p>
              {address.address_line_2 && <p>{address.address_line_2}</p>}
              <p>{address.city}, {address.state} - {address.pincode}</p>
              {address.landmark && <p className="text-gray-500">Landmark: {address.landmark}</p>}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(address.id);
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isSelected ? 'Selected' : 'Deliver Here'}
          </button>

          {!address.is_default && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(address.id);
              }}
              className="py-2 px-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title="Set as default"
            >
              <Star className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address);
            }}
            className="py-2 px-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            title="Edit address"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(address.id);
            }}
            className="py-2 px-3 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            title="Delete address"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressCard;
