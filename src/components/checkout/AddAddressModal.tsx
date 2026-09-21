import React, { useState, useEffect } from 'react';
import type { AddAddressModalProps, AddressFormData } from '../../types/address';
import { X, MapPin } from 'lucide-react';

const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingAddress,
}) => {
  const [formData, setFormData] = useState<AddressFormData>({
    full_name: '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    address_type: 'home',
    is_default: false,
  });

  const [errors, setErrors] = useState<Partial<AddressFormData>>({});

  // Reset form when modal opens or editing address changes
  useEffect(() => {
    if (isOpen) {
      if (editingAddress) {
        setFormData({
          full_name: editingAddress.full_name,
          phone_number: editingAddress.phone_number,
          address_line_1: editingAddress.address_line_1,
          address_line_2: editingAddress.address_line_2 || '',
          city: editingAddress.city,
          state: editingAddress.state,
          pincode: editingAddress.pincode,
          landmark: editingAddress.landmark || '',
          address_type: editingAddress.address_type,
          is_default: editingAddress.is_default,
        });
      } else {
        setFormData({
          full_name: '',
          phone_number: '',
          address_line_1: '',
          address_line_2: '',
          city: '',
          state: '',
          pincode: '',
          landmark: '',
          address_type: 'home',
          is_default: false,
        });
      }
      setErrors({});
    }
  }, [isOpen, editingAddress]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Clear error for this field
    if (errors[name as keyof AddressFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressFormData> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = 'Address line 1 is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.replace(/\s/g, ''))) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {editingAddress ? 'Update your delivery address details' : 'Enter your delivery address details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/50 rounded-xl transition-all duration-200 hover:scale-105 shadow-md"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white/60 backdrop-blur-sm">
          {/* Full Name */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
              Full Name *
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                errors.full_name ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300 bg-white/70'
              }`}
              placeholder="Enter your full name"
            />
            {errors.full_name && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.full_name}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                errors.phone_number ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300 bg-white/70'
              }`}
              placeholder="Enter 10-digit phone number"
            />
            {errors.phone_number && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.phone_number}
              </p>
            )}
          </div>

          {/* Address Line 1 */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
              House/Flat/Street *
            </label>
            <input
              type="text"
              name="address_line_1"
              value={formData.address_line_1}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                errors.address_line_1 ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300 bg-white/70'
              }`}
              placeholder="Street address, building name"
            />
            {errors.address_line_1 && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                {errors.address_line_1}
              </p>
            )}
          </div>

          {/* Address Line 2 */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
              Area/Landmark
            </label>
            <input
              type="text"
              name="address_line_2"
              value={formData.address_line_2}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white/70"
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          {/* City, State, Pincode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                  errors.city ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300 bg-white/70'
                }`}
                placeholder="City"
              />
              {errors.city && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.city}
                </p>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                  errors.state ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300 bg-white/70'
                }`}
                placeholder="State"
              />
              {errors.state && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.state}
                </p>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                Pincode *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${
                  errors.pincode ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300 bg-white/70'
                }`}
                placeholder="6-digit pincode"
              />
              {errors.pincode && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.pincode}
                </p>
              )}
            </div>
          </div>

          {/* Landmark */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
              Landmark
            </label>
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white/70"
              placeholder="Nearby landmark for easy identification"
            />
          </div>

          {/* Address Type */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
              Address Type
            </label>
            <select
              name="address_type"
              value={formData.address_type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:border-gray-300 bg-white/70"
            >
              <option value="home">🏠 Home</option>
              <option value="work">🏢 Work</option>
              <option value="other">📍 Other</option>
            </select>
          </div>

          {/* Set as Default */}
          <div className="flex items-center space-x-3 p-4 bg-blue-50/50 rounded-xl border border-blue-200/50">
            <input
              type="checkbox"
              name="is_default"
              id="is_default"
              checked={formData.is_default}
              onChange={handleInputChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="is_default" className="text-sm font-medium text-gray-700 cursor-pointer">
              <span className="flex items-center gap-2">
                ⭐ Set as default address
                <span className="text-xs text-gray-500">(Will be used automatically at checkout)</span>
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:border-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {editingAddress ? '✏️ Update Address' : '💾 Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddressModal;
