'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Settings, User, Bell, Shield, CreditCard, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  const settingsOptions = [
    { title: 'Personal Information', icon: User, desc: 'Manage your name, avatar and bio' },
    { title: 'Notifications', icon: Bell, desc: 'Configure how you receive alerts' },
    { title: 'Security', icon: Shield, desc: 'Password and authentication settings' },
    { title: 'Billing', icon: CreditCard, desc: 'Manage your subscriptions and payments' },
  ];

  return (
    <MainLayout headerTitle={<h1 className="text-[16px] font-semibold text-[#374151]">Settings</h1>}>
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="mb-10">
          <h1 className="text-[32px] font-black text-[#1F2937] mb-2">Account Settings</h1>
          <p className="text-gray-500">Manage your account settings and set e-mail preferences.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
          {settingsOptions.map((option, idx) => (
            <div 
              key={option.title}
              className={`flex items-center justify-between p-6 hover:bg-gray-50 transition-all cursor-pointer group ${idx !== settingsOptions.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:bg-opacity-10 transition-colors">
                  <option.icon className="w-6 h-6 text-gray-400 group-hover:text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#374151]">{option.title}</h3>
                  <p className="text-[13px] text-gray-400 font-medium">{option.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transform group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>

        <div className="mt-10 p-8 border-2 border-dashed border-red-50 rounded-[32px] flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-bold text-red-500">Deactivate Account</h3>
            <p className="text-[13px] text-gray-400 font-medium">This will permanently delete your data and access.</p>
          </div>
          <button className="px-6 py-2.5 bg-red-50 text-red-500 text-[14px] font-black rounded-xl hover:bg-red-500 hover:text-white transition-all">
            Deactivate
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
