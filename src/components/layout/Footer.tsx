/**
 * フッターコンポーネント
 */
export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} MaruokaKPI. All rights reserved.
      </div>
    </footer>
  )
}
