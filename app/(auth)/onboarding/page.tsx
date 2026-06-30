import React from 'react';
import AccountProfile from '@/components/forms/AccountProfile';

const page = () => {
  return (
    <main className="w-full max-w-md flex flex-col justify-center py-10 px-4 select-none">
      <div className="flex flex-col items-center mb-6">
        {/* Custom brand geometric logo */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-neutral-900 dark:text-neutral-50 mb-3.5"
          aria-hidden="true"
        >
          <path
            d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12V22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12L22 8.5M12 12L2 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="5.5" r="1.5" fill="currentColor" />
          <circle cx="6.5" cy="18.5" r="1.5" fill="currentColor" />
          <circle cx="17.5" cy="18.5" r="1.5" fill="currentColor" />
        </svg>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 text-center">
          Setup your profile
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 text-center">
          Tell us about yourself to customize your VibeShare feed
        </p>
      </div>
      <AccountProfile />
    </main>
  );
};

export default page;