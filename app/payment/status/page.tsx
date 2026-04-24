'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home, BookOpen } from 'lucide-react';
import Link from 'next/link';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status');
  const courseId = searchParams.get('courseId');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate some loading for better UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-100 rounded-full animate-pulse"></div>
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 absolute inset-0 m-auto" />
        </div>
        <p className="mt-6 text-gray-500 font-medium animate-pulse">Verifying your payment...</p>
      </div>
    );
  }

  const isSuccess = status === 'Success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[32px] shadow-2xl shadow-blue-500/5 border border-gray-100 overflow-hidden text-center p-8 md:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Icon Section */}
          <div className="flex justify-center mb-8">
            {isSuccess ? (
              <div className="relative">
                <div className="absolute inset-0 bg-green-100 rounded-full scale-150 blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-green-50 p-6 rounded-full">
                  <CheckCircle2 className="w-20 h-20 text-green-500" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-red-100 rounded-full scale-150 blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative bg-red-50 p-6 rounded-full">
                  <XCircle className="w-20 h-20 text-red-500" />
                </div>
              </div>
            )}
          </div>

          {/* Text Section */}
          <h1 className={`text-3xl font-black mb-4 ${isSuccess ? 'text-gray-900' : 'text-gray-900'}`}>
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            {isSuccess 
              ? "You've successfully enrolled in the course. Get ready to start your learning journey!" 
              : "Something went wrong with your transaction. Please try again or contact support."}
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            {isSuccess ? (
              <Link
                href={`/courses/${courseId}`}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95 group"
              >
                Go to Course
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href={`/courses/${courseId}`}
                className="flex items-center justify-center gap-2 w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-95"
              >
                Try Again
              </Link>
            )}
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all active:scale-95"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Support Section */}
        <p className="mt-8 text-center text-gray-400 text-sm">
          Having trouble? <a href="#" className="text-blue-500 font-semibold hover:underline">Contact our support team</a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentStatusContent />
    </Suspense>
  );
}
