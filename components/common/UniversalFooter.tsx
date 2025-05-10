export function UniversalFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="mt-2 py-2 text-center text-sm text-gray-500 border-t border-gray-300 w-full max-w-2xl mx-auto">
      <p>Pocket Score &copy; {currentYear} | a pk and dk app</p>
    </footer>
  );
} 