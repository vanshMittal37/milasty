import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Truck, RotateCcw, FileText } from 'lucide-react';

export default function LegalPage() {
  const location = useLocation();
  const path = location.pathname;

  const renderContent = () => {
    switch (path) {
      case '/shipping':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#4A3525' }}>
              <Truck size={28} color="#C89B3C" />
              <h1 style={{ fontSize: '2rem' }}>Shipping & Delivery Policy</h1>
            </div>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1.25rem' }}>
              At MILASTY, we believe in serving you the freshest millet bakes. All products are baked in small, artisanal batches upon order confirmation.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. Delivery Timelines</h3>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1rem' }}>
              Orders are freshly prepared and dispatched within 24 to 48 hours. Estimated delivery times across India range between 3 to 7 business days depending on your delivery location.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Shipping Charges</h3>
            <ul style={{ color: '#6B5B52', paddingLeft: '1.25rem', lineHeight: '1.7' }}>
              <li><strong>Orders Above ₹499:</strong> Free Pan-India Delivery.</li>
              <li><strong>Signature Trio Box:</strong> Free Delivery included.</li>
              <li><strong>Orders Below ₹499:</strong> Flat nominal shipping fee of ₹49.</li>
            </ul>
          </div>
        );

      case '/refund':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#4A3525' }}>
              <RotateCcw size={28} color="#C89B3C" />
              <h1 style={{ fontSize: '2rem' }}>Refund & Replacement Policy</h1>
            </div>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1.25rem' }}>
              Because our products are perishable food items baked fresh without artificial preservatives, we do not accept returns once a package has been opened.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. Damaged or Defective Items</h3>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1rem' }}>
              If your package arrives physically damaged or tampered with, we offer immediate replacement or full refund.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Mandatory Unboxing Video Requirement</h3>
            <p style={{ color: '#6B5B52', lineHeight: '1.7' }}>
              To claim a replacement for transit damage or missing items, an unedited 360° unboxing video recorded while opening the outer shipping seal is mandatory. Please WhatsApp the video to +91 89271 42056 within 24 hours of delivery.
            </p>
          </div>
        );

      case '/privacy':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#4A3525' }}>
              <ShieldCheck size={28} color="#C89B3C" />
              <h1 style={{ fontSize: '2rem' }}>Privacy Policy</h1>
            </div>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1.25rem' }}>
              Your privacy is deeply important to us. MILASTY does not sell, rent, or share customer contact details with third-party advertising brokers.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. Information We Collect</h3>
            <p style={{ color: '#6B5B52', lineHeight: '1.7' }}>
              When placing an order via our Ritual Basket, we collect your name, WhatsApp phone number, delivery address, and pincode solely for dispatching your fresh bakery shipment.
            </p>
          </div>
        );

      case '/terms':
      default:
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: '#4A3525' }}>
              <FileText size={28} color="#C89B3C" />
              <h1 style={{ fontSize: '2rem' }}>Terms & Conditions</h1>
            </div>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1.25rem' }}>
              Welcome to MILASTY. By accessing our platform or ordering our bakery products via WhatsApp, you agree to the following terms and conditions.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>1. WhatsApp Order Execution</h3>
            <p style={{ color: '#6B5B52', lineHeight: '1.7', marginBottom: '1rem' }}>
              All orders placed on MILASTY generate a pre-formatted WhatsApp order receipt. Orders are confirmed and scheduled for small-batch baking once payment is completed via UPI / bank transfer over WhatsApp chat.
            </p>
            <h3 style={{ fontSize: '1.2rem', color: '#4A3525', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Product Information & Allergen Disclaimer</h3>
            <p style={{ color: '#6B5B52', lineHeight: '1.7' }}>
              While all our products are free of Maida and Palm Oil, they are prepared in a bakery facility that processes tree nuts, wheat, and dairy (Pure Ghee).
            </p>
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="glass-card" style={{ padding: '3rem 2.5rem', backgroundColor: '#FFFFFF' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
