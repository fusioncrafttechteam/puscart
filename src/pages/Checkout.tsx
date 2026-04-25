import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserAddresses } from '../hooks/useUserAddresses';
import AddressCard from '../components/checkout/AddressCard';
import AddAddressModal from '../components/checkout/AddAddressModal';
import type { UserAddress, AddressFormData } from '../types/address';
import { Plus, MapPin } from 'lucide-react';
import { createRazorpayOrder, verifyPayment, loadRazorpayScript } from '../services/razorpayService';

import logo from '../assets/Puscart logo.jpeg'

const Checkout: React.FC = () => {
    const { state: cartState } = useCart();
  const { appUser } = useAuth();
  
  // Address management states
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom hook for address management
  const {
    addresses,
    loading: addressesLoading,
    error: addressesError,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
  } = useUserAddresses(appUser?.id);

  if (cartState.items.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <Link to="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Auto-select default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = getDefaultAddress();
      setSelectedAddressId(defaultAddr?.id || addresses[0].id);
    }
  }, [addresses, selectedAddressId, getDefaultAddress]);

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

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
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(addressId);
        // Clear selection if deleted address was selected
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
        }
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handlePayment = async () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }

    if (!appUser) {
      alert('Please login to continue');
      return;
    }

    // Validate user ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(appUser.id)) {
      alert('Invalid user session. Please login again.');
      return;
    }

    // Step 5: Prevent double-click checkout
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // Get selected address details
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
      if (!selectedAddress) {
        throw new Error('Selected address not found');
      }

      // Format delivery address string
      const formattedAddress = `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? ', ' + selectedAddress.address_line_2 : ''}, ${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}`;

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create Razorpay order with complete order data
      const razorpayOrder = await createRazorpayOrder({
        amount: total,
        user_id: appUser.id,
        delivery_address: formattedAddress,
        phone: selectedAddress.phone_number,
        cart_items: cartState.items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.offer_price || item.product.price
        }))
      });

      // Order is already created in backend with Razorpay order ID, no need to update

      // Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Puscart Delivery',
        description: `Order #${razorpayOrder.order_id}`,
        order_id: razorpayOrder.razorpay_order_id,
        image: logo,
        prefill: {
          name: appUser?.name || '',
          email: appUser?.email || '',
          contact: selectedAddress.phone_number || ''
        },
        notes: {
          address: formattedAddress,
          order_id: razorpayOrder.order_id,
          user_id: appUser.id
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay using UPI Apps',
                instruments: [
                  {
                    method: 'upi',
                    apps: ['gpay', 'phonepe', 'paytm', 'bhim']
                  }
                ]
              }
            },
            hide: [
              {
                method: 'card'
              },
              {
                method: 'wallet'
              }
            ],
            sequence: ['block.banks', 'block.upi'],
            preferences: {
              show_default_blocks: true
            }
          }
        },
        handler: async function (response: any) {
          try {
            console.log('Razorpay response:', response);
            
            // Verify payment with backend
            await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });

            console.log('Payment verified successfully');
            
            // Clear cart after successful payment
            // TODO: Implement cart clearing
            
            // Redirect to success page
            navigate('/order-success', { state: { orderId: razorpayOrder.order_id } });
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support if amount was deducted.');
          }
        },
        modal: {
          ondismiss: async function () {
            console.log('Payment modal dismissed');
            setIsProcessing(false);
          },
          escape: true,
          handleback: true,
          confirm_close: true,
          animation: 'fade'
        },
        theme: {
          color: '#00C4CC',
          backdrop_color: '#ffffff'
        },
        retry: {
          enabled: true,
          max_count: 4
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deliveryFee = cartState.total >= 300 ? 0 : 50;
  const tax = cartState.total * 0.00;
  const total = cartState.total + deliveryFee + tax;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Delivery Address Selection */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                  <button
                    onClick={handleAddAddress}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>
                
                {addressesError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{addressesError}</p>
                  </div>
                )}
                
                {addressesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">No saved addresses found</p>
                    <button
                      onClick={handleAddAddress}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        isSelected={selectedAddressId === address.id}
                        onSelect={handleAddressSelect}
                        onEdit={handleEditAddress}
                        onDelete={handleDeleteAddress}
                        onSetDefault={handleSetDefaultAddress}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pay with Razorpay Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-linear-to-r from-blue-600 to-cyan-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🔒</span>
                    <span>Pay Securely with Razorpay</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Order Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartState.items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-3">
                    <img
                      src={item.product.image?.replace('http://localhost:', 'https://') || item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = logo;
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{((item.product.offer_price || item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{cartState.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Address Modal */}
      <AddAddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveAddress}
        editingAddress={editingAddress}
      />
    </div>
  );
};

export default Checkout;
