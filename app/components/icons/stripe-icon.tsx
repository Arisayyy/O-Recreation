export function StripeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-slot="icon"
      className={className}
    >
      <rect width="16" height="16" fill="#533AFD" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.3 11.7L11.7 10.1307V4.3L4.3 5.88765V11.7Z"
        fill="white"
      />
    </svg>
  );
}

